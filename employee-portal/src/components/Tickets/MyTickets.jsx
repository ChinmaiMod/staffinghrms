import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import {
  TicketIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import './MyTickets.css'
import CreateTicketModal from './CreateTicketModal'

// Status configuration with colors
const STATUS_CONFIG = {
  ticket_created: {
    label: 'Ticket Created',
    bg: '#DBEAFE',
    text: '#1E40AF',
    badge: '#3B82F6',
    icon: CheckCircleIcon,
  },
  in_team_review: {
    label: 'In Team Review',
    bg: '#EDE9FE',
    text: '#5B21B6',
    badge: '#8B5CF6',
    icon: ClockIcon,
  },
  need_leadership_discussion: {
    label: 'Need to Discuss with Leadership',
    bg: '#FEF3C7',
    text: '#92400E',
    badge: '#F59E0B',
    icon: ExclamationCircleIcon,
  },
  need_attorney_discussion: {
    label: 'Need to Discuss with Attorney',
    bg: '#FCE7F3',
    text: '#9D174D',
    badge: '#EC4899',
    icon: ExclamationCircleIcon,
  },
  need_team_discussion: {
    label: 'Need to Discuss with Team',
    bg: '#CFFAFE',
    text: '#0E7490',
    badge: '#06B6D4',
    icon: ClockIcon,
  },
  sent_to_candidate_review: {
    label: 'Sent to Candidate for Review',
    bg: '#D1FAE5',
    text: '#065F46',
    badge: '#10B981',
    icon: CheckCircleIcon,
  },
  closed: {
    label: 'Closed',
    bg: '#F3F4F6',
    text: '#374151',
    badge: '#6B7280',
    icon: CheckCircleIcon,
  },
  auto_closed: {
    label: 'Auto-Closed',
    bg: '#F3F4F6',
    text: '#6B7280',
    badge: '#9CA3AF',
    icon: XMarkIcon,
  },
}

/**
 * MyTickets Component - Employee self-service ticket list
 * This is part of the standalone employee-portal app (not wired into Staffing HRMS).
 * Based on UI_DESIGN_DOCS/04_EMPLOYEE_TICKETS.md
 */
function MyTickets() {
  // In the standalone portal we don't yet wire real auth/tenant;
  // these will be injected via context when the employee-portal is fully built.

  // Core data state
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      // Mock demo data; replace with real API in the employee portal.
      setLoading(true)
      setTimeout(() => {
        setTickets([
          {
            ticket_id: 'tkt-001',
            ticket_number: 'TESTTKT0042',
            subject: 'Request for H1B Extension Filing',
            department: 'Immigration',
            request_type: 'H1B Extension',
            status: 'sent_to_candidate_review',
            created_at: '2025-12-10T09:30:00Z',
            last_activity_at: '2025-12-14T15:45:00Z',
            employee: {
              first_name: 'John',
              last_name: 'Doe',
              employee_code: 'IES00015',
            },
            unread_comments: 0,
            action_required: true,
          },
          {
            ticket_id: 'tkt-002',
            ticket_number: 'TESTTKT0038',
            subject: 'Payroll Discrepancy - November Overtime',
            department: 'HR',
            request_type: 'Payroll Discrepancy',
            status: 'in_team_review',
            created_at: '2025-12-05T10:15:00Z',
            last_activity_at: '2025-12-14T11:20:00Z',
            employee: {
              first_name: 'John',
              last_name: 'Doe',
              employee_code: 'IES00015',
            },
            unread_comments: 2,
            action_required: false,
          },
          {
            ticket_id: 'tkt-003',
            ticket_number: 'TESTTKT0025',
            subject: 'Employment Verification Letter',
            department: 'HR',
            request_type: 'Employment Verification',
            status: 'closed',
            created_at: '2025-11-28T14:00:00Z',
            last_activity_at: '2025-12-01T16:30:00Z',
            employee: {
              first_name: 'John',
              last_name: 'Doe',
              employee_code: 'IES00015',
            },
            unread_comments: 0,
            action_required: false,
          },
        ])
        setError(null)
        setLoading(false)
      }, 300)
    } catch (err) {
      setError(err.message || 'Failed to load tickets')
      setLoading(false)
    }
  }

  // Filter tickets based on search and filters
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          ticket.ticket_number.toLowerCase().includes(query) ||
          ticket.subject.toLowerCase().includes(query) ||
          ticket.request_type.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'open') {
          const openStatuses = [
            'ticket_created',
            'in_team_review',
            'need_leadership_discussion',
            'need_attorney_discussion',
            'need_team_discussion',
            'sent_to_candidate_review',
          ]
          if (!openStatuses.includes(ticket.status)) return false
        } else if (selectedStatus === 'pending_response') {
          if (ticket.status !== 'sent_to_candidate_review') return false
        } else if (selectedStatus === 'closed') {
          if (!['closed', 'auto_closed'].includes(ticket.status)) return false
        } else if (ticket.status !== selectedStatus) {
          return false
        }
      }

      // Department filter
      if (selectedDepartment !== 'all' && ticket.department !== selectedDepartment) {
        return false
      }

      return true
    })
  }, [tickets, searchQuery, selectedStatus, selectedDepartment])

  // Count tickets by status
  const statusCounts = useMemo(() => {
    const counts = {
      all: tickets.length,
      open: 0,
      pending_response: 0,
      closed: 0,
    }
    tickets.forEach((ticket) => {
      const openStatuses = [
        'ticket_created',
        'in_team_review',
        'need_leadership_discussion',
        'need_attorney_discussion',
        'need_team_discussion',
        'sent_to_candidate_review',
      ]
      if (openStatuses.includes(ticket.status)) counts.open++
      if (ticket.status === 'sent_to_candidate_review') counts.pending_response++
      if (['closed', 'auto_closed'].includes(ticket.status)) counts.closed++
    })
    return counts
  }, [tickets])

  const handleCreateTicket = () => {
    setShowCreateModal(true)
  }

  const handleTicketCreated = () => {
    setShowCreateModal(false)
    fetchTickets()
  }

  if (loading) {
    return (
      <div className="my-tickets-container">
        <p>Loading tickets...</p>
      </div>
    )
  }

  return (
    <div className="my-tickets-container">
      {/* Page Header */}
      <div className="my-tickets-header">
        <div>
          <h1 className="page-title">My Tickets</h1>
          <p className="page-subtitle">View and manage your support requests</p>
        </div>
        <button className="btn-primary" onClick={handleCreateTicket}>
          <PlusIcon className="icon-sm" />
          Create New Ticket
        </button>
      </div>

      {/* Filter & Status Tabs */}
      <div className="tickets-filters-section">
        <div className="status-tabs">
          <button
            type="button"
            className={`status-tab ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('all')}
          >
            All ({statusCounts.all})
          </button>
          <button
            type="button"
            className={`status-tab ${selectedStatus === 'open' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('open')}
          >
            Open ({statusCounts.open})
          </button>
          <button
            type="button"
            className={`status-tab ${selectedStatus === 'pending_response' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('pending_response')}
          >
            Pending Response ({statusCounts.pending_response})
          </button>
          <button
            type="button"
            className={`status-tab ${selectedStatus === 'closed' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('closed')}
          >
            Closed ({statusCounts.closed})
          </button>
        </div>

        <div className="tickets-filters">
          <div className="filter-group">
            <label htmlFor="department-filter">Department:</label>
            <select
              id="department-filter"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All</option>
              <option value="HR">HR</option>
              <option value="Immigration">Immigration</option>
            </select>
          </div>
          <div className="search-input-wrapper">
            <MagnifyingGlassIcon className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-message">
          <p>Error loading tickets: {error}</p>
          <button onClick={fetchTickets} className="btn-primary">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!error && filteredTickets.length === 0 && !loading && (
        <div className="empty-state">
          {tickets.length === 0 ? (
            <>
              <TicketIcon className="empty-icon" />
              <h3>No Tickets Found</h3>
              <p>You haven't created any tickets yet. Create your first ticket to get started.</p>
              <button className="btn-primary" onClick={handleCreateTicket}>
                <PlusIcon className="icon-sm" />
                Create New Ticket
              </button>
            </>
          ) : (
            <>
              <h3>No Results Found</h3>
              <p>Try adjusting your search or filters.</p>
            </>
          )}
        </div>
      )}

      {/* Tickets List */}
      {filteredTickets.length > 0 && (
        <div className="tickets-list">
          {filteredTickets.map((ticket) => (
            <article key={ticket.ticket_id} className="ticket-card" role="article">
              <div className="ticket-card-header">
                <div className="ticket-number">
                  <TicketIcon className="ticket-icon" />
                  {ticket.ticket_number}
                </div>
                {ticket.action_required && (
                  <div className="action-required-badge">
                    <ExclamationCircleIcon className="icon-sm" />
                    Action Required
                  </div>
                )}
              </div>

              <h3 className="ticket-subject">{ticket.subject}</h3>

              <div className="ticket-meta">
                <div className="ticket-badges">
                  <span className="department-badge">{ticket.department}</span>
                  <span className="request-type-badge">{ticket.request_type}</span>
                </div>
                <div className="ticket-dates">
                  <span className="ticket-date">
                    {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                  </span>
                  <StatusBadge status={ticket.status} />
                </div>
              </div>

              {ticket.unread_comments > 0 && (
                <div className="ticket-notification">
                  💬 {ticket.unread_comments} new comment
                  {ticket.unread_comments > 1 ? 's' : ''} since your last view
                </div>
              )}

              <div className="ticket-actions">
                <button className="btn-secondary">View Ticket →</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal onClose={() => setShowCreateModal(false)} onSuccess={handleTicketCreated} />
      )}
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ticket_created
  const Icon = config.icon

  return (
    <span className="status-badge" style={{ backgroundColor: config.bg, color: config.text }}>
      <Icon className="icon-xs" />
      {config.label}
    </span>
  )
}

export default MyTickets


