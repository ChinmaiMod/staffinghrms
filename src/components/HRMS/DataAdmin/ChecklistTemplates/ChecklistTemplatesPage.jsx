import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../../../api/supabaseClient'
import { useTenant } from '../../../../contexts/TenantProvider'
import { useAuth } from '../../../../contexts/AuthProvider'
import ChecklistTemplateBuilder from './ChecklistTemplateBuilder'
import './ChecklistTemplatesPage.css'

export default function ChecklistTemplatesPage() {
  const { tenant } = useTenant()
  const { profile } = useAuth()
  const [templates, setTemplates] = useState([])
  const [checklistTypes, setChecklistTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  const fetchData = useCallback(async () => {
    if (!tenant?.tenant_id) return

    try {
      setLoading(true)
      setError('')

      // Fetch checklist types
      const { data: typesData, error: typesError } = await supabase
        .from('hrms_checklist_types')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .eq('is_active', true)
        .order('type_name', { ascending: true })

      if (typesError) throw typesError
      setChecklistTypes(typesData || [])

      // Fetch templates with type info
      const { data: templatesData, error: templatesError } = await supabase
        .from('hrms_checklist_templates')
        .select(`
          *,
          hrms_checklist_types (
            type_name,
            type_code,
            target_entity_type
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false })

      if (templatesError) throw templatesError

      // Fetch item counts for each template
      const templatesWithCounts = await Promise.all(
        (templatesData || []).map(async (template) => {
          const { count, error: countError } = await supabase
            .from('hrms_checklist_items')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.template_id)

          if (countError) {
            console.error('Error fetching item count:', countError)
            return { ...template, item_count: 0 }
          }

          return { ...template, item_count: count || 0 }
        })
      )

      setTemplates(templatesWithCounts)
    } catch (err) {
      console.error('Error fetching checklist templates:', err)
      setError(err.message || 'Failed to load checklist templates')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [tenant?.tenant_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredTemplates = useMemo(() => {
    let filtered = [...templates]

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (template) =>
          template.template_name.toLowerCase().includes(term) ||
          template.hrms_checklist_types?.type_name?.toLowerCase().includes(term)
      )
    }

    // Filter by checklist type
    if (filterType !== 'ALL') {
      filtered = filtered.filter((template) => template.checklist_type_id === filterType)
    }

    return filtered
  }, [templates, searchTerm, filterType])

  // Group templates by checklist type
  const groupedTemplates = useMemo(() => {
    const groups = {}
    filteredTemplates.forEach((template) => {
      const typeName = template.hrms_checklist_types?.type_name || 'Unknown'
      if (!groups[typeName]) {
        groups[typeName] = []
      }
      groups[typeName].push(template)
    })
    return groups
  }, [filteredTemplates])

  if (loading) {
    return (
      <div className="checklist-templates-page">
        <div className="loading">Loading checklist templates...</div>
      </div>
    )
  }

  return (
    <div className="checklist-templates-page">
      <div className="crm-header">
        <h1>Checklist Templates Management</h1>
        <p style={{ margin: 0, color: '#64748b' }}>
          Create and manage document checklists for employees, projects, and other entities
        </p>
      </div>

      <div className="checklist-templates-actions">
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingTemplate(null)
            setShowBuilder(true)
          }}
        >
          + Create Template
        </button>
        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="🔍 Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Types</option>
            {checklistTypes.map((type) => (
              <option key={type.checklist_type_id} value={type.checklist_type_id}>
                {type.type_name}
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

      {Object.keys(groupedTemplates).length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No Checklist Templates Found</h3>
          <p>
            {searchTerm || filterType !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Create your first checklist template to get started'}
          </p>
        </div>
      )}

      {Object.entries(groupedTemplates).map(([typeName, typeTemplates]) => (
        <div key={typeName} className="checklist-templates-section">
          <h2>{typeName} Checklists</h2>
          <div className="checklist-templates-grid">
            {typeTemplates.map((template) => (
              <div key={template.template_id} className="checklist-template-card">
                <div className="checklist-template-card-header">
                  <h3>{template.template_name}</h3>
                  {template.employee_type && (
                    <span className="employee-type-badge">{template.employee_type}</span>
                  )}
                </div>
                <div className="checklist-template-card-body">
                  <div className="template-stats">
                    <div className="stat-item">
                      <span className="stat-label">Items:</span>
                      <span className="stat-value">{template.item_count || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Status:</span>
                      <span className="stat-value">
                        {template.is_active ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                  </div>
                  {template.description && (
                    <div className="template-description">{template.description}</div>
                  )}
                </div>
                <div className="checklist-template-card-actions">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      setEditingTemplate(template)
                      setShowBuilder(true)
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={async () => {
                      try {
                        // Fetch full template data for duplication
                        const { data: templateData, error: templateError } = await supabase
                          .from('hrms_checklist_templates')
                          .select('*')
                          .eq('template_id', template.template_id)
                          .single()

                        if (templateError) throw templateError

                        // Create duplicate without template_id
                        const duplicate = { ...templateData }
                        delete duplicate.template_id
                        duplicate.template_name = `${duplicate.template_name} (Copy)`

                        setEditingTemplate(duplicate)
                        setShowBuilder(true)
                      } catch (err) {
                        console.error('Error duplicating template:', err)
                        alert('Failed to duplicate template: ' + err.message)
                      }
                    }}
                  >
                    Duplicate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showBuilder && (
        <ChecklistTemplateBuilder
          template={editingTemplate}
          onClose={() => {
            setShowBuilder(false)
            setEditingTemplate(null)
          }}
          onSave={() => {
            setShowBuilder(false)
            setEditingTemplate(null)
            fetchData()
          }}
          tenantId={tenant?.tenant_id}
          userId={profile?.id}
        />
      )}
    </div>
  )
}
