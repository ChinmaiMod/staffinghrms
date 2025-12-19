import { useState, useEffect } from 'react'
import { supabase } from '../../../../api/supabaseClient'
import { validateTextField } from '../../../../utils/validators'
import './LCAJobTitleForm.css'

const WAGE_LEVELS = [
  { value: 1, label: 'Level 1 (Entry)', description: 'Entry level, minimal experience required' },
  { value: 2, label: 'Level 2 (Qualified)', description: 'Qualified, some experience required' },
  { value: 3, label: 'Level 3 (Experienced)', description: 'Experienced, substantial experience required' },
  { value: 4, label: 'Level 4 (Fully Competent)', description: 'Fully competent, expert level' },
]

export default function LCAJobTitleForm({ title, onClose, onSave, tenantId, userId }) {
  const [formData, setFormData] = useState({
    lca_job_title: '',
    soc_code: '',
    soc_title: '',
    wage_level: 2,
    wage_level_description: '',
    oes_wage_source_url: '',
    description: '',
    notes: '',
    is_active: true,
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (title) {
      setFormData({
        lca_job_title: title.lca_job_title || '',
        soc_code: title.soc_code || '',
        soc_title: title.soc_title || '',
        wage_level: title.wage_level || 2,
        wage_level_description: title.wage_level_description || '',
        oes_wage_source_url: title.oes_wage_source_url || '',
        description: title.description || '',
        notes: title.notes || '',
        is_active: title.is_active ?? true,
      })
    }
  }, [title])

  const validateForm = () => {
    const newErrors = {}

    // Validate lca_job_title
    const titleValidation = validateTextField(formData.lca_job_title, 'LCA Job Title', {
      required: true,
      minLength: 2,
      maxLength: 255,
    })
    if (!titleValidation.valid) {
      newErrors.lca_job_title = titleValidation.error
    }

    // Validate soc_code format (XX-XXXX)
    const socCodeValidation = validateTextField(formData.soc_code, 'SOC Code', {
      required: true,
      pattern: /^[0-9]{2}-[0-9]{4}$/,
      patternMessage: 'SOC code must be in format XX-XXXX (e.g., 15-1252)',
    })
    if (!socCodeValidation.valid) {
      newErrors.soc_code = socCodeValidation.error
    }

    // Validate wage_level
    if (!formData.wage_level || formData.wage_level < 1 || formData.wage_level > 4) {
      newErrors.wage_level = 'Wage level must be between 1 and 4'
    }

    // Validate URL format if provided
    if (formData.oes_wage_source_url && formData.oes_wage_source_url.trim()) {
      try {
        new URL(formData.oes_wage_source_url)
      } catch {
        newErrors.oes_wage_source_url = 'Please enter a valid URL'
      }
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

      if (title) {
        // Update existing
        const { error: updateError } = await supabase
          .from('hrms_lca_job_titles')
          .update(payload)
          .eq('lca_job_title_id', title.lca_job_title_id)
          .eq('tenant_id', tenantId)

        if (updateError) throw updateError
      } else {
        // Create new
        payload.created_by = userId
        const { error: insertError } = await supabase.from('hrms_lca_job_titles').insert(payload)

        if (insertError) throw insertError
      }

      onSave()
    } catch (err) {
      console.error('Error saving LCA job title:', err)
      const errorMessage =
        err.message || err.error?.message || 'Failed to save LCA job title. Please check your input and try again.'

      setErrors({ submit: errorMessage })
      window.scrollTo({ top: 0, behavior: 'smooth' })

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

  const formatSocCode = (value) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '')
    // Format as XX-XXXX
    if (digits.length <= 2) {
      return digits
    }
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}`
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content lca-job-title-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <h2>{title ? 'Edit LCA Job Title' : 'Add LCA Job Title'}</h2>
            <span className="hrms-only-badge">📋 HRMS Only</span>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>LCA Job Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label>
                  LCA Job Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lca_job_title}
                  onChange={(e) => handleChange('lca_job_title', e.target.value)}
                  className={errors.lca_job_title ? 'error' : ''}
                  placeholder="Software Developer"
                />
                {errors.lca_job_title && <span className="error-text">{errors.lca_job_title}</span>}
              </div>

              <div className="form-group">
                <label>
                  SOC Code <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.soc_code}
                  onChange={(e) => handleChange('soc_code', formatSocCode(e.target.value))}
                  className={errors.soc_code ? 'error' : ''}
                  placeholder="15-1252"
                  maxLength={7}
                />
                {errors.soc_code && <span className="error-text">{errors.soc_code}</span>}
                <small className="form-hint">Standard Occupational Classification code (format: XX-XXXX)</small>
              </div>
            </div>

            <div className="form-group">
              <label>SOC Title (Official)</label>
              <input
                type="text"
                value={formData.soc_title}
                onChange={(e) => handleChange('soc_title', e.target.value)}
                placeholder="Software Developers"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Wage Information</h3>

            <div className="form-group">
              <label>
                Default Wage Level <span className="required">*</span>
              </label>
              <div className="wage-level-options">
                {WAGE_LEVELS.map((level) => (
                  <label key={level.value} className="radio-option">
                    <input
                      type="radio"
                      name="wage_level"
                      value={level.value}
                      checked={formData.wage_level === level.value}
                      onChange={(e) => handleChange('wage_level', parseInt(e.target.value))}
                    />
                    <div>
                      <strong>{level.label}</strong>
                      <small>{level.description}</small>
                    </div>
                  </label>
                ))}
              </div>
              {errors.wage_level && <span className="error-text">{errors.wage_level}</span>}
            </div>

            <div className="form-group">
              <label>Wage Level Description</label>
              <input
                type="text"
                value={formData.wage_level_description}
                onChange={(e) => handleChange('wage_level_description', e.target.value)}
                placeholder="Qualified"
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label>OES Wage Source URL</label>
              <input
                type="url"
                value={formData.oes_wage_source_url}
                onChange={(e) => handleChange('oes_wage_source_url', e.target.value)}
                className={errors.oes_wage_source_url ? 'error' : ''}
                placeholder="https://www.bls.gov/oes/current/oes151252.htm"
              />
              {errors.oes_wage_source_url && (
                <span className="error-text">{errors.oes_wage_source_url}</span>
              )}
              <small className="form-hint">Bureau of Labor Statistics OES wage data URL</small>
            </div>
          </div>

          <div className="form-section">
            <h3>Description</h3>

            <div className="form-group">
              <label>Job Duties Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={5}
                placeholder="Research, design, and develop computer and network software or specialized utility programs..."
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                placeholder="Internal notes about this LCA job title..."
              />
            </div>
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

          {errors.submit && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              {errors.submit}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : title ? 'Update LCA Job Title' : 'Save LCA Job Title'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
