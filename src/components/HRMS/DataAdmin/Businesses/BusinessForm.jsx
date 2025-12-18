import { useEffect, useMemo, useState } from 'react'

const BUSINESS_TYPES = [
  { value: 'IT_STAFFING', label: 'IT Staffing' },
  { value: 'HEALTHCARE_STAFFING', label: 'Healthcare Staffing' },
  { value: 'GENERAL', label: 'General' },
  { value: 'OTHER', label: 'Other' }
]

const CONTACT_TYPES = [
  { value: 'IT_CANDIDATE', label: 'IT Candidate' },
  { value: 'HEALTHCARE_CANDIDATE', label: 'Healthcare Candidate' },
  { value: 'VENDOR_CLIENT', label: 'Vendor Client' },
  { value: 'VENDOR_EMPANELMENT', label: 'Vendor Empanelment' },
  { value: 'EMPLOYEE_INDIA', label: 'Employee - India' },
  { value: 'EMPLOYEE_USA', label: 'Employee - USA' }
]

const DEFAULT_CONTACT_TYPES = CONTACT_TYPES.map((type) => type.value)

const defaultFormState = {
  business_name: '',
  business_type: 'GENERAL',
  description: '',
  industry: '',
  enabled_contact_types: DEFAULT_CONTACT_TYPES,
  is_active: true,
  is_default: false
}

export default function BusinessForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting
}) {
  const [formState, setFormState] = useState(defaultFormState)
  const [errors, setErrors] = useState({})

  const title = useMemo(() => (initialValues ? 'Edit Business' : 'Add Business'), [initialValues])

  useEffect(() => {
    if (initialValues) {
      setFormState({
        business_name: initialValues.business_name || '',
        business_type: initialValues.business_type || 'GENERAL',
        description: initialValues.description || '',
        industry: initialValues.industry || '',
        enabled_contact_types:
          Array.isArray(initialValues.enabled_contact_types) && initialValues.enabled_contact_types.length
            ? initialValues.enabled_contact_types
            : DEFAULT_CONTACT_TYPES,
        is_active: initialValues.is_active ?? true,
        is_default: initialValues.is_default ?? false
      })
    } else {
      setFormState(defaultFormState)
    }
    setErrors({})
  }, [initialValues])

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleCheckboxToggle = (field) => (event) => {
    handleChange(field, event.target.checked)
  }

  const handleContactTypeToggle = (value) => {
    setFormState((prev) => {
      const next = prev.enabled_contact_types.includes(value)
        ? prev.enabled_contact_types.filter((item) => item !== value)
        : [...prev.enabled_contact_types, value]
      return { ...prev, enabled_contact_types: next }
    })
  }

  const validate = () => {
    const nextErrors = {}
    if (!formState.business_name.trim()) {
      nextErrors.business_name = 'Business name is required'
    }
    if (!formState.business_type) {
      nextErrors.business_type = 'Business type is required'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return
    onSubmit(formState)
  }

  return (
    <div
      style={{
        marginBottom: '24px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '28px',
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '28px',
        paddingBottom: '20px',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>{title}</h3>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
            Complete the fields below to save your business settings.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            type="button" 
            onClick={onCancel} 
            disabled={submitting}
            style={{ minWidth: '90px' }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ minWidth: '120px' }}
          >
            {submitting ? 'Saving...' : 'Save Business'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
              Business Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formState.business_name}
              onChange={(event) => handleChange('business_name', event.target.value)}
              placeholder="e.g., Intuites IT Staffing"
              style={{
                padding: '10px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'all 0.2s',
                background: 'white',
                color: '#1e293b'
              }}
            />
            {errors.business_name && (
              <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>
                {errors.business_name}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
              Business Type <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={formState.business_type}
              onChange={(event) => handleChange('business_type', event.target.value)}
              style={{
                padding: '10px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'all 0.2s',
                background: 'white',
                color: '#1e293b',
                cursor: 'pointer'
              }}
            >
              {BUSINESS_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.business_type && (
              <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>
                {errors.business_type}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: '#334155' }}>
              Industry
            </label>
            <input
              type="text"
              value={formState.industry}
              onChange={(event) => handleChange('industry', event.target.value)}
              placeholder="e.g., Technology, Healthcare"
              style={{
                padding: '10px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'all 0.2s',
                background: 'white',
                color: '#1e293b'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ 
            fontSize: '14px', 
            fontWeight: 500, 
            color: '#334155',
            display: 'block',
            marginBottom: '8px'
          }}>
            Description
          </label>
          <textarea
            rows={3}
            value={formState.description}
            onChange={(event) => handleChange('description', event.target.value)}
            placeholder="Short description of this business context"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '14px',
              transition: 'all 0.2s',
              background: 'white',
              color: '#1e293b',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: '1.5'
            }}
          />
        </div>

        <div style={{ 
          marginBottom: '28px',
          padding: '20px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>
          <label style={{ 
            fontSize: '14px', 
            fontWeight: 500, 
            color: '#334155',
            display: 'block',
            marginBottom: '14px'
          }}>
            Enabled Contact Types
          </label>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {CONTACT_TYPES.map((type) => (
              <label 
                key={type.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px',
                  color: '#475569'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.background = '#ffffff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.background = 'white'
                }}
              >
                <input
                  type="checkbox"
                  checked={formState.enabled_contact_types.includes(type.value)}
                  onChange={() => handleContactTypeToggle(type.value)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                  }}
                />
                <span style={{ flex: 1, userSelect: 'none' }}>{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ 
          display: 'flex',
          gap: '24px',
          padding: '20px',
          background: '#f8fafc',
          borderRadius: '10px',
          border: '1px solid #e2e8f0'
        }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#475569',
              flex: 1
            }}
          >
            <input
              type="checkbox"
              checked={formState.is_active}
              onChange={handleCheckboxToggle('is_active')}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#10b981'
              }}
            />
            <span style={{ userSelect: 'none' }}>Active</span>
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#475569',
              flex: 1
            }}
          >
            <input
              type="checkbox"
              checked={formState.is_default}
              onChange={handleCheckboxToggle('is_default')}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#8b5cf6'
              }}
            />
            <span style={{ userSelect: 'none' }}>Set as default business</span>
          </label>
        </div>
      </form>
    </div>
  )
}
