import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TicketIcon,
  UserIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './EmployeeTickets.css'

/**
 * EmployeeTickets (Admin) - HR/Immigration ticket management page
 * URL: /hrms/tickets
 * Based on UI_DESIGN_DOCS/04_EMPLOYEE_TICKETS.md, section 4.1–4.2
 */
function EmployeeTickets() {
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
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
    if (tenant?.tenant_id) {
      fetchTickets()
    }
  }, [tenant?.tenant_id, selectedBusiness?.business_id, dateRangeFilter, assignedToMeOnly, showClosed])

  const handleAssignToMe = async (ticketId) => {
    if (!user?.id || !tenant?.tenant_id) {
      alert('Unable to assign ticket: User not available')
      return
    }

    try {
      const { error } = await supabase
        .from('hrms_tickets')
        .update({ assigned_to: user.id })
        .eq('ticket_id', ticketId)
        .eq('tenant_id', tenant.tenant_id)

      if (error) throw error

      // Refresh tickets list
      await fetchTickets()
    } catch (err) {
      console.error('Error assigning ticket:', err)
      alert(`Failed to assign ticket: ${err.message || 'Unknown error'}`)
    }
  }

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!tenant?.tenant_id) {
        setError('Tenant not available')
        setLoading(false)
        return
      }

      // Build date range filter
      const now = new Date()
      let dateFrom = null
      switch (dateRangeFilter) {
        case 'today':
          dateFrom = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'last_7_days':
          dateFrom = new Date(now.setDate(now.getDate() - 7))
          break
        case 'last_30_days':
          dateFrom = new Date(now.setDate(now.getDate() - 30))
          break
        case 'last_90_days':
          dateFrom = new Date(now.setDate(now.getDate() - 90))
          break
        default:
          dateFrom = new Date(now.setDate(now.getDate() - 30))
      }

      // Build query
      let query = supabase
        .from('hrms_tickets')
        .select(`
          ticket_id,
          ticket_number,
          subject,
          department,
          request_type,
          status,
          priority,
          created_at,
          last_activity_at,
          assigned_to,
          assigned_team,
          employee:hrms_employees!hrms_tickets_employee_id_fkey(
            employee_id,
            first_name,
            last_name,
            employee_code
          ),
          business:businesses!hrms_tickets_business_id_fkey(
            business_id,
            business_name
          ),
          comments:hrms_ticket_comments(count)
        `)
        .eq('tenant_id', tenant.tenant_id)

      // Filter by business if selected
      if (selectedBusiness?.business_id) {
        query = query.eq('business_id', selectedBusiness.business_id)
      }

      // Filter by date range
      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString())
      }

      // Filter by assigned to me
      if (assignedToMeOnly && user?.id) {
        query = query.eq('assigned_to', user.id)
      }

      // Filter out closed tickets unless showClosed is true
      if (!showClosed) {
        query = query.not('status', 'in', '(closed,auto_closed)')
      }

      // Order at the end
      query = query.order('created_at', { ascending: false })

      const { data, error: queryError } = await query

      if (queryError) throw queryError

      // Transform data to match component format
      const transformedTickets = (data || []).map((ticket) => {
        const employee = ticket.employee || {}
        const business = ticket.business || {}
        const commentsCount = Array.isArray(ticket.comments) 
          ? ticket.comments.length 
          : (ticket.comments?.[0]?.count || 0)

        // Calculate hours ago
        const createdAt = new Date(ticket.created_at)
        const now = new Date()
        const hoursAgo = Math.floor((now - createdAt) / (1000 * 60 * 60))

        // Get assigned to name (simplified - would need to join with profiles)
        let assignedToName = null
        if (ticket.assigned_to) {
          // For now, use team name. In production, join with profiles table
          assignedToName = ticket.assigned_team === 'HR_Team' ? 'HR Admin' : 'Immigration Team'
        }

        return {
          id: ticket.ticket_id,
          ticketNumber: ticket.ticket_number,
          subject: ticket.subject,
          department: ticket.department,
          requestType: ticket.request_type,
          employeeName: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown',
          employeeCode: employee.employee_code || '',
          businessName: business.business_name || 'Unknown',
          createdAt: ticket.created_at,
          status: ticket.status,
          priority: ticket.priority || 'normal',
          assignedTo: assignedToName,
          assignedToId: ticket.assigned_to, // Store ID for filtering
          commentsCount,
          hoursAgo,
        }
      })

      setTickets(transformedTickets)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching tickets:', err)
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

      if (assignedToMeOnly && ticket.assignedToId !== user?.id) {
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

  // Calculate stats from actual tickets
  const hrTickets = tickets.filter((t) => t.department === 'HR')
  const immigrationTickets = tickets.filter((t) => t.department === 'Immigration')
  const hrCount = hrTickets.length
  const immigrationCount = immigrationTickets.length

  // Calculate quick stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const newToday = tickets.filter((t) => {
    const created = new Date(t.created_at)
    created.setHours(0, 0, 0, 0)
    return created.getTime() === today.getTime()
  }).length

  const inReview = tickets.filter((t) => 
    ['in_team_review', 'need_leadership_discussion', 'need_attorney_discussion', 'need_team_discussion'].includes(t.status)
  ).length

  const pendingResponse = tickets.filter((t) => 
    t.status === 'sent_to_candidate_review'
  ).length

  // Calculate average resolve time (simplified - would need resolved_at)
  const avgResolve = '2.3d' // TODO: Calculate from resolved_at when available

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
          <div className="stat-value">{newToday}</div>
          <div className="stat-icon blue">
            <TicketIcon />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Review</div>
          <div className="stat-value">{inReview}</div>
          <div className="stat-icon purple">
            <UserIcon />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Response</div>
          <div className="stat-value">{pendingResponse}</div>
          <div className="stat-icon green">
            <ClockIcon />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Resolve</div>
          <div className="stat-value">{avgResolve}</div>
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
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => handleAssignToMe(ticket.id)}
                    >
                      Assign to Me
                    </button>
                  )}
                  <Link to={`/hrms/tickets/${ticket.id}`} className="btn btn-primary">
                    View Ticket →
                  </Link>
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


