import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  CalendarIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './TimesheetList.css'

// Timesheet status configuration with colors
const TIMESHEET_STATUSES = {
  draft: { label: 'Draft', bg: '#F3F4F6', text: '#374151', icon: 'pencil' },
  submitted: { label: 'Submitted', bg: '#DBEAFE', text: '#1E40AF', icon: 'clock' },
  approved: { label: 'Approved', bg: '#D1FAE5', text: '#065F46', icon: 'check-circle' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', text: '#991B1B', icon: 'x-circle' },
}

/**
 * TimesheetList - My Timesheets list page
 * URL: /hrms/timesheets
 * Based on UI_DESIGN_DOCS/11_TIMESHEET_MANAGEMENT.md
 */
function TimesheetList({ testMode = false }) {
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timesheets, setTimesheets] = useState([])
  const [currentPeriodTimesheet, setCurrentPeriodTimesheet] = useState(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [projects, setProjects] = useState([])

  // View mode: 'list' or 'calendar'
  const [viewMode, setViewMode] = useState('list')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // Calculate current period (this week)
  const getCurrentPeriod = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
    const monday = new Date(today.setDate(diff))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    }
  }

  useEffect(() => {
    if (testMode) {
      // Mock data for testing
      const mockTimesheet = {
        timesheet_id: 'ts-001',
        period_start_date: '2025-01-13',
        period_end_date: '2025-01-19',
        total_hours_worked: 32,
        regular_hours: 32,
        overtime_hours: 0,
        submission_status: 'draft',
        project: {
          project_id: 'project-001',
          project_name: 'Acme Corp Dev',
        },
      }
      setTimesheets([mockTimesheet])
      setCurrentPeriodTimesheet(mockTimesheet)
      setTotalCount(1)
      setLoading(false)
      return
    }

    if (tenant?.tenant_id && user?.id) {
      fetchTimesheets()
      fetchProjects()
      fetchCurrentPeriodTimesheet()
    }
  }, [tenant?.tenant_id, selectedBusiness?.business_id, user?.id, statusFilter, projectFilter, currentPage, testMode])

  const fetchCurrentPeriodTimesheet = async () => {
    try {
      if (!tenant?.tenant_id || !user?.id) return

      const currentPeriod = getCurrentPeriod()

      const { data, error: queryError } = await supabase
        .from('hrms_timesheets')
        .select(`
          timesheet_id,
          period_start_date,
          period_end_date,
          total_hours_worked,
          regular_hours,
          overtime_hours,
          submission_status,
          project:hrms_projects!hrms_timesheets_project_id_fkey(
            project_id,
            project_name
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .eq('employee_id', user.id) // TODO: Get actual employee_id from user
        .eq('period_start_date', currentPeriod.start)
        .eq('period_end_date', currentPeriod.end)
        .maybeSingle()

      if (queryError) throw queryError
      setCurrentPeriodTimesheet(data)
    } catch (err) {
      console.error('Error fetching current period timesheet:', err)
    }
  }

  const fetchTimesheets = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!tenant?.tenant_id || !user?.id) {
        setError('Tenant or user not available')
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
          project:hrms_projects!hrms_timesheets_project_id_fkey(
            project_id,
            project_name
          )
        `, { count: 'exact' })
        .eq('tenant_id', tenant.tenant_id)
        .eq('employee_id', user.id) // TODO: Get actual employee_id from user
        .order('period_start_date', { ascending: false })

      // Filter by business if selected
      if (selectedBusiness?.business_id) {
        query = query.eq('business_id', selectedBusiness.business_id)
      }

      // Filter by status
      if (statusFilter !== 'all') {
        query = query.eq('submission_status', statusFilter)
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

  const fetchProjects = async () => {
    try {
      if (!tenant?.tenant_id || !user?.id) return

      const { data, error } = await supabase
        .from('hrms_projects')
        .select('project_id, project_name')
        .eq('tenant_id', tenant.tenant_id)
        .eq('employee_id', user.id) // TODO: Get actual employee_id from user
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
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const projectName = timesheet.project?.project_name?.toLowerCase() || ''
        if (!projectName.includes(query)) {
          return false
        }
      }
      return true
    })
  }, [timesheets, searchQuery])

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

  // Calculate progress percentage
  const getProgressPercentage = (hours) => {
    return Math.min((hours / 40) * 100, 100)
  }

  // Get progress color
  const getProgressColor = (percentage) => {
    if (percentage <= 50) return '#EF4444'
    if (percentage <= 80) return '#F59E0B'
    if (percentage <= 100) return '#10B981'
    return '#6366F1' // Overtime
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

  const currentPeriod = getCurrentPeriod()
  const currentPeriodFormatted = formatDateRange(currentPeriod.start, currentPeriod.end)

  return (
    <div className="timesheet-list-container">
      <div className="timesheet-list-header">
        <div>
          <h1 className="page-title">My Timesheets</h1>
          <p className="page-subtitle">Track and manage your working hours</p>
        </div>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
            >
              <CalendarIcon className="icon-sm" />
              Calendar
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <ListBulletIcon className="icon-sm" />
              List
            </button>
          </div>
          <Link to="/hrms/timesheets/new" className="btn btn-primary">
            <PlusIcon className="icon-sm" />
            New Timesheet
          </Link>
        </div>
      </div>

      {/* Current Period Card */}
      {currentPeriodTimesheet && (
        <div className="current-period-card">
          <div className="current-period-header">
            <h2>CURRENT PERIOD</h2>
            <span className="period-dates">{currentPeriodFormatted}</span>
          </div>
          <div className="current-period-content">
            <div className="hours-summary">
              <div className="hours-display">
                <span className="hours-text">
                  {currentPeriodTimesheet.total_hours_worked} / 40 hrs
                </span>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${getProgressPercentage(currentPeriodTimesheet.total_hours_worked)}%`,
                      backgroundColor: getProgressColor(getProgressPercentage(currentPeriodTimesheet.total_hours_worked)),
                    }}
                  />
                </div>
                <div className="hours-breakdown">
                  <span>Regular: {currentPeriodTimesheet.regular_hours} hrs</span>
                  {currentPeriodTimesheet.overtime_hours > 0 && (
                    <span>Overtime: {currentPeriodTimesheet.overtime_hours} hrs</span>
                  )}
                </div>
              </div>
            </div>
            <div className="status-summary">
              <div className="status-badge-large" style={{
                backgroundColor: TIMESHEET_STATUSES[currentPeriodTimesheet.submission_status]?.bg || '#F3F4F6',
                color: TIMESHEET_STATUSES[currentPeriodTimesheet.submission_status]?.text || '#374151',
              }}>
                {TIMESHEET_STATUSES[currentPeriodTimesheet.submission_status]?.label || currentPeriodTimesheet.submission_status}
              </div>
              <div className="period-actions">
                <Link
                  to={`/hrms/timesheets/${currentPeriodTimesheet.timesheet_id}`}
                  className="btn btn-secondary"
                >
                  Edit Timesheet
                </Link>
                {currentPeriodTimesheet.submission_status === 'draft' && (
                  <button className="btn btn-primary">
                    Submit for Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            data-testid="search-timesheets-input"
          />
        </div>
        <div className="filter-group">
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
          {(searchQuery || statusFilter !== 'all' || projectFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setProjectFilter('all')
              }}
              className="btn btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Timesheet Table */}
      {viewMode === 'list' && (
        <div className="timesheet-table-wrapper">
          <table className="timesheet-table">
            <thead>
              <tr>
                <th>Period</th>
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
                  <td colSpan="8" className="empty-state">
                    <p>No timesheets found</p>
                    <Link to="/hrms/timesheets/new" className="btn btn-primary">
                      Create First Timesheet
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredTimesheets.map((timesheet) => (
                  <tr key={timesheet.timesheet_id}>
                    <td>{formatDateRange(timesheet.period_start_date, timesheet.period_end_date)}</td>
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
                        {timesheet.submission_status === 'draft' && (
                          <Link
                            to={`/hrms/timesheets/${timesheet.timesheet_id}/edit`}
                            className="icon-button"
                            title="Edit"
                          >
                            <PencilIcon className="icon-sm" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar View - Placeholder */}
      {viewMode === 'calendar' && (
        <div className="calendar-view-placeholder">
          <p>Calendar view coming soon</p>
        </div>
      )}

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
