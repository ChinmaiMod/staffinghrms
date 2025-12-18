import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import InternalStaffForm from './InternalStaffForm'
import { supabase } from '../../../../api/supabaseClient'
import { useTenant } from '../../../../contexts/TenantProvider'
import { useAuth } from '../../../../contexts/AuthProvider'

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'INACTIVE', label: 'Inactive' }
]

const STATUS_BADGES = {
  ACTIVE: { label: 'Active', tone: 'status-active' },
  ON_LEAVE: { label: 'On Leave', tone: 'status-on-leave' },
  INACTIVE: { label: 'Inactive', tone: 'status-inactive' }
}

const normalizeStaffRecord = (record) => {
  if (!record) return null

  const identifier = record.staff_id || record.id
  const business = record.businesses || null

  return {
    ...record,
    __identifier: identifier,
    fullName: `${record.first_name || ''} ${record.last_name || ''}`.trim(),
    business_id: record.business_id || '',
    business_name: business?.business_name || null,
    start_date: record.start_date || null,
    end_date: record.end_date || null,
    is_billable: record.is_billable ?? false
  }
}

const normalizeBusiness = (business) => {
  if (!business) return null
  const id = business.business_id || business.id
  return {
    id,
    name: business.business_name || 'Unnamed Business',
    isDefault: business.is_default || false
  }
}

export default function InternalStaffPage() {
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const { profile } = useAuth()

  const [businesses, setBusinesses] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [formVisible, setFormVisible] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [businessFilter, setBusinessFilter] = useState('ALL')

  const canManageStaff = useMemo(() => {
    if (!profile?.role) return true
    const elevatedRoles = ['ADMIN', 'SUPER_ADMIN', 'CEO']
    return elevatedRoles.includes(profile.role)
  }, [profile?.role])

  const businessLookup = useMemo(() => {
    return businesses.reduce((acc, business) => {
      acc[business.id] = business
      return acc
    }, {})
  }, [businesses])

  const loadBusinesses = useCallback(async () => {
    if (!tenant?.tenant_id) {
      setBusinesses([])
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('businesses')
        .select('business_id, business_name, is_default')
        .eq('tenant_id', tenant.tenant_id)
        .order('is_default', { ascending: false })
        .order('business_name', { ascending: true })

      if (fetchError) throw fetchError

      const mapped = (data || []).map(normalizeBusiness).filter(Boolean)
      setBusinesses(mapped)
    } catch (fetchError) {
      console.error('Failed to load businesses:', fetchError)
      setBusinesses([])
      setError(fetchError.message || 'Unable to load businesses for staff assignment.')
    }
  }, [tenant?.tenant_id])

  const loadStaff = useCallback(async () => {
    if (!tenant?.tenant_id) {
      setStaff([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error: fetchError } = await supabase
        .from('internal_staff')
        .select('*, businesses ( business_name )')
        .eq('tenant_id', tenant.tenant_id)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })

      if (fetchError) throw fetchError

      const normalized = (data || []).map(normalizeStaffRecord).filter(Boolean)
      setStaff(normalized)
    } catch (fetchError) {
      console.error('Failed to load internal staff:', fetchError)
      setError(fetchError.message || 'Unable to load staff directory.')
      setStaff([])
    } finally {
      setLoading(false)
    }
  }, [tenant?.tenant_id])

  useEffect(() => {
    loadBusinesses()
  }, [loadBusinesses])

  useEffect(() => {
    loadStaff()
  }, [loadStaff])

  const filteredStaff = useMemo(() => {
    let results = staff

    if (statusFilter !== 'ALL') {
      results = results.filter((member) => member.status === statusFilter)
    }

    if (businessFilter !== 'ALL') {
      results = results.filter((member) => {
        if (businessFilter === '') return !member.business_id
        return member.business_id === businessFilter
      })
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase()
      results = results.filter((member) =>
        member.fullName.toLowerCase().includes(term) ||
        member.email?.toLowerCase().includes(term) ||
        member.job_title?.toLowerCase().includes(term) ||
        member.department?.toLowerCase().includes(term)
      )
    }

    return results
  }, [staff, statusFilter, businessFilter, searchTerm])

  const resetFormState = () => {
    setFormVisible(false)
    setEditingStaff(null)
    setSubmitting(false)
  }

  const handleCreateClick = () => {
    setEditingStaff(null)
    setFormVisible(true)
  }

  const handleEditClick = (member) => {
    setEditingStaff(member)
    setFormVisible(true)
  }

  const handleDeleteClick = async (member) => {
    if (!canManageStaff) return
    const confirmMessage = `Remove ${member.fullName || 'this team member'} from internal staff?`
    if (!window.confirm(confirmMessage)) return

    try {
      const { error: deleteError } = await supabase
        .from('internal_staff')
        .delete()
        .eq('staff_id', member.__identifier)

      if (deleteError) throw deleteError
      await loadStaff()
    } catch (deleteError) {
      console.error('Failed to delete internal staff member:', deleteError)
      setError(deleteError.message || 'Unable to delete staff member.')
    }
  }

  const handleFormSubmit = async (formValues) => {
    if (!tenant?.tenant_id) return
    if (!canManageStaff) return

    setSubmitting(true)
    setError('')

    const timestamp = new Date().toISOString()
    const payload = {
      ...formValues,
      tenant_id: tenant.tenant_id,
      updated_at: timestamp,
      updated_by: profile?.id || null
    }

    if (!editingStaff) {
      payload.created_at = timestamp
      payload.created_by = profile?.id || null
    }

    try {
      if (editingStaff) {
        const { error: updateError } = await supabase
          .from('internal_staff')
          .update(payload)
          .eq('staff_id', editingStaff.__identifier)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('internal_staff')
          .insert([payload])

        if (insertError) throw insertError
      }

      await loadStaff()
      resetFormState()
    } catch (submitError) {
      console.error('Failed to save internal staff member:', submitError)
      setError(submitError.message || 'Unable to save staff member.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderEmptyState = () => (
    <div className="empty-state">
      <div className="empty-state-icon">👥</div>
      <h3>No internal staff yet</h3>
      <p>Add recruiters, leads, and other internal team members so you can assign work and track resources.</p>
      {canManageStaff && (
        <button className="btn btn-primary" onClick={handleCreateClick}>
          + Add Team Member
        </button>
      )}
    </div>
  )

  return (
    <div className="data-table-container">
      <div style={{ marginBottom: '16px' }}>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/crm/data-admin')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '14px',
            padding: '8px 16px'
          }}
        >
          ← Back to All Tables
        </button>
      </div>
      
      <div className="table-header">
        <div>
          <h2>👥 Internal Staff</h2>
          <p style={{ margin: 0, color: '#64748b' }}>
            Manage team members for <strong>{tenant?.company_name || tenant?.tenant_id || 'your tenant'}</strong>
          </p>
        </div>
        {canManageStaff && (
          <div className="table-actions">
            <button className="btn btn-primary" onClick={handleCreateClick}>
              + Add Team Member
            </button>
          </div>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="search"
            placeholder="Search by name, email, job title, or department"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={businessFilter}
          onChange={(event) => setBusinessFilter(event.target.value)}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '200px' }}
        >
          <option value="ALL">All businesses</option>
          <option value="">Global / Not Assigned</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="alert alert-error" style={{ margin: '16px 24px' }}>
          {error}
        </div>
      )}

      {formVisible && (
        <div style={{ padding: '24px' }}>
          <InternalStaffForm
            initialValues={editingStaff}
            businesses={businesses}
            onSubmit={handleFormSubmit}
            onCancel={resetFormState}
            submitting={submitting}
          />
        </div>
      )}

      {loading ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Business</th>
              <th>Status</th>
              <th>Job Title</th>
              <th>Department</th>
              <th>Dates</th>
              <th>Billable</th>
              {canManageStaff && <th style={{ width: '160px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={index}>
                <td colSpan={canManageStaff ? 9 : 8}>
                  <div className="skeleton" style={{ height: '20px', margin: '6px 0' }}></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : filteredStaff.length === 0 ? (
        renderEmptyState()
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Business</th>
              <th>Status</th>
              <th>Job Title</th>
              <th>Department</th>
              <th>Dates</th>
              <th>Billable</th>
              {canManageStaff && <th style={{ width: '160px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((member) => {
              const business = member.business_id ? businessLookup[member.business_id] : null
              const businessName = business?.name || member.business_name || '—'
              const formattedStart = member.start_date ? new Date(member.start_date).toLocaleDateString() : '—'
              const formattedEnd = member.end_date ? new Date(member.end_date).toLocaleDateString() : '—'
              const statusMeta = STATUS_BADGES[member.status] || STATUS_BADGES.INACTIVE

              return (
                <tr key={member.__identifier}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{member.fullName || '—'}</div>
                    {member.phone && (
                      <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{member.phone}</div>
                    )}
                  </td>
                  <td>
                    {member.email ? (
                      <a href={`mailto:${member.email}`} style={{ color: '#2563eb' }}>
                        {member.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {member.business_id ? (
                      <span className="status-badge" style={{ background: '#e0f2fe', color: '#0c4a6e' }}>
                        {businessName}
                      </span>
                    ) : (
                      <span className="status-badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                        Global
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${statusMeta.tone}`}>
                      {statusMeta.label}
                    </span>
                  </td>
                  <td>{member.job_title || '—'}</td>
                  <td>{member.department || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span><strong>Start:</strong> {formattedStart}</span>
                      <span><strong>End:</strong> {formattedEnd}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={member.is_billable
                        ? { background: '#dcfce7', color: '#166534' }
                        : { background: '#f1f5f9', color: '#475569' }
                      }
                    >
                      {member.is_billable ? 'Billable' : 'Non-billable'}
                    </span>
                  </td>
                  {canManageStaff && (
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(member)}>
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(member)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
