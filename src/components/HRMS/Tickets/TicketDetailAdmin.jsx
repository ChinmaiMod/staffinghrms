import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import {
  ArrowLeftIcon,
  TicketIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  BriefcaseIcon,
  PaperClipIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import { format, formatDistanceToNow } from 'date-fns'
import './TicketDetailAdmin.css'
import ChangeStatusModal from './ChangeStatusModal'

// Status configuration with colors
const STATUS_CONFIG = {
  ticket_created: { 
    label: 'Ticket Created', 
    bg: '#DBEAFE', 
    text: '#1E40AF', 
    badge: '#3B82F6',
    icon: CheckCircleIcon
  },
  in_team_review: { 
    label: 'In Team Review', 
    bg: '#EDE9FE', 
    text: '#5B21B6', 
    badge: '#8B5CF6',
    icon: ClockIcon
  },
  need_leadership_discussion: { 
    label: 'Need to Discuss with Leadership', 
    bg: '#FEF3C7', 
    text: '#92400E', 
    badge: '#F59E0B',
    icon: ExclamationCircleIcon
  },
  need_attorney_discussion: { 
    label: 'Need to Discuss with Attorney', 
    bg: '#FCE7F3', 
    text: '#9D174D', 
    badge: '#EC4899',
    icon: ExclamationCircleIcon
  },
  need_team_discussion: { 
    label: 'Need to Discuss with Team', 
    bg: '#CFFAFE', 
    text: '#0E7490', 
    badge: '#06B6D4',
    icon: ClockIcon
  },
  sent_to_candidate_review: { 
    label: 'Sent to Candidate for Review', 
    bg: '#D1FAE5', 
    text: '#065F46', 
    badge: '#10B981',
    icon: CheckCircleIcon
  },
  closed: { 
    label: 'Closed', 
    bg: '#F3F4F6', 
    text: '#374151', 
    badge: '#6B7280',
    icon: CheckCircleIcon
  },
  auto_closed: { 
    label: 'Auto-Closed', 
    bg: '#F3F4F6', 
    text: '#6B7280', 
    badge: '#9CA3AF',
    icon: XMarkIcon
  }
}

/**
 * TicketDetailAdmin Component - Admin ticket detail view with status management
 * Based on UI_DESIGN_DOCS/04_EMPLOYEE_TICKETS.md
 */
function TicketDetailAdmin({ testMode = false, errorMode = false, notFoundMode = false }) {
  const { ticketId } = useParams()
  const { selectedBusiness } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Core data state
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false)

  // Comment form state
  const [commentText, setCommentText] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [sendEmailNotification, setSendEmailNotification] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    fetchTicket()
    // eslint-disable-next-line
  }, [ticketId, selectedBusiness])

  const fetchTicket = async () => {
    try {
      if (testMode) {
        if (errorMode) {
          setError('Failed to load ticket')
          setLoading(false)
          return
        }
        if (notFoundMode) {
          setError(null)
          setTicket(null)
          setLoading(false)
          return
        }
        // Mock data
        setTicket({
          ticket_id: 'tkt-001',
          ticket_number: 'TESTTKT0042',
          subject: 'Request for H1B Extension Filing',
          description: 'My H1B visa expires on March 15, 2026. I would like to initiate the extension process. My current project with ABC Corp is expected to continue through 2027.\n\nPlease let me know what documents are needed.',
          department: 'Immigration',
          request_type: 'H1B Extension',
          status: 'sent_to_candidate_review',
          priority: 'normal',
          created_at: '2025-12-10T09:30:00Z',
          updated_at: '2025-12-14T15:45:00Z',
          assigned_team: 'Immigration_Team',
          assigned_to: { id: 'user-001', name: 'Immigration Team' },
          employee: {
            employee_id: 'emp-001',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@company.com',
            phone: '(555) 123-4567',
            employee_code: 'IES00015',
            employee_type: 'it_usa',
            business: { business_name: 'Intuites LLC' }
          },
          attachments: [
            { id: 'att-001', file_name: 'I-797_copy.pdf', file_size: 1259520, file_url: '#' },
            { id: 'att-002', file_name: 'passport_scan.pdf', file_size: 2519040, file_url: '#' }
          ],
          comments: [
            {
              id: 'cmt-001',
              comment_text: 'Hi John,\n\nWe\'ve reviewed your request. Please review the attached checklist and confirm you can provide all required documents within 2 weeks.\n\nKey documents needed:\n- Updated resume\n- Recent pay stubs (last 3 months)\n- Client letter confirming project extension',
              is_internal: false,
              created_at: '2025-12-14T15:45:00Z',
              created_by: { id: 'user-001', name: 'Immigration Team' },
              attachments: [
                { id: 'att-003', file_name: 'h1b_extension_checklist.pdf', file_size: 250880, file_url: '#' }
              ],
              email_sent: true
            },
            {
              id: 'cmt-002',
              comment_text: 'Verified employee\'s current project status with PM. Project is confirmed to continue until Q4 2027. Ready to proceed with extension filing.',
              is_internal: true,
              created_at: '2025-12-12T14:15:00Z',
              created_by: { id: 'user-002', name: 'HR Admin' }
            }
          ],
          status_history: [
            {
              id: 'hist-001',
              old_status: 'in_team_review',
              new_status: 'sent_to_candidate_review',
              changed_at: '2025-12-14T15:45:00Z',
              changed_by: { id: 'user-001', name: 'Immigration Team' }
            },
            {
              id: 'hist-002',
              old_status: 'ticket_created',
              new_status: 'in_team_review',
              changed_at: '2025-12-12T10:15:00Z',
              changed_by: { id: 'user-001', name: 'Immigration Team' }
            }
          ]
        })
        setError(null)
        setLoading(false)
        return
      }
      if (!ticketId || !tenant?.tenant_id) {
        setError('Ticket ID or tenant not available')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Fetch ticket with all related data
      const { data: ticketData, error: ticketError } = await supabase
        .from('hrms_tickets')
        .select(`
          *,
          employee:hrms_employees!hrms_tickets_employee_id_fkey(
            employee_id,
            first_name,
            last_name,
            email,
            phone,
            employee_code,
            employee_type,
            business:businesses!hrms_employees_business_id_fkey(
              business_id,
              business_name
            )
          ),
          comments:hrms_ticket_comments(
            comment_id,
            comment_text,
            is_internal_note,
            author_type,
            author_display_name,
            created_at,
            email_sent
          ),
          attachments:hrms_ticket_attachments(
            attachment_id,
            file_name,
            file_path,
            file_size_bytes,
            created_at
          ),
          status_history:hrms_ticket_status_history(
            history_id,
            previous_status,
            new_status,
            change_reason,
            changed_by_name,
            created_at
          )
        `)
        .eq('ticket_id', ticketId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (ticketError) {
        if (ticketError.code === 'PGRST116') {
          // Not found
          setTicket(null)
          setError(null)
        } else {
          throw ticketError
        }
        setLoading(false)
        return
      }

      if (!ticketData) {
        setTicket(null)
        setError(null)
        setLoading(false)
        return
      }

      // Transform the data to match component format
      const transformedTicket = {
        ticket_id: ticketData.ticket_id,
        ticket_number: ticketData.ticket_number,
        subject: ticketData.subject,
        description: ticketData.description,
        department: ticketData.department,
        request_type: ticketData.request_type,
        status: ticketData.status,
        priority: ticketData.priority || 'normal',
        created_at: ticketData.created_at,
        updated_at: ticketData.updated_at,
        assigned_team: ticketData.assigned_team,
        assigned_to: ticketData.assigned_to ? { id: ticketData.assigned_to } : null,
        employee: ticketData.employee ? {
          employee_id: ticketData.employee.employee_id,
          first_name: ticketData.employee.first_name,
          last_name: ticketData.employee.last_name,
          email: ticketData.employee.email,
          phone: ticketData.employee.phone,
          employee_code: ticketData.employee.employee_code,
          employee_type: ticketData.employee.employee_type,
          business: ticketData.employee.business ? {
            business_name: ticketData.employee.business.business_name
          } : null
        } : null,
        attachments: (ticketData.attachments || []).map(att => ({
          id: att.attachment_id,
          file_name: att.file_name,
          file_size: att.file_size_bytes || 0,
          file_url: att.file_path // In production, this would be a signed URL
        })),
        comments: (ticketData.comments || []).map(comment => ({
          id: comment.comment_id,
          comment_text: comment.comment_text,
          is_internal: comment.is_internal_note,
          created_at: comment.created_at,
          created_by: {
            id: null, // Would need to join with profiles
            name: comment.author_display_name || 'System'
          },
          email_sent: comment.email_sent
        })),
        status_history: (ticketData.status_history || []).map(hist => ({
          id: hist.history_id,
          old_status: hist.previous_status,
          new_status: hist.new_status,
          changed_at: hist.created_at,
          changed_by: {
            id: null,
            name: hist.changed_by_name || 'System'
          }
        }))
      }

      setTicket(transformedTicket)
      setLoading(false)
    } catch (err) {
      setError(err.message || 'Failed to load ticket')
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !ticket || !tenant?.tenant_id || !user?.id) return

    setSubmittingComment(true)
    try {
      const { error: commentError } = await supabase
        .from('hrms_ticket_comments')
        .insert({
          tenant_id: tenant.tenant_id,
          ticket_id: ticket.ticket_id,
          comment_text: commentText.trim(),
          is_internal_note: isInternalNote,
          author_type: 'team_member',
          author_user_id: user.id,
          author_display_name: user.email || 'Team Member', // Would use profile name in production
          email_sent: sendEmailNotification
        })

      if (commentError) throw commentError
      
      // Refresh ticket data
      setCommentText('')
      setIsInternalNote(false)
      setSendEmailNotification(true)
      await fetchTicket()
    } catch (err) {
      console.error('Failed to add comment:', err)
      setError(err.message || 'Failed to add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleStatusChanged = () => {
    setShowChangeStatusModal(false)
    fetchTicket()
  }

  const calculateDaysOpen = () => {
    if (!ticket) return 0
    const created = new Date(ticket.created_at)
    const now = new Date()
    const diffTime = Math.abs(now - created)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return <LoadingSpinner message="Loading ticket..." />
  }

  if (error) {
    return (
      <div className="ticket-detail-admin-container">
        <div className="error-message">
          <p>Error loading ticket: {error}</p>
          <button onClick={fetchTicket} className="btn-primary">Retry</button>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="ticket-detail-admin-container">
        <div className="not-found-message">
          <h2>Ticket Not Found</h2>
          <p>The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link to="/hrms/tickets" className="btn-primary">
            <ArrowLeftIcon className="icon-sm" />
            Back to Tickets
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.ticket_created
  const StatusIcon = statusConfig.icon

  return (
    <div className="ticket-detail-admin-container">
      {/* Page Header */}
      <div className="ticket-detail-header">
        <div className="header-left">
          <Link to="/hrms/tickets" className="back-link">
            <ArrowLeftIcon className="icon-sm" />
            Back to Tickets
          </Link>
          <div className="ticket-number-header">
            <TicketIcon className="ticket-icon" />
            {ticket.ticket_number}
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowChangeStatusModal(true)}
        >
          Change Status
        </button>
      </div>

      {/* Ticket Header */}
      <div className="ticket-header-card">
        <h1 className="ticket-subject">{ticket.subject}</h1>
        <div className="ticket-badges-row">
          <div className="badge-group">
            <span className="badge-label">📂 Dept</span>
            <span className="department-badge">{ticket.department}</span>
          </div>
          <div className="badge-group">
            <span className="badge-label">🏷️ Type</span>
            <span className="request-type-badge">{ticket.request_type}</span>
          </div>
          <div className="badge-group">
            <span className="badge-label">🔄 Status</span>
            <StatusBadge status={ticket.status} />
          </div>
        </div>
      </div>

      {/* Employee Info & Ticket Metadata */}
      <div className="info-grid">
        <div className="info-card">
          <h3 className="info-card-title">Employee Info</h3>
          <div className="info-item">
            <UserIcon className="info-icon" />
            <span>{ticket.employee.first_name} {ticket.employee.last_name}</span>
          </div>
          <div className="info-item">
            <EnvelopeIcon className="info-icon" />
            <span>{ticket.employee.email}</span>
          </div>
          {ticket.employee.phone && (
            <div className="info-item">
              <PhoneIcon className="info-icon" />
              <span>{ticket.employee.phone}</span>
            </div>
          )}
          <div className="info-item">
            <BuildingOfficeIcon className="info-icon" />
            <span>{ticket.employee.business?.business_name || 'N/A'}</span>
          </div>
          <div className="info-item">
            <IdentificationIcon className="info-icon" />
            <span>{ticket.employee.employee_code}</span>
          </div>
          <div className="info-item">
            <BriefcaseIcon className="info-icon" />
            <span>{ticket.employee.employee_type?.replace('_', ' ').toUpperCase() || 'N/A'}</span>
          </div>
          <Link
            to={`/hrms/employees/${ticket.employee.employee_id}`}
            className="view-profile-link"
          >
            View Employee Profile →
          </Link>
        </div>

        <div className="info-card">
          <h3 className="info-card-title">Ticket Metadata</h3>
          <div className="info-item">
            <span className="info-label">Ticket ID:</span>
            <span>{ticket.ticket_number}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Created:</span>
            <span>{format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Last Update:</span>
            <span>{format(new Date(ticket.updated_at), 'MMM d, yyyy')}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Assigned To:</span>
            <span>{ticket.assigned_to?.name || ticket.assigned_team}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Priority:</span>
            <span className={`priority-badge ${ticket.priority}`}>{ticket.priority}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Days Open:</span>
            <span>{calculateDaysOpen()} days</span>
          </div>
          <div className="info-item">
            <span className="info-label">Comments:</span>
            <span>{ticket.comments?.length || 0}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Attachments:</span>
            <span>{ticket.attachments?.length || 0}</span>
          </div>
        </div>
      </div>

      {/* Original Request */}
      <div className="section-card">
        <h2 className="section-title">Original Request</h2>
        <div className="request-description">
          {ticket.description.split('\n').map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
        {ticket.attachments && ticket.attachments.length > 0 && (
          <>
            <div className="section-divider" />
            <h3 className="subsection-title">📎 Initial Attachments</h3>
            <div className="attachments-grid">
              {ticket.attachments.map(att => (
                <div key={att.id} className="attachment-card">
                  <PaperClipIcon className="attachment-icon" />
                  <div className="attachment-info">
                    <span className="attachment-name">{att.file_name}</span>
                    <span className="attachment-size">
                      {(att.file_size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="attachment-actions">
                    <button className="icon-btn" title="View">
                      <EyeIcon className="icon-sm" />
                    </button>
                    <button className="icon-btn" title="Download">
                      <ArrowDownTrayIcon className="icon-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Activity & Comments */}
      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Activity & Comments</h2>
          <select className="sort-select" aria-label="Sort comments">
            <option>Newest First</option>
            <option>Oldest First</option>
          </select>
        </div>

        <div className="activity-timeline">
          {/* Combine comments and status changes, sort by date */}
          {[
            ...(ticket.comments || []).map(c => ({ ...c, type: 'comment' })),
            ...(ticket.status_history || []).map(h => ({ ...h, type: 'status_change' }))
          ]
            .sort((a, b) => new Date(b.created_at || b.changed_at) - new Date(a.created_at || a.changed_at))
            .map((item, idx) => (
              <div key={idx} className={`activity-item ${item.type}`}>
                {item.type === 'status_change' ? (
                  <>
                    <div className="activity-header">
                      <ClockIcon className="activity-icon status-change" />
                      <span className="activity-type">STATUS CHANGE</span>
                      <span className="activity-date">
                        {format(new Date(item.changed_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <div className="activity-content">
                      {item.changed_by?.name} changed status from "{STATUS_CONFIG[item.old_status]?.label || item.old_status}" to "{STATUS_CONFIG[item.new_status]?.label || item.new_status}"
                    </div>
                  </>
                ) : (
                  <>
                    <div className="activity-header">
                      <ChatBubbleLeftIcon className="activity-icon comment" />
                      <span className="activity-type">
                        {item.is_internal ? 'INTERNAL NOTE' : 'COMMENT'}
                      </span>
                      {item.is_internal && (
                        <span className="internal-badge">
                          <LockClosedIcon className="icon-xs" />
                          Internal Only
                        </span>
                      )}
                      <span className="activity-date">
                        {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <div className="activity-author">
                      👤 {item.created_by?.name}
                    </div>
                    <div className="activity-content">
                      {item.comment_text.split('\n').map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                    </div>
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="comment-attachments">
                        {item.attachments.map(att => (
                          <div key={att.id} className="comment-attachment">
                            <PaperClipIcon className="icon-xs" />
                            {att.file_name} ({(att.file_size / 1024).toFixed(0)} KB)
                          </div>
                        ))}
                      </div>
                    )}
                    {item.email_sent && (
                      <div className="email-notification-badge">
                        ✉️ Email notification sent to employee
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
        </div>

        {/* Add Comment Form */}
        <div className="add-comment-section">
          <h3 className="subsection-title">Add Comment / Update</h3>
          <form onSubmit={handleAddComment} className="comment-form">
            <textarea
              className="comment-textarea"
              placeholder="Type your comment here..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
              aria-label="Add comment"
            />
            <div className="comment-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                />
                <span>Internal Note (not visible to employee)</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={sendEmailNotification}
                  onChange={(e) => setSendEmailNotification(e.target.checked)}
                  disabled={isInternalNote}
                />
                <span>Send email notification to employee</span>
              </label>
            </div>
            <div className="comment-form-actions">
              <button type="button" className="btn-secondary">
                <PaperClipIcon className="icon-sm" />
                Attach Files
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!commentText.trim() || submittingComment}
              >
                {submittingComment ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Status Modal */}
      {showChangeStatusModal && (
        <ChangeStatusModal
          ticket={ticket}
          onClose={() => setShowChangeStatusModal(false)}
          onSuccess={handleStatusChanged}
        />
      )}
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ticket_created
  const Icon = config.icon
  
  return (
    <span 
      className="status-badge"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <Icon className="icon-xs" />
      {config.label}
    </span>
  )
}

export default TicketDetailAdmin

