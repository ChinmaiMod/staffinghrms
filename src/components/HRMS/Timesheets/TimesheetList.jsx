import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ClockIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import BusinessFilter from '../../Shared/BusinessFilter'
import { useDebounce } from '../../../utils/debounce'
import './TimesheetList.css'

// Timesheet status configuration with colors
const TIMESHEET_STATUSES = {
  draft: { label: 'Draft', bg: '#F3F4F6', text: '#374151' },
  submitted: { label: 'Submitted', bg: '#DBEAFE', text: '#1E40AF' },
  approved: { label: 'Approved', bg: '#D1FAE5', text: '#065F46' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', text: '#991B1B' },
}

// Period types
const PERIOD_TYPES = {
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
  custom: 'Custom Range',
}

/**
 * TimesheetList - HRMS Timesheets view (Read-only with download)
 * URL: /hrms/timesheets
 * HRMS can only view and download timesheets - submission/approval happens in employee-portal
 */
function TimesheetList({ testMode = false }) {
  const { tenant, selectedBusiness } = useTenant()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timesheets, setTimesheets] = useState([])
  const [employees, setEmployees] = useState([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [statusFilter, setStatusFilter] = useState('all')
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [projects, setProjects] = useState([])
  const [periodType, setPeriodType] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // Initialize date range based on period type
  useEffect(() => {
    const today = new Date()
    let start, end

    switch (periodType) {
      case 'week':
        const dayOfWeek = today.getDay()
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        start = new Date(today.setDate(diff))
        end = new Date(start)
        end.setDate(start.getDate() + 6)
        break
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3)
        start = new Date(today.getFullYear(), quarter * 3, 1)
        end = new Date(today.getFullYear(), (quarter + 1) * 3, 0)
        break
      case 'year':
        start = new Date(today.getFullYear(), 0, 1)
        end = new Date(today.getFullYear(), 11, 31)
        break
      default:
        // Custom - use last 30 days as default
        end = new Date()
        start = new Date()
        start.setDate(end.getDate() - 30)
    }

    if (!startDate || periodType !== 'custom') {
      setStartDate(start.toISOString().split('T')[0])
    }
    if (!endDate || periodType !== 'custom') {
      setEndDate(end.toISOString().split('T')[0])
    }
  }, [periodType])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, employeeFilter, projectFilter, startDate, endDate, debouncedSearchQuery])

  useEffect(() => {
    if (testMode) {
      // Mock data for testing
      setTimesheets([
        {
          timesheet_id: 'ts-001',
          period_start_date: '2025-01-13',
          period_end_date: '2025-01-19',
          total_hours_worked: 32,
          regular_hours: 32,
          overtime_hours: 0,
          submission_status: 'approved',
          submitted_at: '2025-01-17T10:00:00Z',
          employee: {
            employee_id: 'emp-001',
            first_name: 'John',
            last_name: 'Smith',
            employee_code: 'IES00012',
          },
          project: {
            project_id: 'project-001',
            project_name: 'Acme Corp Dev',
          },
        },
      ])
      setTotalCount(1)
      setLoading(false)
      return
    }

    if (tenant?.tenant_id) {
      fetchTimesheets()
      fetchEmployees()
      fetchProjects()
    }
  }, [tenant?.tenant_id, selectedBusiness?.business_id, statusFilter, employeeFilter, projectFilter, startDate, endDate, searchQuery, currentPage, testMode])

  const fetchTimesheets = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!tenant?.tenant_id) {
        setError('Tenant not available')
        setLoading(false)
        return
      }

      let query = supabase
        .from('hrms_timesheets')
        .select(`
          timesheet_id,
          period_start_date,
          period_end_date,
          total_hours_worked,
          regular_hours,
          overtime_hours,
          submission_status,
          submitted_at,
          approved_at,
          employee:hrms_employees!hrms_timesheets_employee_id_fkey(
            employee_id,
            first_name,
            last_name,
            employee_code
          ),
          project:hrms_projects!hrms_timesheets_project_id_fkey(
            project_id,
            project_name
          )
        `, { count: 'exact' })
        .eq('tenant_id', tenant.tenant_id)
        .order('period_start_date', { ascending: false })

      // Filter by business if selected
      if (selectedBusiness?.business_id) {
        query = query.eq('business_id', selectedBusiness.business_id)
      }

      // Filter by date range - find timesheets that overlap with the selected range
      if (startDate) {
        query = query.gte('period_start_date', startDate)
      }
      if (endDate) {
        query = query.lte('period_end_date', endDate)
      }

      // Filter by status
      if (statusFilter !== 'all') {
        query = query.eq('submission_status', statusFilter)
      }

      // Filter by employee
      if (employeeFilter !== 'all') {
        query = query.eq('employee_id', employeeFilter)
      }

      // Filter by project
      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter)
      }

      // Pagination
      const from = (currentPage - 1) * rowsPerPage
      const to = from + rowsPerPage - 1
      query = query.range(from, to)

      const { data, error: queryError, count } = await query

      if (queryError) throw queryError

      setTimesheets(data || [])
      setTotalCount(count || 0)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching timesheets:', err)
      setError(err.message || 'Failed to load timesheets')
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      if (!tenant?.tenant_id) return

      const { data, error } = await supabase
        .from('hrms_employees')
        .select('employee_id, first_name, last_name, employee_code')
        .eq('tenant_id', tenant.tenant_id)
        .eq('is_active', true)
        .order('first_name', { ascending: true })

      if (error) throw error
      setEmployees(data || [])
    } catch (err) {
      console.error('Error fetching employees:', err)
    }
  }

  const fetchProjects = async () => {
    try {
      if (!tenant?.tenant_id) return

      const { data, error } = await supabase
        .from('hrms_projects')
        .select('project_id, project_name')
        .eq('tenant_id', tenant.tenant_id)
        .eq('project_status', 'active')
        .order('project_name', { ascending: true })

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((timesheet) => {
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase()
        const employeeName = `${timesheet.employee?.first_name || ''} ${timesheet.employee?.last_name || ''}`.toLowerCase()
        const employeeCode = timesheet.employee?.employee_code?.toLowerCase() || ''
        const projectName = timesheet.project?.project_name?.toLowerCase() || ''
        if (
          !employeeName.includes(query) &&
          !employeeCode.includes(query) &&
          !projectName.includes(query)
        ) {
          return false
        }
      }
      return true
    })
  }, [timesheets, debouncedSearchQuery])

  const totalPages = Math.ceil(totalCount / rowsPerPage)

  // Format date range
  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return '-'
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startStr}-${endStr}`
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Download PDF
  const handleDownloadPDF = async (timesheet) => {
    try {
      // TODO: Implement PDF generation via Edge Function
      console.log('Download PDF for timesheet:', timesheet.timesheet_id)
      alert('PDF download functionality will be implemented via Edge Function')
    } catch (err) {
      console.error('Error downloading PDF:', err)
      alert('Failed to download PDF')
    }
  }

  // Download Excel
  const handleDownloadExcel = async () => {
    try {
      // TODO: Implement Excel export via Edge Function
      const filters = {
        tenant_id: tenant?.tenant_id,
        business_id: selectedBusiness?.business_id,
        employee_id: employeeFilter !== 'all' ? employeeFilter : null,
        project_id: projectFilter !== 'all' ? projectFilter : null,
        status: statusFilter !== 'all' ? statusFilter : null,
        start_date: startDate,
        end_date: endDate,
      }
      console.log('Download Excel with filters:', filters)
      alert('Excel download functionality will be implemented via Edge Function')
    } catch (err) {
      console.error('Error downloading Excel:', err)
      alert('Failed to download Excel')
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading timesheets..." data-testid="loading-spinner" />
  }

  if (error) {
    return (
      <div className="timesheet-list-container">
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchTimesheets}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="timesheet-list-container">
      <BusinessFilter />
      <div className="timesheet-list-header">
        <div>
          <h1 className="page-title">Timesheets</h1>
          <p className="page-subtitle">View and download employee timesheets</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleDownloadExcel}>
            <DocumentArrowDownIcon className="icon-sm" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search employees, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            data-testid="search-timesheets-input"
          />
        </div>
        <div className="filter-group">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value)}
            className="filter-select"
            aria-label="Period Type"
          >
            {Object.entries(PERIOD_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {periodType === 'custom' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="filter-select"
                aria-label="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="filter-select"
                aria-label="End Date"
              />
            </>
          )}
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="filter-select"
            aria-label="Employee"
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.employee_id} value={emp.employee_id}>
                {emp.first_name} {emp.last_name} ({emp.employee_code})
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
            aria-label="Status"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="filter-select"
            aria-label="Project"
          >
            <option value="all">All Projects</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.project_name}
              </option>
            ))}
          </select>
          {(searchQuery || statusFilter !== 'all' || employeeFilter !== 'all' || projectFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setEmployeeFilter('all')
                setProjectFilter('all')
                setPeriodType('month')
              }}
              className="btn btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="timesheet-table-wrapper">
        <table className="timesheet-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Employee</th>
              <th>Project</th>
              <th>Hours</th>
              <th>Regular</th>
              <th>Overtime</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTimesheets.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  <p>No timesheets found</p>
                </td>
              </tr>
            ) : (
              filteredTimesheets.map((timesheet) => (
                <tr key={timesheet.timesheet_id}>
                  <td>{formatDateRange(timesheet.period_start_date, timesheet.period_end_date)}</td>
                  <td>
                    <div>
                      <div className="employee-name">
                        {timesheet.employee?.first_name} {timesheet.employee?.last_name}
                      </div>
                      <div className="employee-code">{timesheet.employee?.employee_code}</div>
                    </div>
                  </td>
                  <td>{timesheet.project?.project_name || '-'}</td>
                  <td>{timesheet.total_hours_worked}</td>
                  <td>{timesheet.regular_hours}</td>
                  <td>{timesheet.overtime_hours || 0}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: TIMESHEET_STATUSES[timesheet.submission_status]?.bg || '#F3F4F6',
                        color: TIMESHEET_STATUSES[timesheet.submission_status]?.text || '#374151',
                      }}
                    >
                      {TIMESHEET_STATUSES[timesheet.submission_status]?.label || timesheet.submission_status}
                    </span>
                  </td>
                  <td>{timesheet.submitted_at ? formatDate(timesheet.submitted_at) : '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <Link
                        to={`/hrms/timesheets/${timesheet.timesheet_id}`}
                        className="icon-button"
                        title="View"
                      >
                        <EyeIcon className="icon-sm" />
                      </Link>
                      <button
                        onClick={() => handleDownloadPDF(timesheet)}
                        className="icon-button"
                        title="Download PDF"
                      >
                        <ArrowDownTrayIcon className="icon-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="pagination-info">
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount} timesheets
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default TimesheetList
