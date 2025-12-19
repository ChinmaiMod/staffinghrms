import { useState, useEffect } from 'react'
import { validateTextField } from '../../../../utils/validators'
import './ChecklistItemForm.css'

export default function ChecklistItemForm({ item, groups, defaultGroupId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    item_name: '',
    item_description: '',
    group_id: defaultGroupId || '',
    display_order: 0,
    is_required: false,
    compliance_tracking_flag: false,
    visible_to_employee_flag: true,
    enable_ai_parsing: true,
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (item) {
      setFormData({
        item_name: item.item_name || '',
        item_description: item.item_description || '',
        group_id: item.group_id || '',
        display_order: item.display_order || 0,
        is_required: item.is_required ?? false,
        compliance_tracking_flag: item.compliance_tracking_flag ?? false,
        visible_to_employee_flag: item.visible_to_employee_flag ?? true,
        enable_ai_parsing: item.enable_ai_parsing ?? true,
      })
    } else if (defaultGroupId) {
      setFormData((prev) => ({ ...prev, group_id: defaultGroupId }))
    }
  }, [item, defaultGroupId])

  const handleSubmit = (e) => {
    e.preventDefault()

    const nameValidation = validateTextField(formData.item_name, 'Item Name', {
      required: true,
      minLength: 2,
      maxLength: 255,
    })

    if (!nameValidation.valid) {
      setErrors({ item_name: nameValidation.error })
      return
    }

    if (!formData.group_id) {
      setErrors({ group_id: 'Group is required' })
      return
    }

    onSave(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content checklist-item-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? 'Edit Checklist Item' : 'Add Checklist Item'}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Item Name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.item_name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, item_name: e.target.value }))
                if (errors.item_name) {
                  setErrors((prev) => ({ ...prev, item_name: '' }))
                }
              }}
              className={errors.item_name ? 'error' : ''}
              placeholder="I-9 Form"
            />
            {errors.item_name && <span className="error-text">{errors.item_name}</span>}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.item_description}
              onChange={(e) => setFormData((prev) => ({ ...prev, item_description: e.target.value }))}
              rows={3}
              placeholder="Employment Eligibility Verification form required by USCIS"
            />
          </div>

          <div className="form-group">
            <label>
              Group <span className="required">*</span>
            </label>
            <select
              value={formData.group_id}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, group_id: e.target.value }))
                if (errors.group_id) {
                  setErrors((prev) => ({ ...prev, group_id: '' }))
                }
              }}
              className={errors.group_id ? 'error' : ''}
            >
              <option value="">Select group...</option>
              {groups.map((group) => (
                <option key={group.group_id || group.__temp_id} value={group.group_id || group.__temp_id}>
                  {group.group_name}
                </option>
              ))}
            </select>
            {errors.group_id && <span className="error-text">{errors.group_id}</span>}
          </div>

          <div className="form-group">
            <label>Display Order</label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              min="0"
            />
          </div>

          <div className="form-section">
            <h3>Item Flags</h3>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_required: e.target.checked }))}
                />
                Required Item
                <small className="form-hint">Employee must upload this document</small>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.compliance_tracking_flag}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, compliance_tracking_flag: e.target.checked }))
                  }
                />
                Compliance Tracking
                <small className="form-hint">Track expiry dates and send reminders</small>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.enable_ai_parsing}
                  onChange={(e) => setFormData((prev) => ({ ...prev, enable_ai_parsing: e.target.checked }))}
                />
                Enable AI Parsing
                <small className="form-hint">Automatically extract dates and metadata from uploaded documents</small>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.visible_to_employee_flag}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, visible_to_employee_flag: e.target.checked }))
                  }
                />
                Visible to Employee
                <small className="form-hint">Employee can see this item in their document checklist</small>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {item ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
