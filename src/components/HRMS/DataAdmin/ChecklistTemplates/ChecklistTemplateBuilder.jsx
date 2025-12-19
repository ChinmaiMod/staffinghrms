import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../../api/supabaseClient'
import { useTenant } from '../../../../contexts/TenantProvider'
import { useAuth } from '../../../../contexts/AuthProvider'
import ChecklistItemForm from './ChecklistItemForm'
import ChecklistGroupForm from './ChecklistGroupForm'
import './ChecklistTemplateBuilder.css'

const EMPLOYEE_TYPES = [
  { value: 'internal_india', label: 'Internal India' },
  { value: 'internal_usa', label: 'Internal USA' },
  { value: 'it_usa', label: 'IT USA' },
  { value: 'nonit_usa', label: 'Non-IT USA' },
  { value: 'healthcare_usa', label: 'Healthcare USA' },
]

export default function ChecklistTemplateBuilder({ template, onClose, onSave, tenantId, userId }) {
  const { tenant } = useTenant()
  const { profile } = useAuth()
  const [formData, setFormData] = useState({
    template_name: '',
    checklist_type_id: '',
    employee_type: '',
    description: '',
    is_active: true,
  })

  const [checklistTypes, setChecklistTypes] = useState([])
  const [groups, setGroups] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editingGroup, setEditingGroup] = useState(null)
  const [selectedGroupId, setSelectedGroupId] = useState(null)

  useEffect(() => {
    loadChecklistTypes()
    if (template) {
      loadTemplateData()
    }
  }, [template])

  const loadChecklistTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('hrms_checklist_types')
        .select('*')
        .eq('tenant_id', tenantId || tenant?.tenant_id)
        .eq('is_active', true)
        .order('type_name', { ascending: true })

      if (error) throw error
      setChecklistTypes(data || [])

      if (template && data) {
        setFormData((prev) => ({
          ...prev,
          checklist_type_id: template.checklist_type_id,
          template_name: template.template_name || '',
          employee_type: template.employee_type || '',
          description: template.description || '',
          is_active: template.is_active ?? true,
        }))
      }
    } catch (err) {
      console.error('Error loading checklist types:', err)
    }
  }

  const loadTemplateData = async () => {
    if (!template?.template_id) return

    try {
      setLoading(true)

      // Load groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('hrms_checklist_groups')
        .select('*')
        .eq('template_id', template.template_id)
        .order('display_order', { ascending: true })

      if (groupsError) throw groupsError
      setGroups(groupsData || [])

      // Load items
      const { data: itemsData, error: itemsError } = await supabase
        .from('hrms_checklist_items')
        .select('*')
        .eq('template_id', template.template_id)
        .order('display_order', { ascending: true })

      if (itemsError) throw itemsError
      setItems(itemsData || [])
    } catch (err) {
      console.error('Error loading template data:', err)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.template_name || formData.template_name.trim().length === 0) {
      newErrors.template_name = 'Template name is required'
    }

    if (!formData.checklist_type_id) {
      newErrors.checklist_type_id = 'Checklist type is required'
    }

    const selectedType = checklistTypes.find((t) => t.checklist_type_id === formData.checklist_type_id)
    if (selectedType?.require_employee_type && !formData.employee_type) {
      newErrors.employee_type = 'Employee type is required for this checklist type'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const effectiveTenantId = tenantId || tenant?.tenant_id
      const effectiveUserId = userId || profile?.id

      if (template) {
        // Update template
        const { data: updatedTemplate, error: updateError } = await supabase
          .from('hrms_checklist_templates')
          .update({
            ...formData,
            updated_by: effectiveUserId,
          })
          .eq('template_id', template.template_id)
          .eq('tenant_id', effectiveTenantId)
          .select()
          .single()

        if (updateError) throw updateError

        // Save groups and items
        await saveGroupsAndItems(updatedTemplate.template_id)
      } else {
        // Create template
        const { data: newTemplate, error: insertError } = await supabase
          .from('hrms_checklist_templates')
          .insert({
            ...formData,
            tenant_id: effectiveTenantId,
            created_by: effectiveUserId,
            updated_by: effectiveUserId,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Save groups and items
        await saveGroupsAndItems(newTemplate.template_id)
      }

      onSave()
    } catch (err) {
      console.error('Error saving template:', err)
      alert('Failed to save template: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveGroupsAndItems = async (templateId) => {
    // Save groups
    for (const group of groups) {
      if (group.group_id) {
        // Update existing group
        await supabase
          .from('hrms_checklist_groups')
          .update({
            group_name: group.group_name,
            group_description: group.group_description,
            display_order: group.display_order,
          })
          .eq('group_id', group.group_id)
      } else {
        // Create new group
        const { data: newGroup, error } = await supabase
          .from('hrms_checklist_groups')
          .insert({
            tenant_id: tenantId || tenant?.tenant_id,
            template_id: templateId,
            group_name: group.group_name,
            group_description: group.group_description,
            display_order: group.display_order,
          })
          .select()
          .single()

        if (error) throw error

        // Update items with new group_id
        const groupItems = items.filter((item) => item.__temp_group_id === group.__temp_id)
        for (const item of groupItems) {
          item.group_id = newGroup.group_id
          delete item.__temp_group_id
        }
      }
    }

    // Save items
    for (const item of items) {
      const itemData = {
        tenant_id: tenantId || tenant?.tenant_id,
        template_id: templateId,
        group_id: item.group_id,
        item_name: item.item_name,
        item_description: item.item_description,
        display_order: item.display_order,
        is_required: item.is_required ?? false,
        compliance_tracking_flag: item.compliance_tracking_flag ?? false,
        visible_to_employee_flag: item.visible_to_employee_flag ?? true,
        enable_ai_parsing: item.enable_ai_parsing ?? true,
      }

      if (item.item_id) {
        // Update existing item
        await supabase.from('hrms_checklist_items').update(itemData).eq('item_id', item.item_id)
      } else {
        // Create new item
        await supabase.from('hrms_checklist_items').insert(itemData)
      }
    }
  }

  const handleAddGroup = () => {
    setEditingGroup(null)
    setShowGroupForm(true)
  }

  const handleEditGroup = (group) => {
    setEditingGroup(group)
    setShowGroupForm(true)
  }

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Delete group "${group.group_name}"? All items in this group will be removed.`)) {
      return
    }

    if (group.group_id) {
      // Delete from database
      await supabase.from('hrms_checklist_groups').delete().eq('group_id', group.group_id)
    }

    // Remove items in this group
    setItems((prev) => prev.filter((item) => item.group_id !== group.group_id))
    // Remove group
    setGroups((prev) => prev.filter((g) => g.group_id !== group.group_id))
  }

  const handleAddItem = (groupId) => {
    setSelectedGroupId(groupId)
    setEditingItem(null)
    setShowItemForm(true)
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setShowItemForm(true)
  }

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Delete item "${item.item_name}"?`)) {
      return
    }

    if (item.item_id) {
      await supabase.from('hrms_checklist_items').delete().eq('item_id', item.item_id)
    }

    setItems((prev) => prev.filter((i) => i.item_id !== item.item_id && i.__temp_id !== item.__temp_id))
  }

  const handleGroupSave = (groupData) => {
    if (editingGroup) {
      setGroups((prev) =>
        prev.map((g) => (g.group_id === editingGroup.group_id ? { ...g, ...groupData } : g))
      )
    } else {
      const newGroup = {
        ...groupData,
        __temp_id: Date.now(),
        display_order: groups.length,
      }
      setGroups((prev) => [...prev, newGroup])
    }
    setShowGroupForm(false)
    setEditingGroup(null)
  }

  const handleItemSave = (itemData) => {
    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.item_id === editingItem.item_id || i.__temp_id === editingItem.__temp_id
            ? { ...i, ...itemData }
            : i
        )
      )
    } else {
      const newItem = {
        ...itemData,
        group_id: selectedGroupId,
        __temp_id: Date.now(),
        display_order: items.filter((i) => i.group_id === selectedGroupId).length,
      }
      setItems((prev) => [...prev, newItem])
    }
    setShowItemForm(false)
    setEditingItem(null)
    setSelectedGroupId(null)
  }

  const getItemsForGroup = (groupId) => {
    return items.filter((item) => item.group_id === groupId).sort((a, b) => a.display_order - b.display_order)
  }

  const selectedType = checklistTypes.find((t) => t.checklist_type_id === formData.checklist_type_id)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content checklist-template-builder" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{template ? 'Edit Template' : 'Create Template'}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Template Settings</h3>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Template Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.template_name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, template_name: e.target.value }))
                    if (errors.template_name) {
                      setErrors((prev) => ({ ...prev, template_name: '' }))
                    }
                  }}
                  className={errors.template_name ? 'error' : ''}
                  placeholder="IT USA Immigration Checklist"
                />
                {errors.template_name && <span className="error-text">{errors.template_name}</span>}
              </div>

              <div className="form-group">
                <label>
                  Checklist Type <span className="required">*</span>
                </label>
                <select
                  value={formData.checklist_type_id}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, checklist_type_id: e.target.value, employee_type: '' }))
                    if (errors.checklist_type_id) {
                      setErrors((prev) => ({ ...prev, checklist_type_id: '' }))
                    }
                  }}
                  className={errors.checklist_type_id ? 'error' : ''}
                  disabled={!!template}
                >
                  <option value="">Select type...</option>
                  {checklistTypes.map((type) => (
                    <option key={type.checklist_type_id} value={type.checklist_type_id}>
                      {type.type_name}
                    </option>
                  ))}
                </select>
                {errors.checklist_type_id && <span className="error-text">{errors.checklist_type_id}</span>}
              </div>
            </div>

            {selectedType?.require_employee_type && (
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Employee Type <span className="required">*</span>
                  </label>
                  <select
                    value={formData.employee_type}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, employee_type: e.target.value }))
                      if (errors.employee_type) {
                        setErrors((prev) => ({ ...prev, employee_type: '' }))
                      }
                    }}
                    className={errors.employee_type ? 'error' : ''}
                  >
                    <option value="">Select employee type...</option>
                    {EMPLOYEE_TYPES.map((et) => (
                      <option key={et.value} value={et.value}>
                        {et.label}
                      </option>
                    ))}
                  </select>
                  {errors.employee_type && <span className="error-text">{errors.employee_type}</span>}
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, is_active: e.target.value === 'active' }))
                    }
                  >
                    <option value="active">● Active</option>
                    <option value="inactive">○ Inactive</option>
                  </select>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="Immigration documents required for IT USA employees on work visas"
              />
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Checklist Structure</h3>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleAddGroup}>
                + Add Group
              </button>
            </div>

            {groups.length === 0 && (
              <div className="empty-groups">
                <p>No groups yet. Add your first group to start building the checklist.</p>
              </div>
            )}

            {groups.map((group) => {
              const groupItems = getItemsForGroup(group.group_id || group.__temp_id)
              return (
                <div key={group.group_id || group.__temp_id} className="checklist-group">
                  <div className="group-header">
                    <div className="group-info">
                      <span className="group-icon">📁</span>
                      <div>
                        <h4>{group.group_name}</h4>
                        {group.group_description && <p className="group-description">{group.group_description}</p>}
                        <span className="item-count">{groupItems.length} items</span>
                      </div>
                    </div>
                    <div className="group-actions">
                      <button type="button" className="btn-icon" onClick={() => handleEditGroup(group)} title="Edit">
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-danger"
                        onClick={() => handleDeleteGroup(group)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="group-items">
                    {groupItems.map((item) => (
                      <div key={item.item_id || item.__temp_id} className="checklist-item">
                        <div className="item-content">
                          <div className="item-header">
                            <span className="item-checkbox">{item.is_required ? '☑' : '☐'}</span>
                            <span className="item-name">{item.item_name}</span>
                            <span className="item-badge">{item.is_required ? 'Required' : 'Optional'}</span>
                          </div>
                          {item.item_description && (
                            <p className="item-description">ℹ️ {item.item_description}</p>
                          )}
                          <div className="item-flags">
                            {item.compliance_tracking_flag && <span>Compliance: ✅</span>}
                            {item.enable_ai_parsing && <span>AI Parsing: ✅</span>}
                            {item.visible_to_employee_flag && <span>Visible: ✅</span>}
                          </div>
                        </div>
                        <div className="item-actions">
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleEditItem(item)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn-icon btn-danger"
                            onClick={() => handleDeleteItem(item)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm add-item-btn"
                      onClick={() => handleAddItem(group.group_id || group.__temp_id)}
                    >
                      + Add Item to Group
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : template ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </form>

        {showGroupForm && (
          <ChecklistGroupForm
            group={editingGroup}
            onClose={() => {
              setShowGroupForm(false)
              setEditingGroup(null)
            }}
            onSave={handleGroupSave}
          />
        )}

        {showItemForm && (
          <ChecklistItemForm
            item={editingItem}
            groups={groups}
            defaultGroupId={selectedGroupId}
            onClose={() => {
              setShowItemForm(false)
              setEditingItem(null)
              setSelectedGroupId(null)
            }}
            onSave={handleItemSave}
          />
        )}
      </div>
    </div>
  )
}
