import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './ClientForm.css'

/**
 * ClientForm - Create/Edit client form
 * URL: /hrms/clients/new or /hrms/clients/:clientId/edit
 * Based on UI_DESIGN_DOCS/06_CLIENT_MANAGEMENT.md
 */
function ClientForm() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const isEditMode = !!clientId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    client_name: '',
    website: '',
    industry: '',
    status: 'ACTIVE',
    primary_contact_email: '',
    primary_contact_phone: '',
    address: '',
    city: '',
    state: '',
    country: 'USA',
    postal_code: '',
    notes: '',
  })

  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (isEditMode && tenant?.tenant_id) {
      fetchClient()
    } else {
      setLoading(false)
    }
  }, [clientId, tenant?.tenant_id])

  const fetchClient = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('client_id', clientId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        setFormData({
          client_name: data.client_name || '',
          website: data.website || '',
          industry: data.industry || '',
          status: data.status || 'ACTIVE',
          primary_contact_email: data.primary_contact_email || '',
          primary_contact_phone: data.primary_contact_phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || 'USA',
          postal_code: data.postal_code || '',
          notes: data.notes || '',
        })
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching client:', err)
      setError(err.message || 'Failed to load client')
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.client_name.trim()) {
      errors.client_name = 'Client name is required'
    }

    if (formData.website && !isValidUrl(formData.website)) {
      errors.website = 'Please enter a valid URL'
    }

    if (formData.primary_contact_email && !isValidEmail(formData.primary_contact_email)) {
      errors.primary_contact_email = 'Please enter a valid email address'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const isValidUrl = (url) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
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

      const clientData = {
        ...formData,
        tenant_id: tenant.tenant_id,
        business_id: selectedBusiness?.business_id || null,
        updated_by: user?.id || null,
      }

      if (isEditMode) {
        const { error: updateError } = await supabase
          .from('clients')
          .update(clientData)
          .eq('client_id', clientId)
          .eq('tenant_id', tenant.tenant_id)

        if (updateError) throw updateError
      } else {
        clientData.created_by = user?.id || null
        const { error: insertError } = await supabase.from('clients').insert([clientData])

        if (insertError) throw insertError
      }

      navigate('/hrms/clients')
    } catch (err) {
      console.error('Error saving client:', err)
      setError(err.message || 'Failed to save client')
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

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading client..." />
  }

  const industries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Other']

  return (
    <div className="client-form-container">
      <div className="form-header">
        <Link to="/hrms/clients" className="back-link">
          <ArrowLeftIcon className="icon-sm" />
          Back to Clients
        </Link>
        <h1 className="form-title">{isEditMode ? 'Edit Client' : 'Add New Client'}</h1>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="client-form">
        {/* Basic Information */}
        <div className="form-section">
          <h2 className="section-title">Basic Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="client_name">
                Client Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                className={validationErrors.client_name ? 'error' : ''}
              />
              {validationErrors.client_name && (
                <span className="error-message">{validationErrors.client_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.example.com"
                className={validationErrors.website ? 'error' : ''}
              />
              {validationErrors.website && (
                <span className="error-message">{validationErrors.website}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="industry">Industry</label>
              <select id="industry" name="industry" value={formData.industry} onChange={handleChange}>
                <option value="">Select Industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="form-section">
          <h2 className="section-title">Address</h2>
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
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
              <label htmlFor="postal_code">ZIP Code</label>
              <input
                type="text"
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Primary Contact */}
        <div className="form-section">
          <h2 className="section-title">Primary Contact (Optional)</h2>
          <div className="form-grid">
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

        {/* Notes */}
        <div className="form-section">
          <h2 className="section-title">Notes</h2>
          <div className="form-group full-width">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Enter any additional notes about this client..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <Link to="/hrms/clients" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update Client' : 'Save Client'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ClientForm
