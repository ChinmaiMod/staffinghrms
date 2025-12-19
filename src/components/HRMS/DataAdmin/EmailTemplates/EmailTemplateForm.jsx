import { useState, useEffect } from 'react'
import { supabase } from '../../../../api/supabaseClient'
import { validateTextField } from '../../../../utils/validators'
import './EmailTemplateForm.css'

const TEMPLATE_CATEGORIES = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'offboarding', label: 'Offboarding' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'benefits', label: 'Benefits' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'performance', label: 'Performance' },
  { value: 'timesheet', label: 'Timesheet' },
  { value: 'visa', label: 'Visa' },
  { value: 'ticket', label: 'Ticket' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'general', label: 'General' },
]

export default function EmailTemplateForm({
  template,
  onClose,
  onSave,
  tenantId,
  userId,
  availableVariables,
}) {
  const [formData, setFormData] = useState({
    template_name: '',
    template_key: '',
    template_category: 'general',
    subject: '',
    body_html: '',
    body_text: '',
    available_variables: [],
    is_active: true,
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVariables, setShowVariables] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    if (template) {
      setFormData({
        template_name: template.template_name || '',
        template_key: template.template_key || '',
        template_category: template.template_category || 'general',
        subject: template.subject || '',
        body_html: template.body_html || '',
        body_text: template.body_text || '',
        available_variables: template.available_variables || [],
        is_active: template.is_active ?? true,
      })
    }
  }, [template])

  const validateForm = () => {
    const newErrors = {}

    // Validate template_name
    const nameValidation = validateTextField(formData.template_name, 'Template Name', {
      required: true,
      minLength: 2,
      maxLength: 255,
    })
    if (!nameValidation.valid) {
      newErrors.template_name = nameValidation.error
    }

    // Validate template_key
    const keyValidation = validateTextField(formData.template_key, 'Template Key', {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-z0-9_]+$/,
      patternMessage: 'Template key must contain only lowercase letters, numbers, and underscores',
    })
    if (!keyValidation.valid) {
      newErrors.template_key = keyValidation.error
    }

    // Validate subject
    const subjectValidation = validateTextField(formData.subject, 'Subject', {
      required: true,
      minLength: 1,
      maxLength: 500,
    })
    if (!subjectValidation.valid) {
      newErrors.subject = subjectValidation.error
    }

    // Validate body_html
    if (!formData.body_html || formData.body_html.trim().length === 0) {
      newErrors.body_html = 'Email body is required'
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

      if (template) {
        // Update existing
        const { error: updateError } = await supabase
          .from('hrms_email_templates')
          .update(payload)
          .eq('template_id', template.template_id)
          .eq('tenant_id', tenantId)

        if (updateError) throw updateError
      } else {
        // Create new
        payload.created_by = userId
        const { error: insertError } = await supabase
          .from('hrms_email_templates')
          .insert(payload)

        if (insertError) throw insertError
      }

      onSave()
    } catch (err) {
      console.error('Error saving email template:', err)
      const errorMessage =
        err.message || err.error?.message || 'Failed to save email template. Please check your input and try again.'
      
      // Show user-friendly error
      setErrors({ submit: errorMessage })
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Log to error tracking service if available
      if (window.Sentry) {
        window.Sentry.captureException(err)
      }
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

  const insertVariable = (variable) => {
    const textarea = document.getElementById('body_html')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = formData.body_html
      const newText = text.substring(0, start) + variable + text.substring(end)
      handleChange('body_html', newText)
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length, start + variable.length)
      }, 0)
    }
  }

  const generatePreview = () => {
    // Simple variable replacement for preview
    let preview = formData.body_html
    preview = preview.replace(/{{employee_name}}/g, 'John Smith')
    preview = preview.replace(/{{employee_code}}/g, 'IES00012')
    preview = preview.replace(/{{employee_email}}/g, 'john.smith@company.com')
    preview = preview.replace(/{{document_name}}/g, 'H1B Visa Copy')
    preview = preview.replace(/{{expiry_date}}/g, 'January 15, 2026')
    preview = preview.replace(/{{days_remaining}}/g, '28 days')
    preview = preview.replace(/{{company_name}}/g, 'Intuites LLC')
    return preview
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content email-template-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{template ? 'Edit Email Template' : 'Create Email Template'}</h2>
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
                  onChange={(e) => handleChange('template_name', e.target.value)}
                  className={errors.template_name ? 'error' : ''}
                  placeholder="Document Expiry Reminder"
                />
                {errors.template_name && (
                  <span className="error-text">{errors.template_name}</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  Template Key <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.template_key}
                  onChange={(e) =>
                    handleChange('template_key', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  className={errors.template_key ? 'error' : ''}
                  placeholder="document_expiry_reminder"
                  disabled={template?.is_system_template}
                />
                {errors.template_key && (
                  <span className="error-text">{errors.template_key}</span>
                )}
                <small className="form-hint">Used in code to reference this template</small>
              </div>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.template_category}
                onChange={(e) => handleChange('template_category', e.target.value)}
              >
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
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

          <div className="form-section">
            <div className="section-header">
              <h3>Email Content</h3>
              <div className="section-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowVariables(!showVariables)}
                >
                  {showVariables ? 'Hide' : 'Show'} Variables
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
              </div>
            </div>

            {showVariables && (
              <div className="variables-panel">
                <h4>Available Variables</h4>
                <p className="variables-hint">Click a variable to insert it at cursor position</p>
                {Object.entries(availableVariables).map(([category, vars]) => (
                  <div key={category} className="variable-category">
                    <h5>{category.charAt(0).toUpperCase() + category.slice(1)} Variables</h5>
                    <div className="variable-list">
                      {vars.map((v) => (
                        <button
                          key={v.key}
                          type="button"
                          className="variable-button"
                          onClick={() => insertVariable(v.key)}
                        >
                          {v.key}
                          <span className="variable-label">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label>
                Email Subject <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                className={errors.subject ? 'error' : ''}
                placeholder="⚠️ Document Expiring: {{document_name}} - Action Required"
              />
              {errors.subject && <span className="error-text">{errors.subject}</span>}
            </div>

            <div className="form-group">
              <label>
                Email Body (HTML) <span className="required">*</span>
              </label>
              {previewMode ? (
                <div
                  className="email-preview"
                  dangerouslySetInnerHTML={{ __html: generatePreview() }}
                />
              ) : (
                <textarea
                  id="body_html"
                  value={formData.body_html}
                  onChange={(e) => handleChange('body_html', e.target.value)}
                  className={errors.body_html ? 'error' : ''}
                  rows={15}
                  placeholder="Dear {{employee_name}},&#10;&#10;This is a reminder that your document is expiring soon..."
                />
              )}
              {errors.body_html && <span className="error-text">{errors.body_html}</span>}
            </div>

            <div className="form-group">
              <label>Email Body (Plain Text)</label>
              <textarea
                value={formData.body_text}
                onChange={(e) => handleChange('body_text', e.target.value)}
                rows={10}
                placeholder="Plain text version of the email (optional)"
              />
              <small className="form-hint">
                Optional: Plain text version for email clients that don't support HTML
              </small>
            </div>
          </div>

          {errors.submit && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              {errors.submit}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : template ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
