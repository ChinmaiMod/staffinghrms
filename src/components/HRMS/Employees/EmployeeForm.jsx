import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import {
  ArrowLeftIcon,
  CheckIcon,
  UserIcon,
  MapPinIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline'
import './EmployeeForm.css'

/**
 * Employee Form - Multi-step form for Add/Edit employee
 * Implements UI_DESIGN_DOCS/05_EMPLOYEE_MANAGEMENT.md Section 3
 * 
 * Steps:
 * 1. Basic Information - Personal details
 * 2. Address - Current and permanent addresses
 * 3. Employment - Job, department, type, dates
 * 4. Review - Summary and confirmation
 */

// Form steps configuration
const FORM_STEPS = [
  { id: 'basic', label: 'Basic Information', icon: UserIcon },
  { id: 'address', label: 'Address', icon: MapPinIcon },
  { id: 'employment', label: 'Employment', icon: BriefcaseIcon },
  { id: 'review', label: 'Review & Submit', icon: ClipboardDocumentCheckIcon }
]

// Employee types
const EMPLOYEE_TYPES = [
  { value: 'internal_india', label: 'Internal India', icon: '🇮🇳', color: '#8B5CF6' },
  { value: 'internal_usa', label: 'Internal USA', icon: '🇺🇸', color: '#3B82F6' },
  { value: 'it_usa', label: 'IT USA', icon: '💻', color: '#10B981' },
  { value: 'nonit_usa', label: 'Non-IT USA', icon: '🏢', color: '#F97316' },
  { value: 'healthcare_usa', label: 'Healthcare USA', icon: '🏥', color: '#EC4899' }
]

// Employment statuses
const EMPLOYMENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'terminated', label: 'Terminated' }
]

// Mock departments
const DEPARTMENTS = [
  { id: '1', name: 'Engineering' },
  { id: '2', name: 'Human Resources' },
  { id: '3', name: 'Finance' },
  { id: '4', name: 'Marketing' },
  { id: '5', name: 'Operations' },
  { id: '6', name: 'Nursing' },
  { id: '7', name: 'Clinical' }
]

// Mock job titles
const JOB_TITLES = [
  { id: '1', name: 'Software Developer' },
  { id: '2', name: 'Senior Software Developer' },
  { id: '3', name: 'Lead Developer' },
  { id: '4', name: 'HR Specialist' },
  { id: '5', name: 'Recruiter' },
  { id: '6', name: 'Registered Nurse' },
  { id: '7', name: 'Nurse Practitioner' },
  { id: '8', name: 'Financial Analyst' }
]

// Mock LCA job titles (for visa employees)
const LCA_JOB_TITLES = [
  { id: '1', name: 'Software Developer', soc_code: '15-1252', wage_level: 2 },
  { id: '2', name: 'Senior Software Developer', soc_code: '15-1252', wage_level: 3 },
  { id: '3', name: 'Computer Systems Analyst', soc_code: '15-1211', wage_level: 2 },
  { id: '4', name: 'Database Administrator', soc_code: '15-1242', wage_level: 3 }
]

// Mock countries
const COUNTRIES = [
  { id: '1', name: 'United States' },
  { id: '2', name: 'India' },
  { id: '3', name: 'Canada' }
]

// Mock states
const STATES = [
  { id: '1', name: 'California', country_id: '1' },
  { id: '2', name: 'Texas', country_id: '1' },
  { id: '3', name: 'New York', country_id: '1' },
  { id: '4', name: 'Florida', country_id: '1' },
  { id: '5', name: 'Maharashtra', country_id: '2' },
  { id: '6', name: 'Karnataka', country_id: '2' },
  { id: '7', name: 'Ontario', country_id: '3' }
]

// Mock cities
const CITIES = [
  { id: '1', name: 'Los Angeles', state_id: '1' },
  { id: '2', name: 'San Francisco', state_id: '1' },
  { id: '3', name: 'Houston', state_id: '2' },
  { id: '4', name: 'Dallas', state_id: '2' },
  { id: '5', name: 'New York City', state_id: '3' },
  { id: '6', name: 'Miami', state_id: '4' },
  { id: '7', name: 'Mumbai', state_id: '5' },
  { id: '8', name: 'Pune', state_id: '5' },
  { id: '9', name: 'Bangalore', state_id: '6' },
  { id: '10', name: 'Toronto', state_id: '7' }
]

// Initial form data
const getInitialFormData = () => ({
  // Basic Information
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  date_of_birth_as_per_record: '',
  ssn: '',
  
  // Current Address
  current_street_address_1: '',
  current_street_address_2: '',
  current_city_id: '',
  current_state_id: '',
  current_country_id: '',
  current_postal_code: '',
  
  // Permanent Address (same as current checkbox)
  permanent_same_as_current: false,
  permanent_street_address_1: '',
  permanent_street_address_2: '',
  permanent_city_id: '',
  permanent_state_id: '',
  permanent_country_id: '',
  permanent_postal_code: '',
  
  // Employment
  employee_type: '',
  department_id: '',
  job_title_id: '',
  lca_job_title_id: '',
  employment_status: 'active',
  start_date: '',
  end_date: '',
})

function EmployeeForm({ testMode = false }) {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { tenant, selectedBusiness } = useTenant()
  
  // State
  const [loading, setLoading] = useState(testMode ? false : !!employeeId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState(getInitialFormData())
  const [validationErrors, setValidationErrors] = useState({})
  const [touchedFields, setTouchedFields] = useState({})

  const isEditMode = !!employeeId

  // Memoized filtered states/cities based on selections
  const filteredStates = useMemo(() => {
    return STATES.filter(s => !formData.current_country_id || s.country_id === formData.current_country_id)
  }, [formData.current_country_id])

  const filteredCities = useMemo(() => {
    return CITIES.filter(c => !formData.current_state_id || c.state_id === formData.current_state_id)
  }, [formData.current_state_id])

  const permanentFilteredStates = useMemo(() => {
    return STATES.filter(s => !formData.permanent_country_id || s.country_id === formData.permanent_country_id)
  }, [formData.permanent_country_id])

  const permanentFilteredCities = useMemo(() => {
    return CITIES.filter(c => !formData.permanent_state_id || c.state_id === formData.permanent_state_id)
  }, [formData.permanent_state_id])

  // Check if employee type requires LCA job title
  const requiresLcaJobTitle = useMemo(() => {
    return ['it_usa', 'healthcare_usa'].includes(formData.employee_type)
  }, [formData.employee_type])

  useEffect(() => {
    if (employeeId) {
      fetchEmployee()
    }
  }, [employeeId])

  const fetchEmployee = async () => {
    try {
      if (testMode) {
        setFormData({
          ...getInitialFormData(),
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@company.com',
          phone: '+1 (555) 123-4567',
          employee_type: 'it_usa',
          employment_status: 'active',
          start_date: '2024-01-15',
          department_id: '1',
          job_title_id: '2',
        })
        setLoading(false)
        return
      }
      setLoading(true)
      // TODO: Replace with actual Supabase query
      // ...
      await new Promise(resolve => setTimeout(resolve, 500))
      setFormData({
        ...getInitialFormData(),
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@company.com',
        phone: '+1 (555) 123-4567',
        employee_type: 'it_usa',
        employment_status: 'active',
        start_date: '2024-01-15',
        department_id: '1',
        job_title_id: '2',
      })
    } catch (err) {
      console.error('Error fetching employee:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setFormData(prev => {
      const updates = { [name]: newValue }
      
      // Handle "same as current" checkbox
      if (name === 'permanent_same_as_current' && checked) {
        updates.permanent_street_address_1 = prev.current_street_address_1
        updates.permanent_street_address_2 = prev.current_street_address_2
        updates.permanent_city_id = prev.current_city_id
        updates.permanent_state_id = prev.current_state_id
        updates.permanent_country_id = prev.current_country_id
        updates.permanent_postal_code = prev.current_postal_code
      }
      
      // Clear dependent dropdowns when parent changes
      if (name === 'current_country_id') {
        updates.current_state_id = ''
        updates.current_city_id = ''
      }
      if (name === 'current_state_id') {
        updates.current_city_id = ''
      }
      if (name === 'permanent_country_id') {
        updates.permanent_state_id = ''
        updates.permanent_city_id = ''
      }
      if (name === 'permanent_state_id') {
        updates.permanent_city_id = ''
      }
      
      return { ...prev, ...updates }
    })
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouchedFields(prev => ({ ...prev, [name]: true }))
  }

  // Validate specific step
  const validateStep = (step) => {
    const errors = {}
    
    if (step === 0) {
      // Basic Information validation
      if (!formData.first_name?.trim()) {
        errors.first_name = 'First name is required'
      }
      if (!formData.last_name?.trim()) {
        errors.last_name = 'Last name is required'
      }
      if (!formData.email?.trim()) {
        errors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Invalid email format'
      }
    }
    
    if (step === 1) {
      // Address validation - current address required
      if (!formData.current_street_address_1?.trim()) {
        errors.current_street_address_1 = 'Street address is required'
      }
      if (!formData.current_country_id) {
        errors.current_country_id = 'Country is required'
      }
      if (!formData.current_state_id) {
        errors.current_state_id = 'State is required'
      }
      if (!formData.current_city_id) {
        errors.current_city_id = 'City is required'
      }
      if (!formData.current_postal_code?.trim()) {
        errors.current_postal_code = 'Postal code is required'
      }
    }
    
    if (step === 2) {
      // Employment validation
      if (!formData.employee_type) {
        errors.employee_type = 'Employee type is required'
      }
      if (!formData.start_date) {
        errors.start_date = 'Start date is required'
      }
      if (!formData.department_id) {
        errors.department_id = 'Department is required'
      }
      if (!formData.job_title_id) {
        errors.job_title_id = 'Job title is required'
      }
      if (requiresLcaJobTitle && !formData.lca_job_title_id) {
        errors.lca_job_title_id = 'LCA job title is required for visa employees'
      }
    }
    
    return errors
  }

  // Validate entire form
  const validateForm = () => {
    let allErrors = {}
    for (let i = 0; i <= 2; i++) {
      const stepErrors = validateStep(i)
      allErrors = { ...allErrors, ...stepErrors }
    }
    setValidationErrors(allErrors)
    return Object.keys(allErrors).length === 0
  }

  const handleNext = () => {
    const errors = validateStep(currentStep)
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      // Mark all fields in current step as touched
      const stepFields = getStepFields(currentStep)
      const touched = {}
      stepFields.forEach(field => touched[field] = true)
      setTouchedFields(prev => ({ ...prev, ...touched }))
      return
    }
    setCurrentStep(prev => Math.min(prev + 1, FORM_STEPS.length - 1))
    setError(null)
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
    setError(null)
  }

  const handleStepClick = (stepIndex) => {
    // Only allow going back or to current/next step if validated
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex)
    } else if (stepIndex === currentStep + 1) {
      handleNext()
    }
  }

  const getStepFields = (step) => {
    switch(step) {
      case 0:
        return ['first_name', 'middle_name', 'last_name', 'email', 'phone', 'date_of_birth', 'ssn']
      case 1:
        return ['current_street_address_1', 'current_street_address_2', 'current_city_id', 
                'current_state_id', 'current_country_id', 'current_postal_code',
                'permanent_street_address_1', 'permanent_city_id', 'permanent_state_id', 
                'permanent_country_id', 'permanent_postal_code']
      case 2:
        return ['employee_type', 'department_id', 'job_title_id', 'lca_job_title_id', 
                'employment_status', 'start_date', 'end_date']
      default:
        return []
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      // Go to first step with errors
      for (let i = 0; i < FORM_STEPS.length - 1; i++) {
        const stepErrors = validateStep(i)
        if (Object.keys(stepErrors).length > 0) {
          setCurrentStep(i)
          break
        }
      }
      return
    }
    
    try {
      setSaving(true)
      setError(null)
      
      // TODO: Replace with actual Supabase mutation
      // const payload = {
      //   ...formData,
      //   tenant_id: tenant?.id,
      //   business_id: selectedBusiness?.id || null,
      //   ...(isEditMode 
      //     ? { updated_by: profile?.id } 
      //     : { created_by: profile?.id, updated_by: profile?.id }
      //   )
      // }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Navigate back to employee list
      navigate('/hrms/employees')
    } catch (err) {
      console.error('Error saving employee:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Check if step is complete
  const isStepComplete = (stepIndex) => {
    const errors = validateStep(stepIndex)
    return Object.keys(errors).length === 0
  }

  // Get step status for stepper
  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) {
      return isStepComplete(stepIndex) ? 'complete' : 'error'
    }
    if (stepIndex === currentStep) return 'current'
    return 'pending'
  }

  if (loading) {
    return <LoadingSpinner message="Loading employee..." />
  }

  // Render input with validation
  const renderInput = (name, label, type = 'text', options = {}) => {
    const { required = false, placeholder = '', disabled = false, className = '' } = options
    const hasError = validationErrors[name] && touchedFields[name]
    
    return (
      <div className={`form-group ${className}`}>
        <label htmlFor={name}>
          {label}
          {required && <span className="required">*</span>}
        </label>
        <input
          type={type}
          id={name}
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className={hasError ? 'error' : ''}
          placeholder={placeholder}
          disabled={disabled}
        />
        {hasError && (
          <span className="error-message">
            <ExclamationCircleIcon className="error-icon" />
            {validationErrors[name]}
          </span>
        )}
      </div>
    )
  }

  // Render select with validation
  const renderSelect = (name, label, selectOptions, options = {}) => {
    const { required = false, placeholder = 'Select...', disabled = false, className = '' } = options
    const hasError = validationErrors[name] && touchedFields[name]
    
    return (
      <div className={`form-group ${className}`}>
        <label htmlFor={name}>
          {label}
          {required && <span className="required">*</span>}
        </label>
        <select
          id={name}
          name={name}
          value={formData[name] || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className={hasError ? 'error' : ''}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {selectOptions.map(opt => (
            <option key={opt.value || opt.id} value={opt.value || opt.id}>
              {opt.icon ? `${opt.icon} ` : ''}{opt.label || opt.name}
            </option>
          ))}
        </select>
        {hasError && (
          <span className="error-message">
            <ExclamationCircleIcon className="error-icon" />
            {validationErrors[name]}
          </span>
        )}
      </div>
    )
  }

  // Render Step 1: Basic Information
  const renderBasicInfoStep = () => (
    <div className="step-content">
      <div className="step-title">
        <UserIcon className="step-icon" />
        <div>
          <h2>Personal Information</h2>
          <p className="step-description">Enter the employee's basic personal details</p>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-card-title">
          <IdentificationIcon className="card-icon" />
          Name & Contact
        </h3>
        
        <div className="form-row three-columns">
          {renderInput('first_name', 'First Name', 'text', { required: true, placeholder: 'John' })}
          {renderInput('middle_name', 'Middle Name', 'text', { placeholder: 'Michael' })}
          {renderInput('last_name', 'Last Name', 'text', { required: true, placeholder: 'Smith' })}
        </div>

        <div className="form-row two-columns">
          {renderInput('email', 'Email Address', 'email', { required: true, placeholder: 'john.smith@company.com' })}
          {renderInput('phone', 'Phone Number', 'tel', { placeholder: '+1 (555) 123-4567' })}
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-card-title">
          <DocumentTextIcon className="card-icon" />
          Personal Details
        </h3>
        
        <div className="form-row two-columns">
          {renderInput('date_of_birth', 'Date of Birth', 'date')}
          {renderInput('date_of_birth_as_per_record', 'DOB (As Per Record)', 'date')}
        </div>

        <div className="form-row">
          {renderInput('ssn', 'SSN (Last 4 digits)', 'text', { 
            placeholder: '••••', 
            className: 'ssn-field'
          })}
          <p className="field-help">For security, only the last 4 digits are stored</p>
        </div>
      </div>
    </div>
  )

  // Render Step 2: Address
  const renderAddressStep = () => (
    <div className="step-content">
      <div className="step-title">
        <MapPinIcon className="step-icon" />
        <div>
          <h2>Address Information</h2>
          <p className="step-description">Enter current and permanent address details</p>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-card-title">Current Address</h3>
        
        <div className="form-row">
          {renderInput('current_street_address_1', 'Street Address', 'text', { 
            required: true, 
            placeholder: '123 Main Street',
            className: 'full-width'
          })}
        </div>

        <div className="form-row">
          {renderInput('current_street_address_2', 'Apt/Suite/Unit', 'text', { 
            placeholder: 'Apt 4B',
            className: 'full-width'
          })}
        </div>

        <div className="form-row three-columns">
          {renderSelect('current_country_id', 'Country', COUNTRIES, { required: true })}
          {renderSelect('current_state_id', 'State', filteredStates, { required: true })}
          {renderSelect('current_city_id', 'City', filteredCities, { required: true })}
        </div>

        <div className="form-row">
          {renderInput('current_postal_code', 'Postal Code', 'text', { 
            required: true, 
            placeholder: '90210' 
          })}
        </div>
      </div>

      <div className="form-card">
        <div className="card-header-with-checkbox">
          <h3 className="form-card-title">Permanent Address</h3>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="permanent_same_as_current"
              checked={formData.permanent_same_as_current}
              onChange={handleChange}
            />
            <span>Same as current address</span>
          </label>
        </div>
        
        {!formData.permanent_same_as_current && (
          <>
            <div className="form-row">
              {renderInput('permanent_street_address_1', 'Street Address', 'text', { 
                placeholder: '123 Main Street',
                className: 'full-width'
              })}
            </div>

            <div className="form-row">
              {renderInput('permanent_street_address_2', 'Apt/Suite/Unit', 'text', { 
                placeholder: 'Apt 4B',
                className: 'full-width'
              })}
            </div>

            <div className="form-row three-columns">
              {renderSelect('permanent_country_id', 'Country', COUNTRIES)}
              {renderSelect('permanent_state_id', 'State', permanentFilteredStates)}
              {renderSelect('permanent_city_id', 'City', permanentFilteredCities)}
            </div>

            <div className="form-row">
              {renderInput('permanent_postal_code', 'Postal Code', 'text', { placeholder: '90210' })}
            </div>
          </>
        )}
      </div>
    </div>
  )

  // Render Step 3: Employment
  const renderEmploymentStep = () => (
    <div className="step-content">
      <div className="step-title">
        <BriefcaseIcon className="step-icon" />
        <div>
          <h2>Employment Information</h2>
          <p className="step-description">Configure employee type, department, and job details</p>
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-card-title">Employee Classification</h3>
        
        <div className="employee-type-cards">
          {EMPLOYEE_TYPES.map(type => (
            <label 
              key={type.value} 
              className={`type-card ${formData.employee_type === type.value ? 'selected' : ''}`}
              style={{ '--type-color': type.color }}
            >
              <input
                type="radio"
                name="employee_type"
                value={type.value}
                checked={formData.employee_type === type.value}
                onChange={handleChange}
              />
              <span className="type-icon">{type.icon}</span>
              <span className="type-label">{type.label}</span>
            </label>
          ))}
        </div>
        {validationErrors.employee_type && touchedFields.employee_type && (
          <span className="error-message">
            <ExclamationCircleIcon className="error-icon" />
            {validationErrors.employee_type}
          </span>
        )}
      </div>

      <div className="form-card">
        <h3 className="form-card-title">Job Details</h3>
        
        <div className="form-row two-columns">
          {renderSelect('department_id', 'Department', DEPARTMENTS, { required: true })}
          {renderSelect('job_title_id', 'Job Title', JOB_TITLES, { required: true })}
        </div>

        {requiresLcaJobTitle && (
          <div className="lca-section">
            <div className="lca-notice">
              <ExclamationCircleIcon className="notice-icon" />
              <span>This employee type requires LCA job title for visa compliance</span>
            </div>
            <div className="form-row">
              {renderSelect('lca_job_title_id', 'LCA Job Title (DOL)', LCA_JOB_TITLES.map(j => ({
                ...j,
                name: `${j.name} (${j.soc_code}, Level ${j.wage_level})`
              })), { required: true })}
            </div>
          </div>
        )}

        <div className="form-row two-columns">
          {renderSelect('employment_status', 'Employment Status', EMPLOYMENT_STATUSES)}
        </div>
      </div>

      <div className="form-card">
        <h3 className="form-card-title">Dates</h3>
        
        <div className="form-row two-columns">
          {renderInput('start_date', 'Start Date', 'date', { required: true })}
          {renderInput('end_date', 'End Date', 'date')}
        </div>
      </div>
    </div>
  )

  // Render Step 4: Review
  const renderReviewStep = () => {
    const selectedEmployeeType = EMPLOYEE_TYPES.find(t => t.value === formData.employee_type)
    const selectedDepartment = DEPARTMENTS.find(d => d.id === formData.department_id)
    const selectedJobTitle = JOB_TITLES.find(j => j.id === formData.job_title_id)
    const selectedLcaTitle = LCA_JOB_TITLES.find(l => l.id === formData.lca_job_title_id)
    const selectedCurrentCountry = COUNTRIES.find(c => c.id === formData.current_country_id)
    const selectedCurrentState = STATES.find(s => s.id === formData.current_state_id)
    const selectedCurrentCity = CITIES.find(c => c.id === formData.current_city_id)
    
    return (
      <div className="step-content">
        <div className="step-title">
          <ClipboardDocumentCheckIcon className="step-icon" />
          <div>
            <h2>Review & Submit</h2>
            <p className="step-description">Review all information before submitting</p>
          </div>
        </div>

        <div className="review-section">
          <div className="review-card">
            <div className="review-card-header">
              <h3>Personal Information</h3>
              <button 
                type="button" 
                className="edit-section-btn"
                onClick={() => setCurrentStep(0)}
              >
                Edit
              </button>
            </div>
            <div className="review-grid">
              <div className="review-item">
                <span className="review-label">Full Name</span>
                <span className="review-value">
                  {formData.first_name} {formData.middle_name} {formData.last_name}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">Email</span>
                <span className="review-value">{formData.email || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Phone</span>
                <span className="review-value">{formData.phone || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Date of Birth</span>
                <span className="review-value">{formData.date_of_birth || '—'}</span>
              </div>
            </div>
          </div>

          <div className="review-card">
            <div className="review-card-header">
              <h3>Address</h3>
              <button 
                type="button" 
                className="edit-section-btn"
                onClick={() => setCurrentStep(1)}
              >
                Edit
              </button>
            </div>
            <div className="review-grid">
              <div className="review-item full-width">
                <span className="review-label">Current Address</span>
                <span className="review-value">
                  {formData.current_street_address_1}
                  {formData.current_street_address_2 && `, ${formData.current_street_address_2}`}
                  {selectedCurrentCity && `, ${selectedCurrentCity.name}`}
                  {selectedCurrentState && `, ${selectedCurrentState.name}`}
                  {formData.current_postal_code && ` ${formData.current_postal_code}`}
                  {selectedCurrentCountry && `, ${selectedCurrentCountry.name}`}
                </span>
              </div>
            </div>
          </div>

          <div className="review-card">
            <div className="review-card-header">
              <h3>Employment</h3>
              <button 
                type="button" 
                className="edit-section-btn"
                onClick={() => setCurrentStep(2)}
              >
                Edit
              </button>
            </div>
            <div className="review-grid">
              <div className="review-item">
                <span className="review-label">Employee Type</span>
                <span className="review-value">
                  {selectedEmployeeType && (
                    <span className="type-badge" style={{ backgroundColor: `${selectedEmployeeType.color}20`, color: selectedEmployeeType.color }}>
                      {selectedEmployeeType.icon} {selectedEmployeeType.label}
                    </span>
                  )}
                </span>
              </div>
              <div className="review-item">
                <span className="review-label">Department</span>
                <span className="review-value">{selectedDepartment?.name || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Job Title</span>
                <span className="review-value">{selectedJobTitle?.name || '—'}</span>
              </div>
              {requiresLcaJobTitle && (
                <div className="review-item">
                  <span className="review-label">LCA Job Title</span>
                  <span className="review-value">{selectedLcaTitle?.name || '—'}</span>
                </div>
              )}
              <div className="review-item">
                <span className="review-label">Start Date</span>
                <span className="review-value">{formData.start_date || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Status</span>
                <span className="review-value status-badge">{formData.employment_status}</span>
              </div>
            </div>
          </div>
        </div>

        {Object.keys(validationErrors).length > 0 && (
          <div className="validation-summary">
            <ExclamationCircleIcon className="summary-icon" />
            <div>
              <strong>Please fix the following errors:</strong>
              <ul>
                {Object.entries(validationErrors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderBasicInfoStep()
      case 1: return renderAddressStep()
      case 2: return renderEmploymentStep()
      case 3: return renderReviewStep()
      default: return null
    }
  }

  return (
    <div className="employee-form">
      {/* Header */}
      <div className="form-header">
        <div className="header-left">
          <Link to="/hrms/employees" className="back-link">
            <ArrowLeftIcon className="back-icon" />
            Back to Employees
          </Link>
          <h1>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h1>
          <p className="header-subtitle">
            {isEditMode 
              ? 'Update employee information' 
              : 'Complete all steps to add a new employee'
            }
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator">
        {FORM_STEPS.map((step, index) => {
          const status = getStepStatus(index)
          const StepIcon = step.icon
          
          return (
            <div 
              key={step.id}
              className={`step-item ${status}`}
              onClick={() => handleStepClick(index)}
              role="button"
              tabIndex={0}
            >
              <div className="step-circle">
                {status === 'complete' ? (
                  <CheckIcon className="check-icon" />
                ) : (
                  <StepIcon className="step-icon-small" />
                )}
              </div>
              <span className="step-label">{step.label}</span>
              {index < FORM_STEPS.length - 1 && (
                <ChevronRightIcon className="step-connector" />
              )}
            </div>
          )
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="form-error-banner">
          <ExclamationCircleIcon className="error-banner-icon" />
          <div className="error-content">
            <strong>Error</strong>
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)} className="dismiss-btn">×</button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="employee-form-content">
        {renderStepContent()}

        {/* Navigation Buttons */}
        <div className="form-navigation">
          <div className="nav-left">
            {currentStep > 0 && (
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleBack}
              >
                Back
              </button>
            )}
          </div>
          
          <div className="nav-right">
            <Link to="/hrms/employees" className="btn btn-ghost">
              Cancel
            </Link>
            
            {currentStep < FORM_STEPS.length - 1 ? (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleNext}
              >
                Continue
                <ChevronRightIcon className="btn-icon" />
              </button>
            ) : (
              <button 
                type="submit" 
                className="btn btn-primary btn-submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="btn-icon" />
                    {isEditMode ? 'Update Employee' : 'Create Employee'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default EmployeeForm
