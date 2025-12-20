import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BriefcaseIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  MapIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import BusinessFilter from '../../Shared/BusinessFilter'
import { useDebounce } from '../../../utils/debounce'
import './ProjectList.css'

// Project status configuration with colors
const PROJECT_STATUSES = {
  active: { label: 'Active', bg: '#D1FAE5', text: '#065F46' },
  completed: { label: 'Completed', bg: '#DBEAFE', text: '#1E40AF' },
  on_hold: { label: 'On Hold', bg: '#FEF3C7', text: '#92400E' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#991B1B' },
}

/**
 * ProjectList - Employee Projects list page
 * URL: /hrms/projects
 * Based on UI_DESIGN_DOCS/08_EMPLOYEE_PROJECTS.md
 */
function ProjectList({ testMode = false }) {
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [projects, setProjects] = useState([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lcaOnlyFilter, setLcaOnlyFilter] = useState(false)
  const [employeeFilter, setEmployeeFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [employees, setEmployees] = useState([])
  const [clients, setClients] = useState([])

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, lcaOnlyFilter, employeeFilter, clientFilter, debouncedSearchQuery])

  useEffect(() => {
    if (testMode) {
      // Mock data for testing
      setProjects([
        {
          project_id: 'project-001',
          project_name: 'Acme Corp - Software Developer',
          project_code: 'PRJ-2025-001',
          project_status: 'active',
          project_start_date: '2025-01-15',
          project_end_date: '2025-12-31',
          actual_client_bill_rate: 85.00,
          is_lca_project: true,
          employee: {
            employee_id: 'emp-001',
            first_name: 'John',
            last_name: 'Smith',
            employee_code: 'IES00012',
            employee_type: 'it_usa',
          },
          end_client_name: 'Acme Corporation',
          hrms_project_vendors: [{ vendor_level: 4 }, { vendor_level: 3 }, { vendor_level: 2 }, { vendor_level: 1 }],
        },
      ])
      setTotalCount(1)
      setLoading(false)
      return
    }

    if (tenant?.tenant_id) {
      fetchProjects()
      fetchEmployees()
      fetchClients()
    }
  }, [tenant?.tenant_id, selectedBusiness?.business_id, searchQuery, statusFilter, lcaOnlyFilter, employeeFilter, clientFilter, currentPage, testMode])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!tenant?.tenant_id) {
        setError('Tenant not available')
        setLoading(false)
        return
      }

      // Build query with joins
      let query = supabase
        .from('hrms_projects')
        .select(`
          project_id,
          project_name,
          project_code,
          project_status,
          project_start_date,
          project_end_date,
          actual_client_bill_rate,
          is_lca_project,
          employee:hrms_employees!hrms_projects_employee_id_fkey(
            employee_id,
            first_name,
            last_name,
            employee_code,
            employee_type
          ),
          end_client_name,
          hrms_project_vendors(vendor_level)
        `, { count: 'exact' })
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false })

      // Filter by business if selected
      if (selectedBusiness?.business_id) {
        query = query.eq('business_id', selectedBusiness.business_id)
      }

      // Filter by status
      if (statusFilter !== 'all') {
        query = query.eq('project_status', statusFilter)
      }

      // Filter by LCA only
      if (lcaOnlyFilter) {
        query = query.eq('is_lca_project', true)
      }

      // Filter by employee
      if (employeeFilter !== 'all') {
        query = query.eq('employee_id', employeeFilter)
      }

      // Filter by client (search in end_client_name)
      if (clientFilter !== 'all') {
        query = query.eq('client_id', clientFilter)
      }

      // Filter by search query
      if (debouncedSearchQuery) {
        query = query.or(`project_name.ilike.%${debouncedSearchQuery}%,project_code.ilike.%${debouncedSearchQuery}%,end_client_name.ilike.%${debouncedSearchQuery}%`)
      }

      // Pagination
      const from = (currentPage - 1) * rowsPerPage
      const to = from + rowsPerPage - 1
      query = query.range(from, to)

      const { data, error: queryError, count } = await query

      if (queryError) throw queryError

      // Transform data
      const transformedProjects = (data || []).map((project) => ({
        project_id: project.project_id,
        project_name: project.project_name,
        project_code: project.project_code,
        project_status: project.project_status,
        project_start_date: project.project_start_date,
        project_end_date: project.project_end_date,
        actual_client_bill_rate: project.actual_client_bill_rate,
        is_lca_project: project.is_lca_project,
        employee: project.employee,
        end_client_name: project.end_client_name,
        vendor_count: Array.isArray(project.hrms_project_vendors) ? project.hrms_project_vendors.length : 0,
      }))

      setProjects(transformedProjects)
      setTotalCount(count || 0)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err.message || 'Failed to load projects')
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

  const fetchClients = async () => {
    try {
      if (!tenant?.tenant_id) return

      // Note: Clients are in CRM database, but we can query by end_client_name from projects
      // For now, we'll get unique client names from projects
      const { data, error } = await supabase
        .from('hrms_projects')
        .select('client_id, end_client_name')
        .eq('tenant_id', tenant.tenant_id)
        .not('client_id', 'is', null)

      if (error) throw error
      
      // Get unique clients
      const uniqueClients = Array.from(
        new Map((data || []).map(c => [c.client_id, c])).values()
      )
      setClients(uniqueClients)
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase()
        const employeeName = `${project.employee?.first_name || ''} ${project.employee?.last_name || ''}`.toLowerCase()
        const employeeCode = project.employee?.employee_code?.toLowerCase() || ''
        if (
          !project.project_name.toLowerCase().includes(query) &&
          !project.project_code?.toLowerCase().includes(query) &&
          !project.end_client_name.toLowerCase().includes(query) &&
          !employeeName.includes(query) &&
          !employeeCode.includes(query)
        ) {
          return false
        }
      }
      return true
    })
  }, [projects, debouncedSearchQuery])

  const totalPages = Math.ceil(totalCount / rowsPerPage)

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return `$${parseFloat(amount).toFixed(2)}/hr`
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading projects..." data-testid="loading-spinner" />
  }

  if (error) {
    return (
      <div className="project-list-container">
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchProjects}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="project-list-container">
      <BusinessFilter />
      <div className="project-list-header">
        <div>
          <h1 className="page-title">Employee Projects</h1>
          <p className="page-subtitle">Manage project assignments and vendor relationships</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => console.log('Export CSV')}>
            <ArrowDownTrayIcon className="icon-sm" />
            Export
          </button>
          <button className="btn btn-secondary" onClick={() => console.log('Vendor Map')}>
            <MapIcon className="icon-sm" />
            Vendor Map
          </button>
          <Link to="/hrms/projects/new" className="btn btn-primary">
            <PlusIcon className="icon-sm" />
            Add Project
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search projects, employees, clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            data-testid="search-projects-input"
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
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={lcaOnlyFilter}
              onChange={(e) => setLcaOnlyFilter(e.target.checked)}
              aria-label="LCA Only"
            />
            <span>LCA Only</span>
          </label>
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
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="filter-select"
            aria-label="Client"
          >
            <option value="all">All Clients</option>
            {clients.map((client) => (
              <option key={client.client_id} value={client.client_id}>
                {client.end_client_name}
              </option>
            ))}
          </select>
          {(searchQuery || statusFilter !== 'all' || lcaOnlyFilter || employeeFilter !== 'all' || clientFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setLcaOnlyFilter(false)
                setEmployeeFilter('all')
                setClientFilter('all')
              }}
              className="btn btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Project Table */}
      <div className="project-table-wrapper">
        <table className="project-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Employee</th>
              <th>End Client</th>
              <th>Bill Rate</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  <p>No projects found</p>
                  <Link to="/hrms/projects/new" className="btn btn-primary">
                    Add First Project
                  </Link>
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.project_id}>
                  <td>
                    <div className="project-name-cell">
                      <BriefcaseIcon className="project-icon" />
                      <div>
                        <Link to={`/hrms/projects/${project.project_id}`} className="project-name-link">
                          {project.project_name}
                        </Link>
                        <div className="project-code">{project.project_code}</div>
                        {project.vendor_count > 0 && (
                          <span className="vendor-count-badge">
                            {project.vendor_count} {project.vendor_count === 1 ? 'vendor' : 'vendors'}
                          </span>
                        )}
                        {project.vendor_count === 0 && (
                          <span className="vendor-count-badge">Direct</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="employee-name">
                        {project.employee?.first_name} {project.employee?.last_name}
                      </div>
                      <div className="employee-code">{project.employee?.employee_code}</div>
                    </div>
                  </td>
                  <td>{project.end_client_name}</td>
                  <td>
                    <div className="rate-cell">
                      <span>{formatCurrency(project.actual_client_bill_rate)}</span>
                      {project.is_lca_project && (
                        <span className="lca-badge" title="LCA Project - Rate must comply with prevailing wage">
                          <BuildingLibraryIcon className="lca-icon" />
                          LCA
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{formatDate(project.project_start_date)}</td>
                  <td>{project.project_end_date ? formatDate(project.project_end_date) : 'Ongoing'}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        project.project_status === 'active' ? 'status-active' :
                        project.project_status === 'completed' ? 'status-completed' :
                        project.project_status === 'on_hold' ? 'status-on-hold' :
                        'status-cancelled'
                      }`}
                      style={{
                        backgroundColor: PROJECT_STATUSES[project.project_status]?.bg || '#F3F4F6',
                        color: PROJECT_STATUSES[project.project_status]?.text || '#374151',
                      }}
                    >
                      {PROJECT_STATUSES[project.project_status]?.label || project.project_status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link
                        to={`/hrms/projects/${project.project_id}`}
                        className="icon-button"
                        title="View"
                      >
                        <EyeIcon className="icon-sm" />
                      </Link>
                      <Link
                        to={`/hrms/projects/${project.project_id}/edit`}
                        className="icon-button"
                        title="Edit"
                      >
                        <PencilIcon className="icon-sm" />
                      </Link>
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
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalCount)} of {totalCount} projects
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

export default ProjectList
