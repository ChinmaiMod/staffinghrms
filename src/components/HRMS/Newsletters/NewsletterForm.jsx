import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './NewsletterForm.css'

/**
 * NewsletterForm - Create/Edit Newsletter form
 * URL: /hrms/newsletters/new or /hrms/newsletters/:id/edit
 * Based on UI_DESIGN_DOCS/14_NEWSLETTER.md
 */
function NewsletterForm() {
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { newsletterId } = useParams()
  const isEditMode = !!newsletterId

  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    subject_line: '',
    content_html: '',
    content_text: '',
    newsletter_status: 'draft',
    target_employee_types: [],
    target_employees: [],
    scheduled_send_at: null,
  })

  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (isEditMode && tenant?.tenant_id && newsletterId) {
      fetchNewsletter()
    }
  }, [isEditMode, tenant?.tenant_id, newsletterId])

  const fetchNewsletter = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('hrms_newsletters')
        .select('*')
        .eq('newsletter_id', newsletterId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        setFormData({
          title: data.title || '',
          subject_line: data.subject_line || '',
          content_html: data.content_html || '',
          content_text: data.content_text || '',
          newsletter_status: data.newsletter_status || 'draft',
          target_employee_types: data.target_employee_types || [],
          target_employees: data.target_employees || [],
          scheduled_send_at: data.scheduled_send_at || null,
        })
      }
    } catch (err) {
      console.error('Error fetching newsletter:', err)
      setError(err.message || 'Failed to load newsletter')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    } else if (formData.title.length < 5) {
      errors.title = 'Title must be at least 5 characters'
    } else if (formData.title.length > 200) {
      errors.title = 'Title must be less than 200 characters'
    }

    if (!formData.subject_line.trim()) {
      errors.subject_line = 'Subject line is required'
    } else if (formData.subject_line.length < 5) {
      errors.subject_line = 'Subject line must be at least 5 characters'
    } else if (formData.subject_line.length > 150) {
      errors.subject_line = 'Subject line must be less than 150 characters'
    }

    if (!formData.content_html.trim()) {
      errors.content_html = 'Content is required'
    } else if (formData.content_html.length < 50) {
      errors.content_html = 'Content must be at least 50 characters'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async (status = 'draft') => {
    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      if (!tenant?.tenant_id || !user?.id) {
        throw new Error('Tenant or user not available')
      }

      const newsletterData = {
        tenant_id: tenant.tenant_id,
        business_id: selectedBusiness?.business_id || null,
        title: formData.title.trim(),
        subject_line: formData.subject_line.trim(),
        content_html: formData.content_html.trim(),
        content_text: formData.content_text.trim() || formData.content_html.replace(/<[^>]*>/g, '').trim(),
        newsletter_status: status,
        target_employee_types: formData.target_employee_types,
        target_employees: formData.target_employees,
        scheduled_send_at: formData.scheduled_send_at,
        updated_by: user.id,
      }

      if (isEditMode) {
        const { data, error: updateError } = await supabase
          .from('hrms_newsletters')
          .update(newsletterData)
          .eq('newsletter_id', newsletterId)
          .eq('tenant_id', tenant.tenant_id)
          .select()
          .single()

        if (updateError) throw updateError
        navigate(`/hrms/newsletters/${data.newsletter_id}`)
      } else {
        newsletterData.created_by = user.id
        const { data, error: insertError } = await supabase
          .from('hrms_newsletters')
          .insert(newsletterData)
          .select()
          .single()

        if (insertError) throw insertError
        navigate(`/hrms/newsletters/${data.newsletter_id}`)
      }
    } catch (err) {
      console.error('Error saving newsletter:', err)
      setError(err.message || 'Failed to save newsletter')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading newsletter..." />
  }

  return (
    <div className="newsletter-form" data-testid="newsletter-form">
      {/* Header */}
      <div className="newsletter-form-header">
        <Link to="/hrms/newsletters" className="back-link">
          <ArrowLeftIcon className="icon-sm" />
          Back to Newsletters
        </Link>
        <h1 className="page-title">{isEditMode ? 'Edit Newsletter' : 'Create Newsletter'}</h1>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <div className="form-container">
        <div className="form-section">
          <label htmlFor="title" className="form-label">
            Newsletter Title <span className="required">*</span>
          </label>
          <input
            id="title"
            type="text"
            className={`form-input ${validationErrors.title ? 'error' : ''}`}
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., December Company Update"
            maxLength={200}
          />
          {validationErrors.title && (
            <span className="error-message">{validationErrors.title}</span>
          )}
        </div>

        <div className="form-section">
          <label htmlFor="subject_line" className="form-label">
            Subject Line <span className="required">*</span>
          </label>
          <input
            id="subject_line"
            type="text"
            className={`form-input ${validationErrors.subject_line ? 'error' : ''}`}
            value={formData.subject_line}
            onChange={(e) => handleChange('subject_line', e.target.value)}
            placeholder="e.g., 📰 December Update: Q4 Highlights"
            maxLength={150}
          />
          {validationErrors.subject_line && (
            <span className="error-message">{validationErrors.subject_line}</span>
          )}
        </div>

        <div className="form-section">
          <label htmlFor="content_html" className="form-label">
            Content <span className="required">*</span>
          </label>
          <textarea
            id="content_html"
            className={`form-textarea ${validationErrors.content_html ? 'error' : ''}`}
            value={formData.content_html}
            onChange={(e) => handleChange('content_html', e.target.value)}
            placeholder="Enter newsletter content. You can use HTML formatting."
            rows={15}
          />
          {validationErrors.content_html && (
            <span className="error-message">{validationErrors.content_html}</span>
          )}
          <div className="form-hint">
            Character count: {formData.content_html.length}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/hrms/newsletters/${newsletterId || 'new'}/preview`)}
            disabled={saving || !formData.title || !formData.content_html}
          >
            Preview
          </button>
          {!isEditMode && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSave('draft')}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Create Newsletter'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewsletterForm
