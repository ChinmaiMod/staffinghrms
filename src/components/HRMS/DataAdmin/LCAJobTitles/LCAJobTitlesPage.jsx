import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../../../api/supabaseClient'
import { useTenant } from '../../../../contexts/TenantProvider'
import { useAuth } from '../../../../contexts/AuthProvider'
import LCAJobTitleForm from './LCAJobTitleForm'
import './LCAJobTitlesPage.css'

const WAGE_LEVELS = [
  { value: 1, label: 'Level 1 (Entry)', description: 'Entry level, minimal experience required' },
  { value: 2, label: 'Level 2 (Qualified)', description: 'Qualified, some experience required' },
  { value: 3, label: 'Level 3 (Experienced)', description: 'Experienced, substantial experience required' },
  { value: 4, label: 'Level 4 (Fully Competent)', description: 'Fully competent, expert level' },
]

export default function LCAJobTitlesPage() {
  const { tenant } = useTenant()
  const { profile } = useAuth()
  const [lcaJobTitles, setLcaJobTitles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTitle, setEditingTitle] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSocCode, setFilterSocCode] = useState('ALL')
  const [filterWageLevel, setFilterWageLevel] = useState('ALL')

  const fetchLCAJobTitles = useCallback(async () => {
    if (!tenant?.tenant_id) return

    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('hrms_lca_job_titles')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .order('lca_job_title', { ascending: true })

      if (fetchError) throw fetchError

      setLcaJobTitles(data || [])
    } catch (err) {
      console.error('Error fetching LCA job titles:', err)
      const errorMessage =
        err.message || err.error?.message || 'Failed to load LCA job titles. Please try again later.'
      setError(errorMessage)
      setLcaJobTitles([])

      if (window.Sentry) {
        window.Sentry.captureException(err)
      }
    } finally {
      setLoading(false)
    }
  }, [tenant?.tenant_id])

  useEffect(() => {
    fetchLCAJobTitles()
  }, [fetchLCAJobTitles])

  const handleCreate = () => {
    setEditingTitle(null)
    setShowForm(true)
  }

  const handleEdit = (title) => {
    setEditingTitle(title)
    setShowForm(true)
  }

  const handleDelete = async (title) => {
    if (!window.confirm(`Delete LCA job title "${title.lca_job_title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('hrms_lca_job_titles')
        .delete()
        .eq('lca_job_title_id', title.lca_job_title_id)
        .eq('tenant_id', tenant.tenant_id)

      if (deleteError) throw deleteError

      fetchLCAJobTitles()
    } catch (err) {
      console.error('Error deleting LCA job title:', err)
      alert('Failed to delete LCA job title: ' + err.message)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTitle(null)
  }

  const handleFormSave = () => {
    handleFormClose()
    fetchLCAJobTitles()
  }

  const filteredTitles = useMemo(() => {
    let filtered = [...lcaJobTitles]

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (title) =>
          title.lca_job_title.toLowerCase().includes(term) ||
          title.soc_code.toLowerCase().includes(term) ||
          title.soc_title?.toLowerCase().includes(term)
      )
    }

    // Filter by SOC code
    if (filterSocCode !== 'ALL') {
      filtered = filtered.filter((title) => title.soc_code === filterSocCode)
    }

    // Filter by wage level
    if (filterWageLevel !== 'ALL') {
      filtered = filtered.filter((title) => title.wage_level === parseInt(filterWageLevel))
    }

    return filtered
  }, [lcaJobTitles, searchTerm, filterSocCode, filterWageLevel])

  const uniqueSocCodes = useMemo(() => {
    const codes = [...new Set(lcaJobTitles.map((t) => t.soc_code))].sort()
    return codes
  }, [lcaJobTitles])

  if (loading) {
    return (
      <div className="lca-job-titles-page">
        <div className="loading">Loading LCA job titles...</div>
      </div>
    )
  }

  return (
    <div className="lca-job-titles-page">
      <div className="crm-header">
        <h1>LCA Job Titles Management</h1>
        <p style={{ margin: 0, color: '#64748b' }}>
          Manage LCA-specific job titles for H1B/visa compliance (HRMS Only - Not shared with CRM)
        </p>
      </div>

      <div className="info-banner">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <strong>LCA Job Titles</strong> are used for Labor Condition Applications (H1B, L1) and wage level
          compliance. These are NOT shared with CRM and are HRMS-only data.
        </div>
      </div>

      <div className="lca-job-titles-actions">
        <button className="btn btn-primary" onClick={handleCreate}>
          + Add LCA Job Title
        </button>
        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="🔍 Search job titles, SOC codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterSocCode}
            onChange={(e) => setFilterSocCode(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All SOC Codes</option>
            {uniqueSocCodes.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <select
            value={filterWageLevel}
            onChange={(e) => setFilterWageLevel(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Wage Levels</option>
            {WAGE_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {filteredTitles.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No LCA Job Titles Found</h3>
          <p>
            {searchTerm || filterSocCode !== 'ALL' || filterWageLevel !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Create your first LCA job title to get started'}
          </p>
        </div>
      )}

      {filteredTitles.length > 0 && (
        <div className="lca-job-titles-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>LCA Job Title</th>
                <th>SOC Code</th>
                <th>SOC Title</th>
                <th>Wage Level</th>
                <th>Status</th>
                <th style={{ width: '200px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTitles.map((title) => (
                <tr key={title.lca_job_title_id}>
                  <td>
                    <strong>{title.lca_job_title}</strong>
                    {title.description && (
                      <div className="title-description">{title.description}</div>
                    )}
                  </td>
                  <td>
                    <code className="soc-code">{title.soc_code}</code>
                  </td>
                  <td>{title.soc_title || '-'}</td>
                  <td>
                    <span className="wage-level-badge level-{title.wage_level}">
                      Level {title.wage_level}
                    </span>
                    {title.wage_level_description && (
                      <div className="wage-level-desc">{title.wage_level_description}</div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${title.is_active ? 'active' : 'inactive'}`}>
                      {title.is_active ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-primary" onClick={() => handleEdit(title)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(title)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <LCAJobTitleForm
          title={editingTitle}
          onClose={handleFormClose}
          onSave={handleFormSave}
          tenantId={tenant?.tenant_id}
          userId={profile?.id}
        />
      )}
    </div>
  )
}
