import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './VendorForm.css'

/**
 * VendorForm - Create/Edit vendor form
 * URL: /hrms/vendors/new or /hrms/vendors/:vendorId/edit
 * Based on UI_DESIGN_DOCS/07_VENDOR_MANAGEMENT.md
 */
function VendorForm({ testMode = false, onSave, onCancel }) {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const isEditMode = !!vendorId

  const [loading, setLoading] = useState(!testMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_code: '',
    vendor_type: 'primary',
    ein: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    primary_contact_name: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    accounts_payable_email: '',
    payment_terms_days: 30,
    receives_payment_terms_days: 45,
    invoice_frequency: 'bi_weekly',
    default_markup_percentage: null,
    default_bill_rate: null,
    default_ot_bill_rate: null,
    default_holiday_bill_rate: null,
    default_holiday_ot_bill_rate: null,
    tenure_discount_percentage: null,
    tenure_discount_threshold_months: null,
    volume_discount_percentage: null,
    volume_discount_threshold_hours: null,
    notes: '',
    is_active: true,
  })

  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (testMode) {
      setLoading(false)
      return
    }

    if (isEditMode && tenant?.tenant_id) {
      fetchVendor()
    } else {
      setLoading(false)
    }
  }, [vendorId, tenant?.tenant_id, testMode])

  const fetchVendor = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('hrms_vendors')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        setFormData({
          vendor_name: data.vendor_name || '',
          vendor_code: data.vendor_code || '',
          vendor_type: data.vendor_type || 'primary',
          ein: data.ein || '',
          address_line_1: data.address_line_1 || '',
          address_line_2: data.address_line_2 || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          country: data.country || 'USA',
          primary_contact_name: data.primary_contact_name || '',
          primary_contact_email: data.primary_contact_email || '',
          primary_contact_phone: data.primary_contact_phone || '',
          accounts_payable_email: data.accounts_payable_email || '',
          payment_terms_days: data.payment_terms_days || 30,
          receives_payment_terms_days: data.receives_payment_terms_days || 45,
          invoice_frequency: data.invoice_frequency || 'bi_weekly',
          default_markup_percentage: data.default_markup_percentage || null,
          default_bill_rate: data.default_bill_rate || null,
          default_ot_bill_rate: data.default_ot_bill_rate || null,
          default_holiday_bill_rate: data.default_holiday_bill_rate || null,
          default_holiday_ot_bill_rate: data.default_holiday_ot_bill_rate || null,
          tenure_discount_percentage: data.tenure_discount_percentage || null,
          tenure_discount_threshold_months: data.tenure_discount_threshold_months || null,
          volume_discount_percentage: data.volume_discount_percentage || null,
          volume_discount_threshold_hours: data.volume_discount_threshold_hours || null,
          notes: data.notes || '',
          is_active: data.is_active !== undefined ? data.is_active : true,
        })
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching vendor:', err)
      setError(err.message || 'Failed to load vendor')
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.vendor_name.trim()) {
      errors.vendor_name = 'Vendor name is required'
    }

    if (!formData.vendor_code.trim()) {
      errors.vendor_code = 'Vendor code is required'
    }

    if (formData.primary_contact_email && !isValidEmail(formData.primary_contact_email)) {
      errors.primary_contact_email = 'Please enter a valid email address'
    }

    if (formData.accounts_payable_email && !isValidEmail(formData.accounts_payable_email)) {
      errors.accounts_payable_email = 'Please enter a valid email address'
    }

    if (formData.ein && !isValidEIN(formData.ein)) {
      errors.ein = 'EIN must be in format XX-XXXXXXX'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isValidEIN = (ein) => {
    return /^\d{2}-\d{7}$/.test(ein)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const vendorData = {
        ...formData,
        tenant_id: tenant.tenant_id,
        business_id: selectedBusiness?.business_id || null,
        updated_by: user?.id || null,
      }

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('hrms_vendors')
          .update(vendorData)
          .eq('vendor_id', vendorId)
          .eq('tenant_id', tenant.tenant_id)

        if (updateError) throw updateError
      } else {
        vendorData.created_by = user?.id || null
        const { error: insertError } = await supabase.from('hrms_vendors').insert([vendorData])

        if (insertError) throw insertError
      }

      if (onSave) {
        onSave(vendorData)
      } else {
        navigate('/hrms/vendors')
      }
    } catch (err) {
      console.error('Error saving vendor:', err)
      setError(err.message || 'Failed to save vendor')
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading vendor..." />
  }

  return (
    <div className="vendor-form-container">
      <div className="vendor-form-header">
        <Link to="/hrms/vendors" className="back-link">
          <ArrowLeftIcon className="icon-sm" />
          Back to Vendors
        </Link>
        <h1 className="page-title">{isEditMode ? 'Edit Vendor' : 'Add New Vendor'}</h1>
        <p className="page-subtitle">
          {isEditMode ? 'Update vendor information' : 'Create a new vendor for project assignments'}
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="vendor-form">
        {/* Vendor Information Section */}
        <div className="form-section">
          <h2 className="section-title">Vendor Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="vendor_name">
                Vendor Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="vendor_name"
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleChange}
                className={validationErrors.vendor_name ? 'error' : ''}
                required
              />
              {validationErrors.vendor_name && (
                <span className="error-message">{validationErrors.vendor_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="vendor_code">
                Vendor Code <span className="required">*</span>
              </label>
              <input
                type="text"
                id="vendor_code"
                name="vendor_code"
                value={formData.vendor_code}
                onChange={handleChange}
                className={validationErrors.vendor_code ? 'error' : ''}
                required
                maxLength={50}
              />
              {validationErrors.vendor_code && (
                <span className="error-message">{validationErrors.vendor_code}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="vendor_type">
                Vendor Type <span className="required">*</span>
              </label>
              <select
                id="vendor_type"
                name="vendor_type"
                value={formData.vendor_type}
                onChange={handleChange}
                required
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="implementation_partner">Implementation Partner</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ein">EIN</label>
              <input
                type="text"
                id="ein"
                name="ein"
                value={formData.ein}
                onChange={handleChange}
                placeholder="XX-XXXXXXX"
                className={validationErrors.ein ? 'error' : ''}
              />
              {validationErrors.ein && (
                <span className="error-message">{validationErrors.ein}</span>
              )}
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="form-section">
          <h2 className="section-title">Address</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="address_line_1">Address Line 1</label>
              <input
                type="text"
                id="address_line_1"
                name="address_line_1"
                value={formData.address_line_1}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="address_line_2">Address Line 2</label>
              <input
                type="text"
                id="address_line_2"
                name="address_line_2"
                value={formData.address_line_2}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="zip_code">Zip Code</label>
              <input
                type="text"
                id="zip_code"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">Country</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              >
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Primary Contact Section */}
        <div className="form-section">
          <h2 className="section-title">Primary Contact</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="primary_contact_name">Contact Name</label>
              <input
                type="text"
                id="primary_contact_name"
                name="primary_contact_name"
                value={formData.primary_contact_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="primary_contact_email">Email</label>
              <input
                type="email"
                id="primary_contact_email"
                name="primary_contact_email"
                value={formData.primary_contact_email}
                onChange={handleChange}
                className={validationErrors.primary_contact_email ? 'error' : ''}
              />
              {validationErrors.primary_contact_email && (
                <span className="error-message">{validationErrors.primary_contact_email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="primary_contact_phone">Phone</label>
              <input
                type="tel"
                id="primary_contact_phone"
                name="primary_contact_phone"
                value={formData.primary_contact_phone}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Accounts Payable Contact */}
        <div className="form-section">
          <h2 className="section-title">Accounts Payable Contact</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="accounts_payable_email">AP Email</label>
              <input
                type="email"
                id="accounts_payable_email"
                name="accounts_payable_email"
                value={formData.accounts_payable_email}
                onChange={handleChange}
                className={validationErrors.accounts_payable_email ? 'error' : ''}
              />
              {validationErrors.accounts_payable_email && (
                <span className="error-message">{validationErrors.accounts_payable_email}</span>
              )}
            </div>
          </div>
        </div>

        {/* Payment Terms Section */}
        <div className="form-section">
          <h2 className="section-title">Payment Terms & Billing</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="payment_terms_days">Payment Terms (Days We Pay)</label>
              <input
                type="number"
                id="payment_terms_days"
                name="payment_terms_days"
                value={formData.payment_terms_days}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="receives_payment_terms_days">Receives Payment Terms (Days to Us)</label>
              <input
                type="number"
                id="receives_payment_terms_days"
                name="receives_payment_terms_days"
                value={formData.receives_payment_terms_days}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="invoice_frequency">Invoice Frequency</label>
              <select
                id="invoice_frequency"
                name="invoice_frequency"
                value={formData.invoice_frequency}
                onChange={handleChange}
              >
                <option value="weekly">Weekly</option>
                <option value="bi_weekly">Bi-Weekly</option>
                <option value="semi_monthly">Semi-Monthly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="form-section">
          <h2 className="section-title">Notes</h2>
          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Additional notes about this vendor..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel || (() => navigate('/hrms/vendors'))}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Vendor'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default VendorForm
