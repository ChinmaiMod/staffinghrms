import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import BusinessFilter from '../../Shared/BusinessFilter'
import { useDebounce } from '../../../utils/debounce'
import './SuggestionList.css'

/**
 * SuggestionList - List view for suggestions and ideas
 * URL: /hrms/suggestions
 * Based on UI_DESIGN_DOCS/15_SUGGESTIONS_IDEAS.md
 */
function SuggestionList() {
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [hasAnySuggestions, setHasAnySuggestions] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 10

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, typeFilter, priorityFilter, debouncedSearchQuery])

  useEffect(() => {
    if (tenant?.tenant_id) {
      fetchSuggestions()
    }
  }, [tenant?.tenant_id, selectedBusiness?.business_id, statusFilter, typeFilter, priorityFilter, debouncedSearchQuery, currentPage])

  const fetchSuggestions = async () => {
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
        .from('hrms_suggestions')
        .select(`
          suggestion_id,
          title,
          suggestion_type,
          status,
          priority,
          description,
          admin_response,
          created_at,
          reviewed_at,
          submitted_by_user_id,
          admin_user_id
        `, { count: 'exact' })
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false })

      // Apply business filter
      if (selectedBusiness?.business_id) {
        query = query.eq('business_id', selectedBusiness.business_id)
      }

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (typeFilter !== 'all') {
        query = query.eq('suggestion_type', typeFilter)
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter)
      }

      // Search filter
      if (debouncedSearchQuery) {
        query = query.or(`title.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%`)
      }

      // Pagination
      const from = (currentPage - 1) * rowsPerPage
      const to = from + rowsPerPage - 1
      query = query.range(from, to)

      const { data, error: queryError, count } = await query

      if (queryError) throw queryError

      setSuggestions(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching suggestions:', err)
      setError(err.message || 'Failed to load suggestions')
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
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading suggestions..." />
  }

  return (
    <div className="suggestion-list-container">
      {/* Business Filter */}
      <BusinessFilter />

      <div className="suggestion-list-header">
        <div>
          <h1 className="page-title">💡 Suggestions & Ideas</h1>
          <p className="page-subtitle">Share your ideas to help improve our workplace and systems</p>
        </div>
        <Link to="/hrms/suggestions/new" className="btn btn-primary">
          + New Suggestion
        </Link>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="suggestion-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="implemented">Implemented</option>
            <option value="deferred">Deferred</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="type-filter">Type</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="feature">Feature Request</option>
            <option value="improvement">Improvement</option>
            <option value="bug_report">Bug Report</option>
            <option value="feedback">Feedback</option>
            <option value="process">Process Improvement</option>
            <option value="policy">Policy</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="priority-filter">Priority</label>
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="filter-group filter-search">
          <label htmlFor="search-filter">Search</label>
          <input
            id="search-filter"
            type="text"
            placeholder="Search suggestions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Suggestions List */}
      {suggestions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <h3>No suggestions yet</h3>
          <p>Be the first to share an idea or suggestion!</p>
          <Link to="/hrms/suggestions/new" className="btn btn-primary">
            + Submit a Suggestion
          </Link>
        </div>
      ) : (
        <>
          <div className="suggestions-grid">
            {suggestions.map((suggestion) => {
              const statusBadge = getStatusBadge(suggestion.status)
              const priorityBadge = getPriorityBadge(suggestion.priority)
              
              return (
                <div key={suggestion.suggestion_id} className="suggestion-card">
                  <div className="suggestion-card-header">
                    <h3 className="suggestion-title">{suggestion.title}</h3>
                    <span className={`status-badge status-${statusBadge.color}`}>
                      {statusBadge.icon} {statusBadge.label}
                    </span>
                  </div>
                  
                  <div className="suggestion-meta">
                    <span className="suggestion-type">{getTypeLabel(suggestion.suggestion_type)}</span>
                    <span className="suggestion-separator">•</span>
                    <span className={`priority-badge priority-${priorityBadge.color}`}>
                      {priorityBadge.label}
                    </span>
                    <span className="suggestion-separator">•</span>
                    <span className="suggestion-date">{formatDate(suggestion.created_at)}</span>
                  </div>

                  <p className="suggestion-description">
                    {suggestion.description.length > 150
                      ? `${suggestion.description.substring(0, 150)}...`
                      : suggestion.description}
                  </p>

                  {suggestion.admin_response && (
                    <div className="admin-response-preview">
                      <strong>Admin Response:</strong> {suggestion.admin_response.substring(0, 100)}...
                    </div>
                  )}

                  <div className="suggestion-card-actions">
                    <Link
                      to={`/hrms/suggestions/${suggestion.suggestion_id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalCount > rowsPerPage && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {Math.ceil(totalCount / rowsPerPage)}
              </span>
              <button
                className="btn btn-secondary"
                disabled={currentPage >= Math.ceil(totalCount / rowsPerPage)}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SuggestionList
