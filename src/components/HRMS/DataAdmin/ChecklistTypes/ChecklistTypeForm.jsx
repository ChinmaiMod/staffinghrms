import { useState, useEffect } from 'react'
import { supabase } from '../../../../api/supabaseClient'
import { validateTextField } from '../../../../utils/validators'
import './ChecklistTypeForm.css'

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

const COMMON_TABLES = [
  { value: 'hrms_employees', label: 'hrms_employees' },
  { value: 'hrms_projects', label: 'hrms_projects' },
  { value: 'hrms_timesheets', label: 'hrms_timesheets' },
  { value: 'contacts', label: 'contacts' },
  { value: 'businesses', label: 'businesses' },
]

const ICONS = [
  '📘', '💼', '🕐', '🛡️', '🛂', '🔍', '📊', '📋', '📄', '📝', '📑', '📌',
  '✅', '📌', '🔖', '📎', '📧', '📱', '💻', '🏢', '👤', '👥', '🎯', '⭐'
]

export default function ChecklistTypeForm({ type, onClose, onSave, tenantId, userId }) {
  const [formData, setFormData] = useState({
    type_code: '',
    type_name: '',
    type_description: '',
    target_entity_type: 'employee',
    target_table_name: 'hrms_employees',
    target_id_column: 'employee_id',
    icon: '📋',
    color_code: '#3B82F6',
    display_order: 0,
    allow_multiple_templates: true,
    require_employee_type: false,
    enable_ai_parsing: true,
    enable_compliance_tracking: true,
    is_active: true,
  })

  const [availableTables, setAvailableTables] = useState([])
  const [availableColumns, setAvailableColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (type) {
      setFormData({
        type_code: type.type_code || '',
        type_name: type.type_name || '',
        type_description: type.type_description || '',
        target_entity_type: type.target_entity_type || 'employee',
        target_table_name: type.target_table_name || 'hrms_employees',
        target_id_column: type.target_id_column || 'employee_id',
        icon: type.icon || '📋',
        color_code: type.color_code || '#3B82F6',
        display_order: type.display_order || 0,
        allow_multiple_templates: type.allow_multiple_templates ?? true,
        require_employee_type: type.require_employee_type ?? false,
        enable_ai_parsing: type.enable_ai_parsing ?? true,
        enable_compliance_tracking: type.enable_compliance_tracking ?? true,
        is_active: type.is_active ?? true,
      })
    }
  }, [type])

  useEffect(() => {
    loadAvailableTables()
  }, [])

  useEffect(() => {
    if (formData.target_table_name) {
      loadTableColumns(formData.target_table_name)
    }
  }, [formData.target_table_name])

  const loadAvailableTables = async () => {
    try {
      setLoading(true)
      // For now, use common tables. In production, you might query information_schema
      setAvailableTables(COMMON_TABLES)
    } catch (err) {
      console.error('Error loading tables:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadTableColumns = async (tableName) => {
    try {
      // Try to fetch a sample row to infer columns
      const { data, error } = await supabase.from(tableName).select('*').limit(1)

      if (error) {
        console.error('Error loading columns:', error)
        // Fallback to common column names
        setAvailableColumns([
          { value: 'id', label: 'id (UUID)' },
          { value: `${tableName.replace('hrms_', '').replace('s', '')}_id`, label: `${tableName.replace('hrms_', '').replace('s', '')}_id` },
        ])
        return
      }

      if (data && data.length > 0) {
        const sampleRow = data[0]
        const columns = Object.keys(sampleRow)
          .filter((key) => key.includes('id') || key === 'id')
          .map((key) => ({
            value: key,
            label: `${key} (${typeof sampleRow[key] === 'string' && sampleRow[key].length > 30 ? 'UUID' : 'ID'})`,
          }))
        setAvailableColumns(columns.length > 0 ? columns : [{ value: 'id', label: 'id' }])
      } else {
        // Default columns
        setAvailableColumns([{ value: 'id', label: 'id' }])
      }
    } catch (err) {
      console.error('Error loading columns:', err)
      setAvailableColumns([{ value: 'id', label: 'id' }])
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Validate type_code
    const codeValidation = validateTextField(formData.type_code, 'Type Code', {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-z0-9_]+$/,
      patternMessage: 'Type code must contain only lowercase letters, numbers, and underscores',
    })
    if (!codeValidation.valid) {
      newErrors.type_code = codeValidation.error
    }

    // Validate type_name
    const nameValidation = validateTextField(formData.type_name, 'Type Name', {
      required: true,
      minLength: 2,
      maxLength: 255,
    })
    if (!nameValidation.valid) {
      newErrors.type_name = nameValidation.error
    }

    // Validate target_table_name
    if (!formData.target_table_name) {
      newErrors.target_table_name = 'Target table is required'
    }

    // Validate target_id_column
    if (!formData.target_id_column) {
      newErrors.target_id_column = 'Target ID column is required'
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
      const payload = {
        ...formData,
        tenant_id: tenantId,
        updated_by: userId,
      }

      if (type) {
        // Update existing
        const { error: updateError } = await supabase
          .from('hrms_checklist_types')
          .update(payload)
          .eq('checklist_type_id', type.checklist_type_id)
          .eq('tenant_id', tenantId)

        if (updateError) throw updateError
      } else {
        // Create new
        payload.created_by = userId
        const { error: insertError } = await supabase
          .from('hrms_checklist_types')
          .insert(payload)

        if (insertError) throw insertError
      }

      onSave()
    } catch (err) {
      console.error('Error saving checklist type:', err)
      alert('Failed to save checklist type: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content checklist-type-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{type ? 'Edit Checklist Type' : 'Create New Checklist Type'}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Basic Information</h3>

            <div className="form-group">
              <label>
                Type Code <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.type_code}
                onChange={(e) => handleChange('type_code', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className={errors.type_code ? 'error' : ''}
                placeholder="client_onboarding"
                disabled={type?.is_system_type}
              />
              {errors.type_code && <span className="error-text">{errors.type_code}</span>}
              <small className="form-hint">Unique identifier (lowercase, underscores only)</small>
            </div>

            <div className="form-group">
              <label>
                Type Name <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.type_name}
                onChange={(e) => handleChange('type_name', e.target.value)}
                className={errors.type_name ? 'error' : ''}
                placeholder="Client Onboarding Documents"
              />
              {errors.type_name && <span className="error-text">{errors.type_name}</span>}
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.type_description}
                onChange={(e) => handleChange('type_description', e.target.value)}
                rows={3}
                placeholder="Documents required for onboarding new clients"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Entity Mapping Configuration</h3>

            <div className="form-group">
              <label>
                Target Entity Type <span className="required">*</span>
              </label>
              <select
                value={formData.target_entity_type}
                onChange={(e) => handleChange('target_entity_type', e.target.value)}
                disabled={type?.is_system_type}
              >
                {ENTITY_TYPES.map((et) => (
                  <option key={et.value} value={et.value}>
                    {et.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Target Table Name <span className="required">*</span>
              </label>
              <select
                value={formData.target_table_name}
                onChange={(e) => handleChange('target_table_name', e.target.value)}
                className={errors.target_table_name ? 'error' : ''}
                disabled={type?.is_system_type}
              >
                <option value="">Select table...</option>
                {availableTables.map((table) => (
                  <option key={table.value} value={table.value}>
                    {table.label}
                  </option>
                ))}
              </select>
              {errors.target_table_name && (
                <span className="error-text">{errors.target_table_name}</span>
              )}
            </div>

            <div className="form-group">
              <label>
                Target ID Column <span className="required">*</span>
              </label>
              <select
                value={formData.target_id_column}
                onChange={(e) => handleChange('target_id_column', e.target.value)}
                className={errors.target_id_column ? 'error' : ''}
                disabled={type?.is_system_type || !formData.target_table_name}
              >
                <option value="">Select column...</option>
                {availableColumns.map((col) => (
                  <option key={col.value} value={col.value}>
                    {col.label}
                  </option>
                ))}
              </select>
              {errors.target_id_column && (
                <span className="error-text">{errors.target_id_column}</span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Display Configuration</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Icon</label>
                <div className="icon-selector">
                  <select
                    value={formData.icon}
                    onChange={(e) => handleChange('icon', e.target.value)}
                  >
                    {ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                  <span className="icon-preview">{formData.icon}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Color</label>
                <div className="color-input-group">
                  <input
                    type="color"
                    value={formData.color_code}
                    onChange={(e) => handleChange('color_code', e.target.value)}
                  />
                  <input
                    type="text"
                    value={formData.color_code}
                    onChange={(e) => handleChange('color_code', e.target.value)}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Display Order</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Behavior Settings</h3>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.allow_multiple_templates}
                  onChange={(e) => handleChange('allow_multiple_templates', e.target.checked)}
                />
                Allow Multiple Templates
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.require_employee_type}
                  onChange={(e) => handleChange('require_employee_type', e.target.checked)}
                />
                Require Employee Type
                <small className="form-hint">
                  If checked, templates of this type must specify an employee type
                </small>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.enable_ai_parsing}
                  onChange={(e) => handleChange('enable_ai_parsing', e.target.checked)}
                />
                Enable AI Parsing
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.enable_compliance_tracking}
                  onChange={(e) => handleChange('enable_compliance_tracking', e.target.checked)}
                />
                Enable Compliance Tracking
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleChange('is_active', e.target.checked)}
                />
                Active
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : type ? 'Update Checklist Type' : 'Save Checklist Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
