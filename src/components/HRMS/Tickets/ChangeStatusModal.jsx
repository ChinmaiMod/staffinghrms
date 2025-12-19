import { useState } from 'react'
import { supabase } from '../../../api/supabaseClient'
import { useAuth } from '../../../contexts/AuthProvider'
import { useTenant } from '../../../contexts/TenantProvider'
import {
  XMarkIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import './ChangeStatusModal.css'

// Status configuration
const STATUS_CONFIG = {
  ticket_created: { label: 'Ticket Created', color: '#3B82F6' },
  in_team_review: { label: 'In Team Review', color: '#8B5CF6' },
  need_leadership_discussion: { label: 'Need to Discuss with Leadership', color: '#F59E0B' },
  need_attorney_discussion: { label: 'Need to Discuss with Attorney', color: '#EC4899' },
  need_team_discussion: { label: 'Need to Discuss with Team', color: '#06B6D4' },
  sent_to_candidate_review: { label: 'Sent to Candidate for Review', color: '#10B981' },
  closed: { label: 'Closed', color: '#6B7280' },
  auto_closed: { label: 'Auto-Closed', color: '#9CA3AF' }
}

/**
 * ChangeStatusModal Component - Modal for changing ticket status
 * Based on UI_DESIGN_DOCS/04_EMPLOYEE_TICKETS.md section 4.4
 */
function ChangeStatusModal({ ticket, onClose, onSuccess }) {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const [newStatus, setNewStatus] = useState('')
  const [reason, setReason] = useState('')
  const [notifyEmployee, setNotifyEmployee] = useState(true)
  const [validationErrors, setValidationErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const currentStatusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.ticket_created

  const validateForm = () => {
    const errors = {}

    if (!newStatus) {
      errors.newStatus = 'Please select a new status'
    } else if (newStatus === ticket.status) {
      errors.newStatus = 'Please select a different status'
    }

    // Require reason for certain status transitions
    const transitionsRequiringReason = [
      'closed',
      'auto_closed',
      'need_leadership_discussion',
      'need_attorney_discussion'
    ]
    if (newStatus && transitionsRequiringReason.includes(newStatus) && !reason.trim()) {
      errors.reason = 'Please provide a reason for this status change'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      if (!ticket?.ticket_id || !tenant?.tenant_id || !user?.id) {
        throw new Error('Missing required data to update status')
      }

      // Update ticket status (status history is automatically created via trigger)
      const { error: updateError } = await supabase
        .from('hrms_tickets')
        .update({
          status: newStatus,
          updated_by: user.id,
          resolved_at: ['closed', 'auto_closed'].includes(newStatus) ? new Date().toISOString() : null
        })
        .eq('ticket_id', ticket.ticket_id)
        .eq('tenant_id', tenant.tenant_id)

      if (updateError) throw updateError

      // Update status history with reason if provided
      // Note: The trigger creates the history record, but we can update it with reason
      if (reason.trim()) {
        const { data: historyData, error: historyError } = await supabase
          .from('hrms_ticket_status_history')
          .select('history_id')
          .eq('ticket_id', ticket.ticket_id)
          .eq('new_status', newStatus)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!historyError && historyData) {
          await supabase
            .from('hrms_ticket_status_history')
            .update({
              change_reason: reason.trim(),
              changed_by_name: user.email || 'Team Member' // Would use profile name in production
            })
            .eq('history_id', historyData.history_id)
        }
      }

      // TODO: Send email notification if notifyEmployee is true
      // This would typically be handled by a Supabase Edge Function or backend service

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Error updating ticket status:', err)
      setSubmitError(err.message || 'Failed to update status. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">Change Status</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <XMarkIcon className="icon-md" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="status-form">
          {submitError && (
            <div className="error-banner">
              <ExclamationCircleIcon className="icon-sm" />
              {submitError}
            </div>
          )}

          <div className="current-status-display">
            <span className="current-status-label">Current Status:</span>
            <span 
              className="current-status-badge"
              style={{ backgroundColor: currentStatusConfig.color + '20', color: currentStatusConfig.color }}
            >
              {currentStatusConfig.label}
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="new-status">
              New Status <span className="required">*</span>
            </label>
            <select
              id="new-status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className={validationErrors.newStatus ? 'error' : ''}
              aria-required="true"
              aria-invalid={!!validationErrors.newStatus}
              aria-describedby={validationErrors.newStatus ? 'new-status-error' : undefined}
            >
              <option value="">Select new status...</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key} disabled={key === ticket.status}>
                  {key === ticket.status ? `✓ ${config.label} (Current)` : config.label}
                </option>
              ))}
            </select>
            {validationErrors.newStatus && (
              <span id="new-status-error" className="error-message">
                {validationErrors.newStatus}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reason">
              Reason for Status Change
              {newStatus && ['closed', 'auto_closed', 'need_leadership_discussion', 'need_attorney_discussion'].includes(newStatus) && (
                <span className="required">*</span>
              )}
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're changing the status..."
              rows={4}
              className={validationErrors.reason ? 'error' : ''}
              aria-invalid={!!validationErrors.reason}
              aria-describedby={validationErrors.reason ? 'reason-error' : undefined}
            />
            {validationErrors.reason && (
              <span id="reason-error" className="error-message">
                {validationErrors.reason}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={notifyEmployee}
                onChange={(e) => setNotifyEmployee(e.target.checked)}
              />
              <span>Notify employee via email about status change</span>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangeStatusModal

