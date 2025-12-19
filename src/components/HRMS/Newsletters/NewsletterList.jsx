import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  NewspaperIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './NewsletterList.css'

// Newsletter status configuration with colors
const NEWSLETTER_STATUSES = {
  draft: { label: 'Draft', bg: '#F3F4F6', text: '#374151', icon: '📝' },
  scheduled: { label: 'Scheduled', bg: '#DBEAFE', text: '#1E40AF', icon: '📅' },
  sending: { label: 'Sending', bg: '#FEF3C7', text: '#92400E', icon: '⏳' },
  sent: { label: 'Sent', bg: '#D1FAE5', text: '#065F46', icon: '✅' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#991B1B', icon: '❌' },
}

/**
 * NewsletterList - Newsletter management list page
 * URL: /hrms/newsletters
 * Based on UI_DESIGN_DOCS/14_NEWSLETTER.md
 */
function NewsletterList({ testMode = false }) {
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newsletters, setNewsletters] = useState([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(25)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (testMode) {
      // Mock data for testing
      const mockNewsletter = {
        newsletter_id: 'nl-001',
        title: 'December Company Update',
        subject_line: '📰 December Update: Q4 Highlights',
        newsletter_status: 'scheduled',
        scheduled_send_at: '2024-12-20T09:00:00Z',
        total_recipients: 145,
        created_at: '2024-12-15T10:00:00Z',
      }
      setNewsletters([mockNewsletter])
      setTotalCount(1)
      setLoading(false)
      return
    }

    if (tenant?.tenant_id && user?.id) {
      fetchNewsletters()
    }
  }, [tenant?.tenant_id, selectedBusiness?.business_id, user?.id, statusFilter, currentPage, testMode])

  const fetchNewsletters = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!tenant?.tenant_id) {
        setError('Tenant not available')
        setLoading(false)
        return
      }

      // Build query
      let query = supabase
        .from('hrms_newsletters')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false })

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('newsletter_status', statusFilter)
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,subject_line.ilike.%${searchQuery}%`)
      }

      // Apply pagination
      const from = (currentPage - 1) * rowsPerPage
      const to = from + rowsPerPage - 1
      const { data, error: queryError, count } = await query.range(from, to)

      if (queryError) throw queryError

      setNewsletters(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching newsletters:', err)
      setError(err.message || 'Failed to load newsletters')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status) => {
    const statusConfig = NEWSLETTER_STATUSES[status] || NEWSLETTER_STATUSES.draft
    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: statusConfig.bg,
          color: statusConfig.text,
        }}
      >
        {statusConfig.icon} {statusConfig.label}
      </span>
    )
  }

  const filteredNewsletters = useMemo(() => {
    if (!searchQuery.trim()) return newsletters
    const query = searchQuery.toLowerCase()
    return newsletters.filter(
      (nl) =>
        nl.title?.toLowerCase().includes(query) ||
        nl.subject_line?.toLowerCase().includes(query)
    )
  }, [newsletters, searchQuery])

  const totalPages = Math.ceil(totalCount / rowsPerPage)

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading newsletters..." />
  }

  return (
    <div className="newsletter-list" data-testid="newsletter-list">
      {/* Header */}
      <div className="newsletter-list-header">
        <div>
          <h1 className="page-title">Newsletter Management</h1>
          <p className="page-subtitle">Create and distribute internal communications to employees</p>
        </div>
        <Link to="/hrms/newsletters/new" className="btn btn-primary">
          <PlusIcon className="icon-sm" />
          Create Newsletter
        </Link>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="newsletter-filters">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${statusFilter === 'draft' ? 'active' : ''}`}
            onClick={() => setStatusFilter('draft')}
          >
            Draft
          </button>
          <button
            className={`filter-tab ${statusFilter === 'scheduled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('scheduled')}
          >
            Scheduled
          </button>
          <button
            className={`filter-tab ${statusFilter === 'sent' ? 'active' : ''}`}
            onClick={() => setStatusFilter('sent')}
          >
            Sent
          </button>
        </div>
        <div className="search-box">
          <MagnifyingGlassIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search newsletters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Newsletter Cards */}
      <div className="newsletter-cards">
        {filteredNewsletters.length === 0 ? (
          <div className="empty-state">
            <NewspaperIcon className="empty-icon" />
            <h3>No newsletters found</h3>
            <p>Get started by creating your first newsletter</p>
            <Link to="/hrms/newsletters/new" className="btn btn-primary">
              Create Newsletter
            </Link>
          </div>
        ) : (
          filteredNewsletters.map((newsletter) => (
            <div key={newsletter.newsletter_id} className="newsletter-card">
              <div className="newsletter-card-header">
                <h3 className="newsletter-title">{newsletter.title}</h3>
                {getStatusBadge(newsletter.newsletter_status)}
              </div>
              <p className="newsletter-subject">{newsletter.subject_line}</p>
              <div className="newsletter-meta">
                <div className="meta-item">
                  <span className="meta-label">Recipients:</span>
                  <span className="meta-value">{newsletter.total_recipients || 0}</span>
                </div>
                {newsletter.newsletter_status === 'scheduled' && newsletter.scheduled_send_at && (
                  <div className="meta-item">
                    <span className="meta-label">Send Date:</span>
                    <span className="meta-value">{formatDate(newsletter.scheduled_send_at)}</span>
                  </div>
                )}
                {newsletter.newsletter_status === 'sent' && newsletter.sent_at && (
                  <div className="meta-item">
                    <span className="meta-label">Sent:</span>
                    <span className="meta-value">{formatDate(newsletter.sent_at)}</span>
                  </div>
                )}
                {newsletter.newsletter_status === 'sent' && newsletter.total_opened > 0 && (
                  <div className="meta-item">
                    <span className="meta-label">Opened:</span>
                    <span className="meta-value">
                      {newsletter.total_opened} ({Math.round((newsletter.total_opened / newsletter.total_recipients) * 100)}%)
                    </span>
                  </div>
                )}
              </div>
              <div className="newsletter-actions">
                <Link
                  to={`/hrms/newsletters/${newsletter.newsletter_id}`}
                  className="btn btn-secondary btn-sm"
                >
                  <EyeIcon className="icon-sm" />
                  View
                </Link>
                {newsletter.newsletter_status === 'draft' && (
                  <Link
                    to={`/hrms/newsletters/${newsletter.newsletter_id}/edit`}
                    className="btn btn-secondary btn-sm"
                  >
                    <PencilIcon className="icon-sm" />
                    Edit
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default NewsletterList
