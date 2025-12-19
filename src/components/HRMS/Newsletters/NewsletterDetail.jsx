import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './NewsletterDetail.css'

/**
 * NewsletterDetail - View newsletter details
 * URL: /hrms/newsletters/:newsletterId
 * Based on UI_DESIGN_DOCS/14_NEWSLETTER.md
 */
function NewsletterDetail() {
  const { tenant } = useTenant()
  const { newsletterId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newsletter, setNewsletter] = useState(null)

  useEffect(() => {
    if (tenant?.tenant_id && newsletterId) {
      fetchNewsletter()
    }
  }, [tenant?.tenant_id, newsletterId])

  const fetchNewsletter = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('hrms_newsletters')
        .select('*')
        .eq('newsletter_id', newsletterId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError

      setNewsletter(data)
    } catch (err) {
      console.error('Error fetching newsletter:', err)
      setError(err.message || 'Failed to load newsletter')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status) => {
    const statusConfigs = {
      draft: { label: 'Draft', bg: '#F3F4F6', text: '#374151', icon: '📝' },
      scheduled: { label: 'Scheduled', bg: '#DBEAFE', text: '#1E40AF', icon: '📅' },
      sending: { label: 'Sending', bg: '#FEF3C7', text: '#92400E', icon: '⏳' },
      sent: { label: 'Sent', bg: '#D1FAE5', text: '#065F46', icon: '✅' },
      cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#991B1B', icon: '❌' },
    }
    const config = statusConfigs[status] || statusConfigs.draft
    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: config.bg,
          color: config.text,
        }}
      >
        {config.icon} {config.label}
      </span>
    )
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading newsletter..." />
  }

  if (error) {
    return (
      <div className="newsletter-detail">
        <div className="error-banner" role="alert">
          <span>{error}</span>
        </div>
        <Link to="/hrms/newsletters" className="back-link">
          <ArrowLeftIcon className="icon-sm" />
          Back to Newsletters
        </Link>
      </div>
    )
  }

  if (!newsletter) {
    return (
      <div className="newsletter-detail">
        <div className="error-banner" role="alert">
          <span>Newsletter not found</span>
        </div>
        <Link to="/hrms/newsletters" className="back-link">
          <ArrowLeftIcon className="icon-sm" />
          Back to Newsletters
        </Link>
      </div>
    )
  }

  return (
    <div className="newsletter-detail" data-testid="newsletter-detail">
      {/* Header */}
      <div className="newsletter-detail-header">
        <Link to="/hrms/newsletters" className="back-link">
          <ArrowLeftIcon className="icon-sm" />
          Back to Newsletters
        </Link>
        <div className="header-content">
          <div>
            <h1 className="page-title">{newsletter.title}</h1>
            <p className="page-subtitle">{newsletter.subject_line}</p>
          </div>
          <div className="header-actions">
            {getStatusBadge(newsletter.newsletter_status)}
            {newsletter.newsletter_status === 'draft' && (
              <Link
                to={`/hrms/newsletters/${newsletter.newsletter_id}/edit`}
                className="btn btn-secondary"
              >
                <PencilIcon className="icon-sm" />
                Edit
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Newsletter Info */}
      <div className="newsletter-info">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Status</span>
            <span className="info-value">{getStatusBadge(newsletter.newsletter_status)}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Recipients</span>
            <span className="info-value">{newsletter.total_recipients || 0}</span>
          </div>
          {newsletter.newsletter_status === 'scheduled' && newsletter.scheduled_send_at && (
            <div className="info-item">
              <span className="info-label">Scheduled Send Date</span>
              <span className="info-value">{formatDate(newsletter.scheduled_send_at)}</span>
            </div>
          )}
          {newsletter.newsletter_status === 'sent' && newsletter.sent_at && (
            <div className="info-item">
              <span className="info-label">Sent Date</span>
              <span className="info-value">{formatDate(newsletter.sent_at)}</span>
            </div>
          )}
          {newsletter.newsletter_status === 'sent' && newsletter.total_opened > 0 && (
            <div className="info-item">
              <span className="info-label">Opened</span>
              <span className="info-value">
                {newsletter.total_opened} ({Math.round((newsletter.total_opened / newsletter.total_recipients) * 100)}%)
              </span>
            </div>
          )}
          <div className="info-item">
            <span className="info-label">Created</span>
            <span className="info-value">{formatDate(newsletter.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Newsletter Content */}
      <div className="newsletter-content">
        <h2 className="content-title">Content</h2>
        <div
          className="content-html"
          dangerouslySetInnerHTML={{ __html: newsletter.content_html }}
        />
      </div>
    </div>
  )
}

export default NewsletterDetail
