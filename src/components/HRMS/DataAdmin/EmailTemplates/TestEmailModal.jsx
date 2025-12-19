import { useState, useEffect } from 'react'
import { validateTextField } from '../../../../utils/validators'
import './TestEmailModal.css'

export default function TestEmailModal({ template, onClose, onSend, availableVariables }) {
  const [recipientEmail, setRecipientEmail] = useState('')
  const [variables, setVariables] = useState({})
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)

  // Initialize default variables
  useEffect(() => {
    const defaultVars = {}
    Object.values(availableVariables || {}).forEach((vars) => {
      vars.forEach((v) => {
        defaultVars[v.key] = getDefaultValue(v.key)
      })
    })
    setVariables(defaultVars)
  }, [availableVariables])

  const getDefaultValue = (key) => {
    const defaults = {
      '{{employee_name}}': 'John Smith',
      '{{employee_code}}': 'IES00012',
      '{{employee_email}}': 'john.smith@company.com',
      '{{employee_type}}': 'IT USA',
      '{{document_name}}': 'H1B Visa Copy',
      '{{document_type}}': 'Visa Document',
      '{{expiry_date}}': 'January 15, 2026',
      '{{days_remaining}}': '28 days',
      '{{company_name}}': 'Intuites LLC',
      '{{support_email}}': 'hr@company.com',
      '{{support_phone}}': '(214) 555-1234',
    }
    return defaults[key] || ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate email
    const emailValidation = validateTextField(recipientEmail, 'Email', {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      patternMessage: 'Please enter a valid email address',
    })

    if (!emailValidation.valid) {
      setErrors({ recipientEmail: emailValidation.error })
      return
    }

    setSending(true)
    try {
      await onSend(recipientEmail, variables)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content test-email-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send Test Email</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Template: <strong>{template.template_name}</strong>
            </label>
          </div>

          <div className="form-group">
            <label>
              Send To <span className="required">*</span>
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => {
                setRecipientEmail(e.target.value)
                if (errors.recipientEmail) {
                  setErrors((prev) => ({ ...prev, recipientEmail: '' }))
                }
              }}
              className={errors.recipientEmail ? 'error' : ''}
              placeholder="admin@company.com"
            />
            {errors.recipientEmail && <span className="error-text">{errors.recipientEmail}</span>}
          </div>

          <div className="form-section">
            <h3>Test Data (Customize Variables)</h3>
            <div className="variables-grid">
              {Object.values(availableVariables).map((vars, idx) => (
                <div key={idx} className="variable-category">
                  {vars.map((v) => (
                    <div key={v.key} className="variable-input-group">
                      <label>{v.label}</label>
                      <input
                        type="text"
                        value={variables[v.key] || ''}
                        onChange={(e) =>
                          setVariables((prev) => ({ ...prev, [v.key]: e.target.value }))
                        }
                        placeholder={getDefaultValue(v.key)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={sending}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
