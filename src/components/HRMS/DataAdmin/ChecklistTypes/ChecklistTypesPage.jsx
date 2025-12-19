import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../../../api/supabaseClient'
import { useTenant } from '../../../../contexts/TenantProvider'
import { useAuth } from '../../../../contexts/AuthProvider'
import ChecklistTypeForm from './ChecklistTypeForm'
import ChecklistTypeDetails from './ChecklistTypeDetails'
import './ChecklistTypesPage.css'

const ENTITY_TYPES = [
  { value: 'employee', label: 'Employee' },
  { value: 'project', label: 'Project' },
  { value: 'timesheet', label: 'Timesheet' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'visa', label: 'Visa' },
  { value: 'background_check', label: 'Background Check' },
  { value: 'performance', label: 'Performance' },
  { value: 'custom', label: 'Custom' },
]

export default function ChecklistTypesPage() {
  const { tenant } = useTenant()
  const { profile } = useAuth()
  const [checklistTypes, setChecklistTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [viewingType, setViewingType] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('ALL')

  const fetchChecklistTypes = useCallback(async () => {
    if (!tenant?.tenant_id) return

    try {
      setLoading(true)
      setError('')

      // Fetch checklist types with template counts
      const { data: typesData, error: typesError } = await supabase
        .from('hrms_checklist_types')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .order('is_system_type', { ascending: false })
        .order('display_order', { ascending: true })
        .order('type_name', { ascending: true })

      if (typesError) throw typesError

      // Fetch template counts for each type
      const typesWithCounts = await Promise.all(
        (typesData || []).map(async (type) => {
          const { count, error: countError } = await supabase
            .from('hrms_checklist_templates')
            .select('*', { count: 'exact', head: true })
            .eq('checklist_type_id', type.checklist_type_id)

          if (countError) {
            console.error('Error fetching template count:', countError)
            return { ...type, template_count: 0 }
          }

          return { ...type, template_count: count || 0 }
        })
      )

      setChecklistTypes(typesWithCounts)
    } catch (err) {
      console.error('Error fetching checklist types:', err)
      setError(err.message || 'Failed to load checklist types')
      setChecklistTypes([])
    } finally {
      setLoading(false)
    }
  }, [tenant?.tenant_id])

  useEffect(() => {
    fetchChecklistTypes()
  }, [fetchChecklistTypes])

  const handleCreate = () => {
    setEditingType(null)
    setShowForm(true)
  }

  const handleEdit = (type) => {
    setEditingType(type)
    setShowForm(true)
  }

  const handleView = async (type) => {
    // Fetch additional details for viewing
    try {
      const { data: templates, error: templatesError } = await supabase
        .from('hrms_checklist_templates')
        .select('*')
        .eq('checklist_type_id', type.checklist_type_id)
        .order('created_at', { ascending: false })

      if (templatesError) throw templatesError

      const { count: documentsCount, error: docsError } = await supabase
        .from('hrms_documents')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', type.target_entity_type)

      if (docsError) console.error('Error fetching documents count:', docsError)

      setViewingType({
        ...type,
        templates: templates || [],
        documents_count: documentsCount || 0,
      })
    } catch (err) {
      console.error('Error loading type details:', err)
      setViewingType(type)
    }
  }

  const handleDelete = async (type) => {
    if (type.is_system_type) {
      alert('System types cannot be deleted')
      return
    }

    // Check if type has templates
    if (type.template_count > 0) {
      const confirmMessage = `This checklist type has ${type.template_count} template(s). Deleting it will affect all associated templates and documents. Are you sure you want to delete "${type.type_name}"?`
      if (!window.confirm(confirmMessage)) return
    } else {
      if (!window.confirm(`Delete checklist type "${type.type_name}"? This action cannot be undone.`)) return
    }

    try {
      const { error: deleteError } = await supabase
        .from('hrms_checklist_types')
        .delete()
        .eq('checklist_type_id', type.checklist_type_id)
        .eq('tenant_id', tenant.tenant_id)

      if (deleteError) throw deleteError

      fetchChecklistTypes()
    } catch (err) {
      console.error('Error deleting checklist type:', err)
      alert('Failed to delete checklist type: ' + err.message)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingType(null)
  }

  const handleFormSave = () => {
    handleFormClose()
    fetchChecklistTypes()
  }

  const handleDetailsClose = () => {
    setViewingType(null)
  }

  const filteredTypes = useMemo(() => {
    let filtered = [...checklistTypes]

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (type) =>
          type.type_name.toLowerCase().includes(term) ||
          type.type_code.toLowerCase().includes(term) ||
          type.type_description?.toLowerCase().includes(term)
      )
    }

    // Filter by category
    if (filterCategory !== 'ALL') {
      if (filterCategory === 'SYSTEM') {
        filtered = filtered.filter((type) => type.is_system_type)
      } else if (filterCategory === 'CUSTOM') {
        filtered = filtered.filter((type) => !type.is_system_type)
      }
    }

    // Filter by entity type
    if (filterType !== 'ALL') {
      filtered = filtered.filter((type) => type.target_entity_type === filterType)
    }

    return filtered
  }, [checklistTypes, searchTerm, filterType, filterCategory])

  const systemTypes = useMemo(() => filteredTypes.filter((t) => t.is_system_type), [filteredTypes])
  const customTypes = useMemo(() => filteredTypes.filter((t) => !t.is_system_type), [filteredTypes])

  if (loading) {
    return (
      <div className="checklist-types-page">
        <div className="loading">Loading checklist types...</div>
      </div>
    )
  }

  return (
    <div className="checklist-types-page">
      <div className="crm-header">
        <h1>Checklist Type Management</h1>
        <p style={{ margin: 0, color: '#64748b' }}>
          Define and configure checklist types for document workflows across the system
        </p>
      </div>

      <div className="checklist-types-actions">
        <button className="btn btn-primary" onClick={handleCreate}>
          + Create New Checklist Type
        </button>
        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="🔍 Search types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Types</option>
            <option value="SYSTEM">System Types</option>
            <option value="CUSTOM">Custom Types</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Entity Types</option>
            {ENTITY_TYPES.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
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

      {systemTypes.length > 0 && (
        <div className="checklist-types-section">
          <h2>System Types</h2>
          <div className="checklist-types-grid">
            {systemTypes.map((type) => (
              <ChecklistTypeCard
                key={type.checklist_type_id}
                type={type}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                isSystemType={true}
              />
            ))}
          </div>
        </div>
      )}

      {customTypes.length > 0 && (
        <div className="checklist-types-section">
          <h2>Custom Types</h2>
          <div className="checklist-types-grid">
            {customTypes.map((type) => (
              <ChecklistTypeCard
                key={type.checklist_type_id}
                type={type}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                isSystemType={false}
              />
            ))}
          </div>
        </div>
      )}

      {filteredTypes.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No Checklist Types Found</h3>
          <p>
            {searchTerm || filterType !== 'ALL' || filterCategory !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Create your first checklist type to get started'}
          </p>
        </div>
      )}

      {showForm && (
        <ChecklistTypeForm
          type={editingType}
          onClose={handleFormClose}
          onSave={handleFormSave}
          tenantId={tenant?.tenant_id}
          userId={profile?.id}
        />
      )}

      {viewingType && (
        <ChecklistTypeDetails type={viewingType} onClose={handleDetailsClose} onEdit={handleEdit} />
      )}
    </div>
  )
}

function ChecklistTypeCard({ type, onEdit, onView, onDelete, isSystemType }) {
  const getIcon = () => {
    if (type.icon) return type.icon
    const iconMap = {
      employee: '👤',
      project: '💼',
      timesheet: '🕐',
      compliance: '🛡️',
      visa: '🛂',
      background_check: '🔍',
      performance: '📊',
      custom: '📋',
    }
    return iconMap[type.target_entity_type] || '📋'
  }

  return (
    <div className="checklist-type-card">
      <div className="checklist-type-card-header">
        <div className="checklist-type-icon">{getIcon()}</div>
        <div className="checklist-type-title">
          <h3>{type.type_name}</h3>
          {isSystemType && <span className="system-badge">🔒 System Type</span>}
        </div>
        <div className="checklist-type-actions">
          <button className="btn-icon" onClick={() => onEdit(type)} title="Edit">
            ✏️
          </button>
          <button className="btn-icon" onClick={() => onView(type)} title="View Details">
            👁️
          </button>
          {!isSystemType && (
            <button className="btn-icon btn-danger" onClick={() => onDelete(type)} title="Delete">
              🗑️
            </button>
          )}
        </div>
      </div>
      <div className="checklist-type-card-body">
        <div className="checklist-type-info">
          <div className="info-row">
            <span className="info-label">Maps to:</span>
            <span className="info-value">
              {type.target_table_name}.{type.target_id_column}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Entity Type:</span>
            <span className="info-value">
              {ENTITY_TYPES.find((et) => et.value === type.target_entity_type)?.label ||
                type.target_entity_type}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Templates:</span>
            <span className="info-value">{type.template_count || 0}</span>
          </div>
          {type.require_employee_type && (
            <div className="info-row">
              <span className="info-label">Requires Employee Type:</span>
              <span className="info-value">Yes</span>
            </div>
          )}
        </div>
        {type.type_description && (
          <div className="checklist-type-description">{type.type_description}</div>
        )}
      </div>
    </div>
  )
}
