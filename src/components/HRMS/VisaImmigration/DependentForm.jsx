import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useAuth } from '../../../contexts/AuthProvider'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './DependentForm.css'

/**
 * DependentForm - Modal form for adding/editing dependents
 * Based on UI_DESIGN_DOCS/10_VISA_IMMIGRATION.md section 4.2
 */
function DependentForm({ employeeId, dependentId = null, dependent = null, onClose, onSave }) {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(!!dependentId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [primaryVisaExpiry, setPrimaryVisaExpiry] = useState(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    relationship: '',
    date_of_birth: '',
    email: '',
    phone: '',
    visa_type: '',
    visa_status: 'active',
    visa_expiry_date: '',
    sync_with_primary: false,
  })

  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    fetchPrimaryVisaExpiry()
    if (dependentId || dependent) {
      if (dependent) {
        setFormData({
          first_name: dependent.first_name || '',
          last_name: dependent.last_name || '',
          relationship: dependent.relationship || '',
          date_of_birth: dependent.date_of_birth || '',
          email: dependent.email || '',
          phone: dependent.phone || '',
          visa_type: dependent.visa_type || '',
          visa_status: dependent.visa_status || 'active',
          visa_expiry_date: dependent.visa_expiry_date || '',
          sync_with_primary: false,
        })
        setLoading(false)
      } else {
        fetchDependent()
      }
    }
  }, [dependentId, dependent])

  const fetchPrimaryVisaExpiry = async () => {
    try {
      const { data } = await supabase
        .from('hrms_visa_statuses')
        .select('end_date')
        .eq('tenant_id', tenant.tenant_id)
        .eq('employee_id', employeeId)
        .eq('is_current', true)
        .single()

      if (data?.end_date) {
        setPrimaryVisaExpiry(data.end_date)
        if (formData.sync_with_primary) {
          setFormData({ ...formData, visa_expiry_date: data.end_date })
        }
      }
    } catch (err) {
      console.error('Error fetching primary visa expiry:', err)
    }
  }

  const fetchDependent = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('hrms_dependents')
        .select('*')
        .eq('dependent_id', dependentId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          relationship: data.relationship || '',
          date_of_birth: data.date_of_birth || '',
          email: data.email || '',
          phone: data.phone || '',
          visa_type: data.visa_type || '',
          visa_status: data.visa_status || 'active',
          visa_expiry_date: data.visa_expiry_date || '',
          sync_with_primary: false,
        })
      }
    } catch (err) {
      console.error('Error fetching dependent:', err)
      setError(err.message || 'Failed to load dependent')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required'
    } else if (formData.first_name.trim().length < 2) {
      errors.first_name = 'First name must be at least 2 characters'
    }

    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required'
    } else if (formData.last_name.trim().length < 2) {
      errors.last_name = 'Last name must be at least 2 characters'
    }

    if (!formData.relationship) {
      errors.relationship = 'Relationship is required'
    }

    if (!formData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required'
    } else {
      const dob = new Date(formData.date_of_birth)
      const today = new Date()
      if (dob > today) {
        errors.date_of_birth = 'Date of birth cannot be in the future'
      }
    }

    if (formData.visa_expiry_date && primaryVisaExpiry) {
      const dependentExpiry = new Date(formData.visa_expiry_date)
      const primaryExpiry = new Date(primaryVisaExpiry)
      if (dependentExpiry > primaryExpiry) {
        errors.visa_expiry_date = 'Dependent visa cannot expire after primary visa'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      if (!tenant?.tenant_id || !employeeId || !user?.id) {
        throw new Error('Missing required data')
      }

      const dependentData = {
        tenant_id: tenant.tenant_id,
        employee_id: employeeId,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        relationship: formData.relationship,
        date_of_birth: formData.date_of_birth || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        visa_type: formData.visa_type || null,
        visa_status: formData.visa_status || null,
        visa_expiry_date: formData.sync_with_primary && primaryVisaExpiry
          ? primaryVisaExpiry
          : formData.visa_expiry_date || null,
        updated_by: user.id,
      }

      if (dependentId) {
        // Update existing
        const { error: updateError } = await supabase
          .from('hrms_dependents')
          .update(dependentData)
          .eq('dependent_id', dependentId)
          .eq('tenant_id', tenant.tenant_id)

        if (updateError) throw updateError
      } else {
        // Insert new
        dependentData.created_by = user.id
        const { data, error: insertError } = await supabase
          .from('hrms_dependents')
          .insert(dependentData)
          .select()
          .single()

        if (insertError) throw insertError
      }

      onSave?.()
      onClose()
    } catch (err) {
      console.error('Error saving dependent:', err)
      setError(err.message || 'Failed to save dependent')
    } finally {
      setSaving(false)
    }
  }

  const handleSyncToggle = (checked) => {
    setFormData({
      ...formData,
      sync_with_primary: checked,
      visa_expiry_date: checked && primaryVisaExpiry ? primaryVisaExpiry : formData.visa_expiry_date,
    })
  }

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <LoadingSpinner message="Loading dependent..." />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dependent-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{dependentId ? 'Edit Dependent' : 'Add Dependent'}</h2>
          <button className="modal-close" onClick={onClose}>
            <XMarkIcon className="icon-md" />
          </button>
        </div>

        {error && (
          <div className="form-error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Personal Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">
                  First Name <span className="required">*</span>
                </label>
                <input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className={validationErrors.first_name ? 'error' : ''}
                />
                {validationErrors.first_name && (
                  <span className="field-error">{validationErrors.first_name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="last_name">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className={validationErrors.last_name ? 'error' : ''}
                />
                {validationErrors.last_name && (
                  <span className="field-error">{validationErrors.last_name}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="relationship">
                  Relationship <span className="required">*</span>
                </label>
                <select
                  id="relationship"
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  className={validationErrors.relationship ? 'error' : ''}
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
                {validationErrors.relationship && (
                  <span className="field-error">{validationErrors.relationship}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="date_of_birth">
                  Date of Birth <span className="required">*</span>
                </label>
                <input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className={validationErrors.date_of_birth ? 'error' : ''}
                />
                {validationErrors.date_of_birth && (
                  <span className="field-error">{validationErrors.date_of_birth}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Contact Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Visa Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="visa_type">Visa Type</label>
                <input
                  id="visa_type"
                  type="text"
                  value={formData.visa_type}
                  onChange={(e) => setFormData({ ...formData, visa_type: e.target.value })}
                  placeholder="H4"
                />
              </div>

              <div className="form-group">
                <label htmlFor="visa_status">Visa Status</label>
                <select
                  id="visa_status"
                  value={formData.visa_status}
                  onChange={(e) => setFormData({ ...formData, visa_status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="visa_expiry_date">Visa Expiry Date</label>
                <input
                  id="visa_expiry_date"
                  type="date"
                  value={formData.visa_expiry_date}
                  onChange={(e) => setFormData({ ...formData, visa_expiry_date: e.target.value })}
                  disabled={formData.sync_with_primary}
                  className={validationErrors.visa_expiry_date ? 'error' : ''}
                />
                {validationErrors.visa_expiry_date && (
                  <span className="field-error">{validationErrors.visa_expiry_date}</span>
                )}
              </div>
            </div>

            {primaryVisaExpiry && (
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.sync_with_primary}
                    onChange={(e) => handleSyncToggle(e.target.checked)}
                  />
                  <span>Sync expiry with primary visa holder</span>
                </label>
                <p className="form-hint">
                  Dependent visa will automatically update when primary visa changes
                </p>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Dependent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DependentForm
