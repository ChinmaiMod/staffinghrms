import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useAuth } from '../../../contexts/AuthProvider'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './VisaStatusForm.css'

/**
 * VisaStatusForm - Modal form for adding/editing visa status
 * Based on UI_DESIGN_DOCS/10_VISA_IMMIGRATION.md section 3.1
 */
function VisaStatusForm({ employeeId, visaStatusId = null, onClose, onSave }) {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(!!visaStatusId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [visaTypes, setVisaTypes] = useState([])

  const [formData, setFormData] = useState({
    visa_type_id: '',
    visa_type_name: '',
    visa_status: 'active',
    receipt_number: '',
    petition_number: '',
    case_number: '',
    start_date: '',
    end_date: '',
    is_current: true,
  })

  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    fetchVisaTypes()
    if (visaStatusId) {
      fetchVisaStatus()
    }
  }, [visaStatusId])

  const fetchVisaTypes = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('visa_status')
        .select('id, visa_status')
        .order('visa_status')

      if (fetchError) throw fetchError
      setVisaTypes(data || [])
    } catch (err) {
      console.error('Error fetching visa types:', err)
    }
  }

  const fetchVisaStatus = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('hrms_visa_statuses')
        .select('*')
        .eq('visa_status_id', visaStatusId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        setFormData({
          visa_type_id: data.visa_type_id || '',
          visa_type_name: data.visa_type_name || '',
          visa_status: data.visa_status || 'active',
          receipt_number: data.receipt_number || '',
          petition_number: data.petition_number || '',
          case_number: data.case_number || '',
          start_date: data.start_date || '',
          end_date: data.end_date || '',
          is_current: data.is_current || false,
        })
      }
    } catch (err) {
      console.error('Error fetching visa status:', err)
      setError(err.message || 'Failed to load visa status')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.visa_type_name && !formData.visa_type_id) {
      errors.visa_type_name = 'Visa type is required'
    }

    if (!formData.start_date) {
      errors.start_date = 'Start date is required'
    }

    if (!formData.end_date) {
      errors.end_date = 'End date is required'
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      if (end <= start) {
        errors.end_date = 'End date must be after start date'
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

      const visaData = {
        tenant_id: tenant.tenant_id,
        employee_id: employeeId,
        visa_type_id: formData.visa_type_id || null,
        visa_type_name: formData.visa_type_name,
        visa_status: formData.visa_status,
        receipt_number: formData.receipt_number || null,
        petition_number: formData.petition_number || null,
        case_number: formData.case_number || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        is_current: formData.is_current,
        updated_by: user.id,
      }

      // If setting as current, unset other current visas
      if (formData.is_current) {
        await supabase
          .from('hrms_visa_statuses')
          .update({ is_current: false })
          .eq('tenant_id', tenant.tenant_id)
          .eq('employee_id', employeeId)
          .eq('is_current', true)
      }

      if (visaStatusId) {
        // Update existing
        const { error: updateError } = await supabase
          .from('hrms_visa_statuses')
          .update(visaData)
          .eq('visa_status_id', visaStatusId)
          .eq('tenant_id', tenant.tenant_id)

        if (updateError) throw updateError
      } else {
        // Insert new
        visaData.created_by = user.id
        const { data, error: insertError } = await supabase
          .from('hrms_visa_statuses')
          .insert(visaData)
          .select()
          .single()

        if (insertError) throw insertError
      }

      onSave?.()
      onClose()
    } catch (err) {
      console.error('Error saving visa status:', err)
      setError(err.message || 'Failed to save visa status')
    } finally {
      setSaving(false)
    }
  }

  const handleVisaTypeChange = (e) => {
    const selectedId = e.target.value
    const selectedType = visaTypes.find((vt) => vt.id.toString() === selectedId)
    setFormData({
      ...formData,
      visa_type_id: selectedId,
      visa_type_name: selectedType?.visa_status || '',
    })
  }

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <LoadingSpinner message="Loading visa status..." />
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content visa-status-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{visaStatusId ? 'Edit Visa Status' : 'Add Visa Status'}</h2>
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
            <h3>Visa Information</h3>

            <div className="form-group">
              <label htmlFor="visa_type_name">
                Visa Type <span className="required">*</span>
              </label>
              <select
                id="visa_type_name"
                value={formData.visa_type_id}
                onChange={handleVisaTypeChange}
                className={validationErrors.visa_type_name ? 'error' : ''}
              >
                <option value="">Select visa type</option>
                {visaTypes.map((vt) => (
                  <option key={vt.id} value={vt.id}>
                    {vt.visa_status}
                  </option>
                ))}
              </select>
              {validationErrors.visa_type_name && (
                <span className="field-error">{validationErrors.visa_type_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="visa_status">
                Visa Status <span className="required">*</span>
              </label>
              <select
                id="visa_status"
                value={formData.visa_status}
                onChange={(e) => setFormData({ ...formData, visa_status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Identification Numbers</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="receipt_number">Receipt Number</label>
                <input
                  id="receipt_number"
                  type="text"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  placeholder="WAC-24-123-45678"
                />
              </div>

              <div className="form-group">
                <label htmlFor="petition_number">Petition Number</label>
                <input
                  id="petition_number"
                  type="text"
                  value={formData.petition_number}
                  onChange={(e) => setFormData({ ...formData, petition_number: e.target.value })}
                  placeholder="PET-2024-00123"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="case_number">Case Number</label>
                <input
                  id="case_number"
                  type="text"
                  value={formData.case_number}
                  onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                  placeholder="I-129-2024-00456"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Validity Period</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">
                  Start Date <span className="required">*</span>
                </label>
                <input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className={validationErrors.start_date ? 'error' : ''}
                />
                {validationErrors.start_date && (
                  <span className="field-error">{validationErrors.start_date}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="end_date">
                  End Date <span className="required">*</span>
                </label>
                <input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className={validationErrors.end_date ? 'error' : ''}
                />
                {validationErrors.end_date && (
                  <span className="field-error">{validationErrors.end_date}</span>
                )}
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_current}
                  onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                />
                <span>Set as current visa status</span>
              </label>
              <p className="form-hint">
                This will mark any existing current visa as historical
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Visa Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VisaStatusForm
