import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import './ClientContactModal.css'

/**
 * ClientContactModal - Add/Edit client contact modal
 * Based on UI_DESIGN_DOCS/06_CLIENT_MANAGEMENT.md
 */
function ClientContactModal({ isOpen, onClose, onSuccess, clientId, contactId = null }) {
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const isEditMode = !!contactId

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    remarks: '',
  })

  const [validationErrors, setValidationErrors] = useState({})

  const validateForm = () => {
    const errors = {}

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const contactData = {
        ...formData,
        tenant_id: tenant.tenant_id,
        business_id: selectedBusiness?.business_id || null,
        client_id: clientId,
        contact_type: 'Client Empanelment',
        updated_by: user?.id || null,
      }

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', contactId)
          .eq('tenant_id', tenant.tenant_id)

        if (updateError) throw updateError
      } else {
        contactData.created_by = user?.id || null
        const { error: insertError } = await supabase.from('contacts').insert([contactData])

        if (insertError) throw insertError
      }

      onSuccess()
    } catch (err) {
      console.error('Error saving contact:', err)
      setError(err.message || 'Failed to save contact')
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEditMode ? 'Edit Contact' : 'Add Client Contact'}</h2>
          <button className="modal-close" onClick={onClose}>
            <XMarkIcon className="icon-md" />
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-info">
            <p className="info-text">
              Contact will be added to CRM with type "Client Empanelment"
            </p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="first_name">
                First Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={validationErrors.first_name ? 'error' : ''}
              />
              {validationErrors.first_name && (
                <span className="error-message">{validationErrors.first_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">
                Last Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={validationErrors.last_name ? 'error' : ''}
              />
              {validationErrors.last_name && (
                <span className="error-message">{validationErrors.last_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={validationErrors.email ? 'error' : ''}
              />
              {validationErrors.email && (
                <span className="error-message">{validationErrors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="remarks">Notes</label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientContactModal
