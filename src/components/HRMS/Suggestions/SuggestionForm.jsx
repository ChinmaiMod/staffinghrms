import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import { validateTextField, validateSelect, handleSupabaseError, handleError } from '../../../utils/validators'
import './SuggestionForm.css'

/**
 * SuggestionForm - Create/Edit suggestion form
 * URL: /hrms/suggestions/new or /hrms/suggestions/:suggestionId/edit
 * Based on UI_DESIGN_DOCS/15_SUGGESTIONS_IDEAS.md
 */
function SuggestionForm({ testMode = false }) {
  const { suggestionId } = useParams()
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const { user } = useAuth()
  const isEditMode = !!suggestionId

  const [loading, setLoading] = useState(!testMode && isEditMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const [formData, setFormData] = useState({
    suggestion_type: '',
    title: '',
    description: '',
    priority: 'medium',
  })

  useEffect(() => {
    if (isEditMode && !testMode && tenant?.tenant_id) {
      fetchSuggestion()
    }
  }, [suggestionId, tenant?.tenant_id, isEditMode, testMode])

  const fetchSuggestion = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('hrms_suggestions')
        .select('*')
        .eq('suggestion_id', suggestionId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        setFormData({
          suggestion_type: data.suggestion_type || '',
          title: data.title || '',
          description: data.description || '',
          priority: data.priority || 'medium',
        })
      }
    } catch (err) {
      console.error('Error fetching suggestion:', err)
      setError(handleError(err, 'fetching suggestion'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const errors = {}

    // Validate suggestion_type
    const typeValidation = validateSelect(formData.suggestion_type, { required: true })
    if (!typeValidation.valid) {
      errors.suggestion_type = typeValidation.error || 'Please select a suggestion type'
    }

    // Validate title (5-100 characters)
    const titleValidation = validateTextField(formData.title, {
      required: true,
      minLength: 5,
      maxLength: 100,
      fieldName: 'Title'
    })
    if (!titleValidation.valid) {
      errors.title = titleValidation.error
    }

    // Validate description (50-2000 characters)
    const descriptionValidation = validateTextField(formData.description, {
      required: true,
      minLength: 50,
      maxLength: 2000,
      fieldName: 'Description'
    })
    if (!descriptionValidation.valid) {
      errors.description = descriptionValidation.error
    }

    // Validate priority
    const priorityValidation = validateSelect(formData.priority, { required: true })
    if (!priorityValidation.valid) {
      errors.priority = priorityValidation.error || 'Please select a priority level'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setFieldErrors({})

    if (!validateForm()) {
      setError('Please fix the errors below')
      setSaving(false)
      return
    }

    try {
      const suggestionData = {
        tenant_id: tenant.tenant_id,
        submitted_by_user_id: user.id,
        suggestion_type: formData.suggestion_type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: 'submitted',
      }

      let result
      if (isEditMode) {
        // Update existing suggestion
        const { data, error: updateError } = await supabase
          .from('hrms_suggestions')
          .update(suggestionData)
          .eq('suggestion_id', suggestionId)
          .eq('tenant_id', tenant.tenant_id)
          .select()
          .single()

        if (updateError) throw updateError
        result = data
      } else {
        // Create new suggestion
        const { data, error: insertError } = await supabase
          .from('hrms_suggestions')
          .insert([suggestionData])
          .select()
          .single()

        if (insertError) throw insertError
        result = data
      }

      // Navigate to detail page
      navigate(`/hrms/suggestions/${result.suggestion_id}`)
    } catch (err) {
      console.error('Error saving suggestion:', err)
      setError(handleSupabaseError(err) || handleError(err, 'saving suggestion'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading suggestion..." />
  }

  return (
    <div className="suggestion-form-container">
      <div className="suggestion-form-header">
        <Link to="/hrms/suggestions" className="back-link">
          <ArrowLeftIcon className="icon" />
          Back to Suggestions
        </Link>
        <h1 className="page-title">
          {isEditMode ? 'Edit Suggestion' : 'Submit a Suggestion'}
        </h1>
        <p className="page-subtitle">
          {isEditMode
            ? 'Update your suggestion details'
            : '💡 Share your ideas to help improve our workplace and systems!'}
        </p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <form className="suggestion-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="suggestion_type">
            Suggestion Type <span className="required">*</span>
          </label>
          <select
            id="suggestion_type"
            name="suggestion_type"
            value={formData.suggestion_type}
            onChange={handleChange}
            className={fieldErrors.suggestion_type ? 'error' : ''}
            required
          >
            <option value="">Select a type...</option>
            <option value="feature">Feature Request - New functionality you'd like to see</option>
            <option value="improvement">Improvement - Enhancements to existing features</option>
            <option value="bug_report">Bug Report - Issues you've encountered</option>
            <option value="feedback">Feedback - General feedback about the system</option>
            <option value="process">Process Improvement - Suggestions for workflow improvements</option>
            <option value="policy">Policy - Policy-related suggestions</option>
            <option value="other">Other - Anything else</option>
          </select>
          {fieldErrors.suggestion_type && (
            <small className="error-text">{fieldErrors.suggestion_type}</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="title">
            Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={fieldErrors.title ? 'error' : ''}
            placeholder="Brief, descriptive title (5-100 characters)"
            maxLength={100}
            required
          />
          {fieldErrors.title && (
            <small className="error-text">{fieldErrors.title}</small>
          )}
          <small className="helper-text">
            {formData.title.length} / 100 characters
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="description">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={fieldErrors.description ? 'error' : ''}
            placeholder="Please provide details about your suggestion, idea, or feedback (50-2000 characters)..."
            rows={8}
            maxLength={2000}
            required
          />
          {fieldErrors.description && (
            <small className="error-text">{fieldErrors.description}</small>
          )}
          <div className={`character-count ${formData.description.length > 1800 ? 'warning' : ''} ${formData.description.length >= 2000 ? 'error' : ''}`}>
            {formData.description.length} / 2000 characters
            {formData.description.length < 50 && (
              <span className="min-length"> (minimum 50 characters)</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>
            Priority <span className="required">*</span>
          </label>
          <div className="radio-group">
            <label className="radio-option">
              <input
                type="radio"
                name="priority"
                value="low"
                checked={formData.priority === 'low'}
                onChange={handleChange}
              />
              <span>Low - Nice to have, not urgent</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="priority"
                value="medium"
                checked={formData.priority === 'medium'}
                onChange={handleChange}
              />
              <span>Medium - Would be helpful, somewhat important</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="priority"
                value="high"
                checked={formData.priority === 'high'}
                onChange={handleChange}
              />
              <span>High - Very important, affects daily work</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="priority"
                value="critical"
                checked={formData.priority === 'critical'}
                onChange={handleChange}
              />
              <span>Critical - Blocking issue, needs immediate attention</span>
            </label>
          </div>
          {fieldErrors.priority && (
            <small className="error-text">{fieldErrors.priority}</small>
          )}
        </div>

        <div className="form-actions">
          <Link to="/hrms/suggestions" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditMode ? 'Update Suggestion' : 'Submit Suggestion'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SuggestionForm
