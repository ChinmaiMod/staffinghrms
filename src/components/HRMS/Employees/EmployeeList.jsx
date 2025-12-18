import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  EyeIcon,
  PencilIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  FolderIcon,
  ShieldCheckIcon,
  TrashIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'
import './EmployeeList.css'

// Employee type configuration with colors and icons
const EMPLOYEE_TYPES = {
  internal_india: { label: 'Internal India', bg: '#EDE9FE', text: '#5B21B6', icon: '🇮🇳' },
  internal_usa: { label: 'Internal USA', bg: '#DBEAFE', text: '#1E40AF', icon: '🇺🇸' },
  it_usa: { label: 'IT USA', bg: '#D1FAE5', text: '#065F46', icon: '💻' },
  nonit_usa: { label: 'Non-IT USA', bg: '#FFEDD5', text: '#9A3412', icon: '🏢' },
  healthcare_usa: { label: 'Healthcare USA', bg: '#FCE7F3', text: '#9D174D', icon: '🏥' }
}

// Status configuration with colors
const STATUS_CONFIG = {
  active: { label: 'Active', bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  inactive: { label: 'Inactive', bg: '#F3F4F6', text: '#374151', dot: '#6B7280' },
  on_leave: { label: 'On Leave', bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  terminated: { label: 'Terminated', bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' }
}

/**
 * Employee List - Main employee listing page with full functionality
 * Based on UI_DESIGN_DOCS/05_EMPLOYEE_MANAGEMENT.md
 */
// Removed duplicate EmployeeList definition. Use the correct one below.
function EmployeeList({ testMode = false }) {
  

  // TEMP FIX: Mock selectedBusiness for testMode or if not provided
  // TODO: Replace with context or prop as needed
  const selectedBusiness = null;

  // Core data state
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Selection state
  const [selectedRows, setSelectedRows] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  // Dropdown state
  const [openActionMenu, setOpenActionMenu] = useState(null)

  // Mock departments for filters
  const departments = ['Engineering', 'Sales', 'HR', 'Finance', 'Marketing', 'Operations', 'Healthcare']

  useEffect(() => {
    fetchEmployees()
    // eslint-disable-next-line
  }, [selectedBusiness])

  const fetchEmployees = async () => {
    try {
      if (testMode) {
        setEmployees([
          {
            id: 'emp-001',
            employee_code: 'IES00001',
            first_name: 'John',
            last_name: 'Smith',
            email: 'john.smith@company.com',
            avatar_url: null,
            employee_type: 'it_usa',
            employment_status: 'active',
            department: 'Engineering',
            start_date: '2023-03-15',
            active_projects: 2,
            compliance_pending: 0
          }
        ])
        setError(null)
        setLoading(false)
        return
      }
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('hrms_employees')
      //   .select(`
      //     *,
      //     department:departments(department_name),
      //     projects:hrms_projects(count),
      //     compliance:hrms_compliance_items(count)
      //   `)
      //   .eq('tenant_id', tenant?.id)
      //   .eq('business_id', selectedBusiness?.id || null)
      //   .order('created_at', { ascending: false })
      setLoading(true)
      setTimeout(() => {
        setEmployees([
          {
            id: 'emp-001',
            employee_code: 'IES00001',
            first_name: 'John',
            last_name: 'Smith',
            email: 'john.smith@company.com',
            avatar_url: null,
            employee_type: 'it_usa',
            employment_status: 'active',
            department: 'Engineering',
            start_date: '2023-03-15',
            active_projects: 2,
            compliance_pending: 0
          }
        ])
        setError(null)
        setLoading(false)
      }, 500)
    } catch (err) {
      setError('Failed to load employees')
      setLoading(false)
    }
  }

  // Filter employees based on search and filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          emp.first_name.toLowerCase().includes(query) ||
          emp.last_name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.employee_code.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }
      
      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(emp.employee_type)) {
        return false
      }
      
      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(emp.employment_status)) {
        return false
      }
      
      // Department filter
      if (selectedDepartment && emp.department !== selectedDepartment) {
        return false
      }
      
      return true
    })
  }, [employees, searchQuery, selectedTypes, selectedStatuses, selectedDepartment])

  // Paginated employees
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage
    return filteredEmployees.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredEmployees, currentPage, rowsPerPage])

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage)

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([])
    } else {
      setSelectedRows(paginatedEmployees.map(emp => emp.id))
    }
    setSelectAll(!selectAll)
  }

  // Handle row selection
  const handleRowSelect = (employeeId) => {
    setSelectedRows(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId)
      }
      return [...prev, employeeId]
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTypes([])
    setSelectedStatuses([])
    setSelectedDepartment('')
  }

  // Active filters for display
  const activeFilters = [
    ...selectedTypes.map(t => ({ type: 'type', value: t, label: EMPLOYEE_TYPES[t]?.label })),
    ...selectedStatuses.map(s => ({ type: 'status', value: s, label: STATUS_CONFIG[s]?.label })),
    ...(selectedDepartment ? [{ type: 'department', value: selectedDepartment, label: selectedDepartment }] : [])
  ]

  const removeFilter = (filter) => {
    if (filter.type === 'type') {
      setSelectedTypes(prev => prev.filter(t => t !== filter.value))
    } else if (filter.type === 'status') {
      setSelectedStatuses(prev => prev.filter(s => s !== filter.value))
    } else if (filter.type === 'department') {
      setSelectedDepartment('')
    }
  }

  // Export CSV handler
  const handleExportCSV = () => {
    // TODO: Implement CSV export via Edge Function
    console.log('Export CSV clicked')
  }

  if (loading) {
    return <LoadingSpinner message="Loading employees..." />
  }

  return (
    <div className="employee-list-container">
      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="selected-count">{selectedRows.length} selected</span>
          <div className="bulk-actions">
            <button className="bulk-action-btn">
              <EnvelopeIcon className="icon-sm" />
              Send Email
            </button>
            <button className="bulk-action-btn">
              <Cog6ToothIcon className="icon-sm" />
              Update Status
            </button>
            <button className="bulk-action-btn">
              <FolderIcon className="icon-sm" />
              Assign Tag
            </button>
          </div>
          <button className="bulk-cancel-btn" onClick={() => setSelectedRows([])}>
            Cancel
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="employee-list-header">
        <div>
          <h1 className="page-title">Employee Management</h1>
          <p className="page-subtitle">Manage all employees across your organization</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleExportCSV}>
            <ArrowDownTrayIcon className="icon-sm" />
            Export CSV
          </button>
          <button className="btn-secondary">
            <Cog6ToothIcon className="icon-sm" />
            Customize
          </button>
          <Link to="/hrms/employees/new" className="btn-primary">
            + Add Employee
          </Link>
        </div>
      </div>


      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search employees"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-employees-input"
            aria-label="Search employees"
          />
          <span className="search-shortcut">⌘K</span>
        </div>

        {/* Employee Type Filter Buttons */}
        <div className="employee-type-filters" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className={`btn-filter${selectedTypes.length === 0 ? ' active' : ''}`}
            onClick={() => setSelectedTypes([])}
            aria-label="Filter: All Employees"
            data-testid="filter-all-employees"
          >
            All Employees
          </button>
          {Object.entries(EMPLOYEE_TYPES).map(([key, config]) => (
            <button
              key={key}
              type="button"
              className={`btn-filter${selectedTypes.includes(key) ? ' active' : ''}`}
              onClick={() => setSelectedTypes(selectedTypes.includes(key) ? selectedTypes.filter(t => t !== key) : [...selectedTypes, key])}
              aria-label={`Filter: ${config.label}`}
              data-testid={`filter-${key}`}
            >
              {config.label}
            </button>
          ))}
        </div>

        <div className="filter-dropdowns">
          {/* Status Filter */}
          <div className="filter-dropdown">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !selectedStatuses.includes(e.target.value)) {
                  setSelectedStatuses([...selectedStatuses, e.target.value])
                }
              }}
            >
              <option value="">Status</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="filter-dropdown">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">Department</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          className={`btn-icon ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          title="Advanced Filters"
          aria-label="Advanced Filters"
        >
          <FunnelIcon className="icon-sm" />
        </button>
      </div>

      {/* Active Filter Tags */}
      {activeFilters.length > 0 && (
        <div className="active-filters">
          {activeFilters.map((filter, index) => (
            <span key={index} className="filter-tag">
              {filter.label}
              <button 
                className="filter-tag-remove"
                onClick={() => removeFilter(filter)}
              >
                <XMarkIcon className="icon-xs" />
              </button>
            </span>
          ))}
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear all
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-message">
          <p>Error loading employees: {error}</p>
          <button onClick={fetchEmployees} className="btn-primary">Retry</button>
        </div>
      )}

      {/* Empty State */}
      {!error && filteredEmployees.length === 0 && !loading && (
        <div className="empty-state">
          {employees.length === 0 ? (
            <>
              <h3>No Employees Found</h3>
              <p>Get started by adding your first employee.</p>
              <Link to="/hrms/employees/new" className="btn-primary">
                + Add Employee
              </Link>
            </>
          ) : (
            <>
              <h3>No Results Found</h3>
              <p>Try adjusting your search or filters.</p>
              <button className="btn-secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            </>
          )}
        </div>
      )}

      {/* Employee Table */}
      {filteredEmployees.length > 0 && (
        <>
          <div className="employee-table-wrapper">
            <table className="employee-table">
              <thead>
                <tr>
                  <th className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="col-employee">Employee</th>
                  <th className="col-type">Type</th>
                  <th className="col-status">Status</th>
                  <th className="col-department">Department</th>
                  <th className="col-date">Start Date</th>
                  <th className="col-projects">Projects</th>
                  <th className="col-compliance">Compliance</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map(employee => (
                  <tr 
                    key={employee.id}
                    className={selectedRows.includes(employee.id) ? 'selected' : ''}
                  >
                    <td className="col-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(employee.id)}
                        onChange={() => handleRowSelect(employee.id)}
                      />
                    </td>
                    <td className="col-employee">
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          {employee.avatar_url ? (
                            <img src={employee.avatar_url} alt="" />
                          ) : (
                            <span>{employee.first_name[0]}{employee.last_name[0]}</span>
                          )}
                        </div>
                        <div className="employee-info">
                          <Link 
                            to={`/hrms/employees/${employee.id}`}
                            className="employee-name"
                          >
                            {employee.first_name} {employee.last_name}
                          </Link>
                          <span className="employee-code">{employee.employee_code}</span>
                          <span className="employee-email">{employee.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="col-type">
                      <EmployeeTypeBadge type={employee.employee_type} />
                    </td>
                    <td className="col-status">
                      <StatusBadge status={employee.employment_status} />
                    </td>
                    <td className="col-department">{employee.department}</td>
                    <td className="col-date">
                      {new Date(employee.start_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="col-projects">
                      <span className="projects-count">{employee.active_projects}</span>
                    </td>
                    <td className="col-compliance">
                      <ComplianceBadge count={employee.compliance_pending} />
                    </td>
                    <td className="col-actions">
                      <div className="action-buttons">
                        <button 
                          className="action-btn"
                          onClick={() => navigate(`/hrms/employees/${employee.id}`)}
                          title="View"
                          aria-label="View"
                        >
                          <EyeIcon className="icon-sm" />
                        </button>
                        <button 
                          className="action-btn"
                          onClick={() => navigate(`/hrms/employees/${employee.id}/edit`)}
                          title="Edit"
                          aria-label="Edit"
                        >
                          <PencilIcon className="icon-sm" />
                        </button>
                        <div className="action-menu-wrapper">
                          <button 
                            className="action-btn"
                            onClick={() => setOpenActionMenu(
                              openActionMenu === employee.id ? null : employee.id
                            )}
                            title="More actions"
                            aria-label="More actions"
                          >
                            <EllipsisVerticalIcon className="icon-sm" />
                          </button>
                          {openActionMenu === employee.id && (
                            <ActionMenu 
                              employee={employee}
                              onClose={() => setOpenActionMenu(null)}
                            />
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredEmployees.length)} of {filteredEmployees.length} results
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="icon-sm" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                aria-label="Next page"
              >
                <ChevronRightIcon className="icon-sm" />
              </button>
            </div>
            <div className="rows-per-page">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Employee Type Badge Component
function EmployeeTypeBadge({ type }) {
  const config = EMPLOYEE_TYPES[type] || { label: type, bg: '#F3F4F6', text: '#374151', icon: '👤' }
  return (
    <span 
      className="type-badge"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <span className="type-icon">{config.icon}</span>
      {config.label}
    </span>
  )
}

// Status Badge Component
function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, bg: '#F3F4F6', text: '#374151', dot: '#6B7280' }
  return (
    <span 
      className="status-badge"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <span className="status-dot" style={{ backgroundColor: config.dot }}></span>
      {config.label}
    </span>
  )
}

// Compliance Badge Component
function ComplianceBadge({ count }) {
  if (count === 0) {
    return (
      <span className="compliance-badge success">
        <CheckCircleIcon className="icon-sm" />
      </span>
    )
  }
  
  const severity = count >= 4 ? 'critical' : count >= 1 ? 'warning' : 'success'
  return (
    <span className={`compliance-badge ${severity}`}>
      {count >= 4 ? (
        <ExclamationTriangleIcon className="icon-sm" />
      ) : null}
      {count}
    </span>
  )
}

// Action Menu Component
function ActionMenu({ employee, onClose }) {
  const navigate = useNavigate()
  
  const handleAction = (action) => {
    onClose()
    switch (action) {
      case 'documents':
        navigate(`/hrms/employees/${employee.id}?tab=documents`)
        break
      case 'projects':
        navigate(`/hrms/employees/${employee.id}?tab=projects`)
        break
      case 'compliance':
        navigate(`/hrms/employees/${employee.id}?tab=compliance`)
        break
      case 'email':
        window.location.href = `mailto:${employee.email}`
        break
      case 'note':
        // TODO: Open add note modal
        console.log('Add note for', employee.id)
        break
      case 'terminate':
        // TODO: Open termination confirmation modal
        console.log('Terminate', employee.id)
        break
      default:
        break
    }
  }

  return (
    <div className="action-menu">
      <button onClick={() => handleAction('documents')}>
        <DocumentTextIcon className="icon-sm" />
        View Documents
      </button>
      <button onClick={() => handleAction('projects')}>
        <FolderIcon className="icon-sm" />
        View Projects
      </button>
      <button onClick={() => handleAction('compliance')}>
        <ShieldCheckIcon className="icon-sm" />
        Compliance Status
      </button>
      <div className="menu-divider"></div>
      <button onClick={() => handleAction('email')}>
        <EnvelopeIcon className="icon-sm" />
        Send Email
      </button>
      <button onClick={() => handleAction('note')}>
        <ChatBubbleLeftIcon className="icon-sm" />
        Add Note
      </button>
      <div className="menu-divider"></div>
      <button className="danger" onClick={() => handleAction('terminate')}>
        <TrashIcon className="icon-sm" />
        Terminate Employee
      </button>
    </div>
  )
}

export default EmployeeList
