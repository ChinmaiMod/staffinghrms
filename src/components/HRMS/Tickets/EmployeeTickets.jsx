import { useEffect, useMemo, useState } from 'react'
import {
  TicketIcon,
  UserIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './EmployeeTickets.css'

/**
 * EmployeeTickets (Admin) - HR/Immigration ticket management page
 * URL: /hrms/tickets
 * Based on UI_DESIGN_DOCS/04_EMPLOYEE_TICKETS.md, section 4.1–4.2
 */
function EmployeeTickets() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tickets, setTickets] = useState([])

  const [activeTab, setActiveTab] = useState('HR') // 'HR' | 'Immigration'

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [requestTypeFilter, setRequestTypeFilter] = useState('all')
  const [dateRangeFilter, setDateRangeFilter] = useState('last_30_days')
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false)
  const [showClosed, setShowClosed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock data closely aligned with design examples
      const mockTickets = [
        {
          id: 'tkt-0045',
          ticketNumber: 'IESTKT0045',
          subject: 'Payroll Discrepancy - Missing December Bonus',
          department: 'HR',
          requestType: 'Payroll Discrepancy',
          employeeName: 'John Smith',
          employeeCode: 'IES00012',
          businessName: 'Intuites LLC',
          createdAt: '2025-12-15T10:00:00Z',
          status: 'ticket_created',
          priority: 'high',
          assignedTo: null,
          commentsCount: 0,
          hoursAgo: 2,
        },
        {
          id: 'tkt-0044',
          ticketNumber: 'IESTKT0044',
          subject: 'Benefits Enrollment Question',
          department: 'HR',
          requestType: 'Benefits Inquiry',
          employeeName: 'Mary Chen',
          employeeCode: 'IES00034',
          businessName: 'Intuites LLC',
          createdAt: '2025-12-14T09:00:00Z',
          status: 'in_team_review',
          priority: 'normal',
          assignedTo: 'HR Admin',
          commentsCount: 3,
          hoursAgo: 24,
        },
        {
          id: 'tkt-0041',
          ticketNumber: 'IESTKT0041',
          subject: 'Request for Employment Verification Letter',
          department: 'HR',
          requestType: 'Employment Verification',
          employeeName: 'Bob Wilson',
          employeeCode: 'IES00056',
          businessName: 'TechStaff Inc',
          createdAt: '2025-12-12T11:00:00Z',
          status: 'sent_to_candidate_review',
          priority: 'normal',
          assignedTo: 'HR Admin',
          commentsCount: 5,
          hoursAgo: 72,
          awaitingEmployee: true,
        },
        {
          id: 'tkt-0042',
          ticketNumber: 'IESTKT0042',
          subject: 'H1B Extension Filing Request',
          department: 'Immigration',
          requestType: 'H1B Extension',
          employeeName: 'John Doe',
          employeeCode: 'IES00015',
          businessName: 'Intuites LLC',
          createdAt: '2025-12-10T09:30:00Z',
          status: 'sent_to_candidate_review',
          priority: 'high',
          assignedTo: 'Immigration Team',
          commentsCount: 4,
          visaExpiry: '2026-03-15',
        },
        {
          id: 'tkt-0039',
          ticketNumber: 'IESTKT0039',
          subject: 'Green Card I-140 Status Update',
          department: 'Immigration',
          requestType: 'GC Processing',
          employeeName: 'Sarah Johnson',
          employeeCode: 'IES00023',
          businessName: 'Intuites LLC',
          createdAt: '2025-12-08T13:00:00Z',
          status: 'need_attorney_discussion',
          priority: 'high',
          assignedTo: 'Immigration Team',
          commentsCount: 7,
          attorneyReview: true,
        },
      ]

      setTimeout(() => {
        setTickets(mockTickets)
        setLoading(false)
      }, 300)
    } catch (err) {
      setError(err.message || 'Failed to load tickets')
      setLoading(false)
    }
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (ticket.department !== activeTab) return false

      if (!showClosed && ['closed', 'auto_closed'].includes(ticket.status)) {
        return false
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'open') {
          const openStatuses = [
            'ticket_created',
            'in_team_review',
            'need_leadership_discussion',
            'need_attorney_discussion',
            'need_team_discussion',
            'sent_to_candidate_review',
          ]
          if (!openStatuses.includes(ticket.status)) return false
        } else if (ticket.status !== statusFilter) {
          return false
        }
      }

      if (requestTypeFilter !== 'all' && ticket.requestType !== requestTypeFilter) {
        return false
      }

      if (assignedToMeOnly && ticket.assignedTo !== 'HR Admin') {
        return false
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matches =
          ticket.ticketNumber.toLowerCase().includes(q) ||
          ticket.subject.toLowerCase().includes(q) ||
          ticket.employeeName.toLowerCase().includes(q) ||
          ticket.employeeCode.toLowerCase().includes(q)
        if (!matches) return false
      }

      // dateRangeFilter currently not applied (mock only)
      return true
    })
  }, [tickets, activeTab, statusFilter, requestTypeFilter, assignedToMeOnly, showClosed, searchQuery, dateRangeFilter])

  const hrCount = tickets.filter((t) => t.department === 'HR').length
  const immigrationCount = tickets.filter((t) => t.department === 'Immigration').length

  if (loading) {
    return <LoadingSpinner message="Loading tickets..." />
  }

  return (
    <div className="employee-tickets-container">
      {/* Header */}
      <div className="employee-tickets-header">
        <div>
          <h1 className="page-title">Employee Tickets</h1>
          <p className="page-subtitle">Manage employee requests and inquiries</p>
        </div>
      </div>

      {/* HR / Immigration Tabs */}
      <div className="tickets-tabs">
        <button
          type="button"
          className={`tickets-tab ${activeTab === 'HR' ? 'active' : ''}`}
          onClick={() => setActiveTab('HR')}
        >
          HR ({hrCount})
        </button>
        <button
          type="button"
          className={`tickets-tab ${activeTab === 'Immigration' ? 'active' : ''}`}
          onClick={() => setActiveTab('Immigration')}
        >
          Immigration ({immigrationCount})
        </button>
      </div>

      {/* Quick Stats */}
      <div className="tickets-quick-stats">
        <div className="stat-card">
          <div className="stat-label">New Today</div>
          <div className="stat-value">5</div>
          <div className="stat-icon blue">
            <TicketIcon />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Review</div>
          <div className="stat-value">12</div>
          <div className="stat-icon purple">
            <UserIcon />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Response</div>
          <div className="stat-value">4</div>
          <div className="stat-icon green">
            <ClockIcon />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Resolve</div>
          <div className="stat-value">2.3d</div>
          <div className="stat-icon gray">
            <ArrowTrendingUpIcon />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tickets-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="ticket_created">Ticket Created</option>
              <option value="in_team_review">In Team Review</option>
              <option value="sent_to_candidate_review">Sent to Candidate</option>
              <option value="need_attorney_discussion">Need Attorney</option>
              <option value="closed">Closed</option>
              <option value="auto_closed">Auto-Closed</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="request-type-filter">Request Type</label>
            <select
              id="request-type-filter"
              value={requestTypeFilter}
              onChange={(e) => setRequestTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {activeTab === 'HR' ? (
                <>
                  <option value="Payroll Discrepancy">Payroll Discrepancy</option>
                  <option value="Benefits Inquiry">Benefits Inquiry</option>
                  <option value="Employment Verification">Employment Verification</option>
                </>
              ) : (
                <>
                  <option value="H1B Extension">H1B Extension</option>
                  <option value="GC Processing">GC Processing</option>
                </>
              )}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="date-range-filter">Date Range</label>
            <select
              id="date-range-filter"
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_90_days">Last 90 Days</option>
            </select>
          </div>

          <div className="search-wrapper">
            <FunnelIcon className="search-icon" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filters-row secondary">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={assignedToMeOnly}
              onChange={(e) => setAssignedToMeOnly(e.target.checked)}
            />
            Assigned to Me Only
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={(e) => setShowClosed(e.target.checked)}
            />
            Show Closed
          </label>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" onClick={fetchTickets}>
            Retry
          </button>
        </div>
      )}

      {/* Tickets List */}
      <div className="tickets-list">
        <div className="tickets-list-header">
          <h2>Tickets List</h2>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="empty-state">
            <p>No tickets match the current filters.</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className="ticket-row">
              <div className="ticket-main">
                <div className="ticket-title-line">
                  <span className="ticket-number">{ticket.ticketNumber}</span>
                  {ticket.priority === 'high' && <span className="priority-badge high">HIGH</span>}
                </div>
                <div className="ticket-subject">{ticket.subject}</div>
                <div className="ticket-meta">
                  <span>
                    👤 {ticket.employeeName} ({ticket.employeeCode})
                  </span>
                  <span>🏢 {ticket.businessName}</span>
                  <span>🏷️ {ticket.requestType}</span>
                  <span>📅 {new Date(ticket.createdAt).toLocaleDateString('en-US')}</span>
                </div>
                {ticket.awaitingEmployee && (
                  <div className="ticket-flag">
                    ⚠️ Awaiting employee response
                  </div>
                )}
                {ticket.attorneyReview && (
                  <div className="ticket-flag">
                    ⚖️ Attorney review in progress
                  </div>
                )}
              </div>
              <div className="ticket-side">
                <div className="ticket-status">{formatStatus(ticket.status)}</div>
                <div className="ticket-meta-secondary">
                  {ticket.commentsCount > 0 && (
                    <span>💬 {ticket.commentsCount} comments</span>
                  )}
                  {typeof ticket.hoursAgo === 'number' && (
                    <span>⏱️ {ticket.hoursAgo} hours ago</span>
                  )}
                </div>
                <div className="ticket-actions">
                  {!ticket.assignedTo && (
                    <button type="button" className="btn-outline">
                      Assign to Me
                    </button>
                  )}
                  <button type="button" className="btn-primary-outline">
                    View Ticket →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function formatStatus(status) {
  switch (status) {
    case 'ticket_created':
      return 'Ticket Created'
    case 'in_team_review':
      return 'In Team Review'
    case 'need_leadership_discussion':
      return 'Need to Discuss with Leadership'
    case 'need_attorney_discussion':
      return 'Need to Discuss with Attorney'
    case 'need_team_discussion':
      return 'Need to Discuss with Team'
    case 'sent_to_candidate_review':
      return 'Sent to Candidate for Review'
    case 'closed':
      return 'Closed'
    case 'auto_closed':
      return 'Auto-Closed'
    default:
      return status
  }
}

export default EmployeeTickets


