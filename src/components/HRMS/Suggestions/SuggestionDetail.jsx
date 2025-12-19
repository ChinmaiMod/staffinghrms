import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './SuggestionDetail.css'

/**
 * SuggestionDetail - Detail view for a single suggestion
 * URL: /hrms/suggestions/:suggestionId
 * Based on UI_DESIGN_DOCS/15_SUGGESTIONS_IDEAS.md
 */
function SuggestionDetail() {
  const { suggestionId } = useParams()
  const { tenant } = useTenant()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [suggestion, setSuggestion] = useState(null)

  useEffect(() => {
    if (tenant?.tenant_id && suggestionId) {
      fetchSuggestion()
    }
  }, [tenant?.tenant_id, suggestionId])

  const fetchSuggestion = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('hrms_suggestions')
        .select('*')
        .eq('suggestion_id', suggestionId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError

      setSuggestion(data)
    } catch (err) {
      console.error('Error fetching suggestion:', err)
      setError(err.message || 'Failed to load suggestion')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { label: 'Submitted', color: 'blue', icon: '📝' },
      under_review: { label: 'Under Review', color: 'yellow', icon: '🔍' },
      approved: { label: 'Approved', color: 'green', icon: '✅' },
      rejected: { label: 'Rejected', color: 'red', icon: '❌' },
      implemented: { label: 'Implemented', color: 'green', icon: '🚀' },
      deferred: { label: 'Deferred', color: 'gray', icon: '⏸️' },
    }
    return statusConfig[status] || { label: status, color: 'gray', icon: '💡' }
  }

  const getTypeLabel = (type) => {
    const typeMap = {
      feature: 'Feature Request',
      improvement: 'Improvement',
      bug_report: 'Bug Report',
      feedback: 'Feedback',
      process: 'Process Improvement',
      policy: 'Policy',
      other: 'Other',
    }
    return typeMap[type] || type
  }

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { label: 'Low', color: 'gray' },
      medium: { label: 'Medium', color: 'blue' },
      high: { label: 'High', color: 'yellow' },
      critical: { label: 'Critical', color: 'red' },
    }
    return priorityConfig[priority] || { label: priority, color: 'gray' }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading suggestion..." />
  }

  if (error) {
    return (
      <div className="suggestion-detail-container">
        <div className="error-banner">{error}</div>
        <Link to="/hrms/suggestions" className="btn btn-secondary">
          Back to Suggestions
        </Link>
      </div>
    )
  }

  if (!suggestion) {
    return (
      <div className="suggestion-detail-container">
        <div className="error-banner">Suggestion not found</div>
        <Link to="/hrms/suggestions" className="btn btn-secondary">
          Back to Suggestions
        </Link>
      </div>
    )
  }

  const statusBadge = getStatusBadge(suggestion.status)
  const priorityBadge = getPriorityBadge(suggestion.priority)
  const isOwner = suggestion.submitted_by_user_id === user?.id

  return (
    <div className="suggestion-detail-container">
      <div className="suggestion-detail-header">
        <Link to="/hrms/suggestions" className="back-link">
          <ArrowLeftIcon className="icon" />
          Back to Suggestions
        </Link>
        <div className="header-content">
          <div>
            <h1 className="suggestion-title">{suggestion.title}</h1>
            <div className="suggestion-meta">
              <span className={`status-badge status-${statusBadge.color}`}>
                {statusBadge.icon} {statusBadge.label}
              </span>
              <span className="meta-separator">•</span>
              <span>{getTypeLabel(suggestion.suggestion_type)}</span>
              <span className="meta-separator">•</span>
              <span className={`priority-badge priority-${priorityBadge.color}`}>
                {priorityBadge.label}
              </span>
              <span className="meta-separator">•</span>
              <span>Submitted: {formatDate(suggestion.created_at)}</span>
            </div>
          </div>
          {isOwner && suggestion.status === 'submitted' && (
            <Link
              to={`/hrms/suggestions/${suggestion.suggestion_id}/edit`}
              className="btn btn-secondary"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      <div className="suggestion-detail-content">
        <div className="detail-section">
          <h2>Description</h2>
          <div className="description-content">
            {suggestion.description.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph || '\u00A0'}</p>
            ))}
          </div>
        </div>

        {suggestion.admin_response && (
          <div className="detail-section admin-response-section">
            <h2>💬 Admin Response</h2>
            <div className="admin-response-content">
              {suggestion.admin_response.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph || '\u00A0'}</p>
              ))}
              {suggestion.reviewed_at && (
                <div className="admin-response-meta">
                  Reviewed: {formatDate(suggestion.reviewed_at)}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h2>Details</h2>
          <dl className="details-list">
            <div className="detail-item">
              <dt>Status</dt>
              <dd>
                <span className={`status-badge status-${statusBadge.color}`}>
                  {statusBadge.icon} {statusBadge.label}
                </span>
              </dd>
            </div>
            <div className="detail-item">
              <dt>Type</dt>
              <dd>{getTypeLabel(suggestion.suggestion_type)}</dd>
            </div>
            <div className="detail-item">
              <dt>Priority</dt>
              <dd>
                <span className={`priority-badge priority-${priorityBadge.color}`}>
                  {priorityBadge.label}
                </span>
              </dd>
            </div>
            <div className="detail-item">
              <dt>Submitted</dt>
              <dd>{formatDate(suggestion.created_at)}</dd>
            </div>
            {suggestion.reviewed_at && (
              <div className="detail-item">
                <dt>Reviewed</dt>
                <dd>{formatDate(suggestion.reviewed_at)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}

export default SuggestionDetail
