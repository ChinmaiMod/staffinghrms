import { useState, useEffect } from 'react'
import { validateTextField } from '../../../../utils/validators'
import './ChecklistGroupForm.css'

export default function ChecklistGroupForm({ group, onClose, onSave }) {
  const [formData, setFormData] = useState({
    group_name: '',
    group_description: '',
    display_order: 0,
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (group) {
      setFormData({
        group_name: group.group_name || '',
        group_description: group.group_description || '',
        display_order: group.display_order || 0,
      })
    }
  }, [group])

  const handleSubmit = (e) => {
    e.preventDefault()

    const nameValidation = validateTextField(formData.group_name, 'Group Name', {
      required: true,
      minLength: 2,
      maxLength: 255,
    })

    if (!nameValidation.valid) {
      setErrors({ group_name: nameValidation.error })
      return
    }

    onSave(formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content checklist-group-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{group ? 'Edit Group' : 'Add Group'}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Group Name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.group_name}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, group_name: e.target.value }))
                if (errors.group_name) {
                  setErrors((prev) => ({ ...prev, group_name: '' }))
                }
              }}
              className={errors.group_name ? 'error' : ''}
              placeholder="Immigration Documents"
            />
            {errors.group_name && <span className="error-text">{errors.group_name}</span>}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.group_description}
              onChange={(e) => setFormData((prev) => ({ ...prev, group_description: e.target.value }))}
              rows={3}
              placeholder="Group description (optional)"
            />
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

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {group ? 'Update Group' : 'Add Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
