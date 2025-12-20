import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import { useToast } from '../../../contexts/ToastProvider'
import { normalizeError, getErrorMessage } from '../../../utils/errorResponse'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './ProjectForm.css'

/**
 * ProjectForm - Create/Edit project form (simplified single-step version)
 * URL: /hrms/projects/new or /hrms/projects/:projectId/edit
 * Based on UI_DESIGN_DOCS/08_EMPLOYEE_PROJECTS.md
 */
function ProjectForm({ testMode = false }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { tenant, selectedBusiness } = useTenant()
  const { user } = useAuth()
  const { showSuccess, showErrorResponse } = useToast()
  const isEditMode = !!projectId

  const [loading, setLoading] = useState(!testMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [employees, setEmployees] = useState([])

  const [formData, setFormData] = useState({
    project_name: '',
    project_code: '',
    employee_id: '',
    end_client_name: '',
    end_client_manager_name: '',
    end_client_manager_email: '',
    end_client_manager_phone: '',
    work_location_type: 'hybrid',
    project_start_date: '',
    project_end_date: '',
    actual_client_bill_rate: '',
    informed_rate_to_candidate: '',
    candidate_percentage: 80,
    rate_paid_to_candidate: '',
    lca_rate: '',
    is_lca_project: false,
    project_status: 'active',
  })

  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    if (testMode) {
      setEmployees([
        {
          employee_id: 'emp-001',
          first_name: 'John',
          last_name: 'Smith',
          employee_code: 'IES00012',
        },
      ])
      if (isEditMode) {
        setFormData({
          project_name: 'Acme Corp - Software Developer',
          project_code: 'PRJ-2025-001',
          employee_id: 'emp-001',
          end_client_name: 'Acme Corporation',
          end_client_manager_name: 'Jane Wilson',
          end_client_manager_email: 'jane.wilson@acme.com',
          work_location_type: 'hybrid',
          project_start_date: '2025-01-15',
          project_end_date: '2025-12-31',
          actual_client_bill_rate: '85.00',
          informed_rate_to_candidate: '70.00',
          candidate_percentage: 80,
          rate_paid_to_candidate: '56.00',
          lca_rate: '75.00',
          is_lca_project: true,
          project_status: 'active',
        })
      }
      setLoading(false)
      return
    }

    if (tenant?.tenant_id) {
      fetchEmployees()
      if (isEditMode) {
        fetchProject()
      } else {
        setLoading(false)
      }
    }
  }, [projectId, tenant?.tenant_id, testMode])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('hrms_employees')
        .select('employee_id, first_name, last_name, employee_code')
        .eq('tenant_id', tenant.tenant_id)
        .eq('is_active', true)
        .order('first_name', { ascending: true })

      if (error) throw error
      setEmployees(data || [])
    } catch (err) {
      console.error('Error fetching employees:', err)
    }
  }

  const fetchProject = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('hrms_projects')
        .select('*')
        .eq('project_id', projectId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        setFormData({
          project_name: data.project_name || '',
          project_code: data.project_code || '',
          employee_id: data.employee_id || '',
          end_client_name: data.end_client_name || '',
          end_client_manager_name: data.end_client_manager_name || '',
          end_client_manager_email: data.end_client_manager_email || '',
          end_client_manager_phone: data.end_client_manager_phone || '',
          work_location_type: data.work_location_type || 'hybrid',
          project_start_date: data.project_start_date || '',
          project_end_date: data.project_end_date || '',
          actual_client_bill_rate: data.actual_client_bill_rate?.toString() || '',
          informed_rate_to_candidate: data.informed_rate_to_candidate?.toString() || '',
          candidate_percentage: data.candidate_percentage || 80,
          rate_paid_to_candidate: data.rate_paid_to_candidate?.toString() || '',
          lca_rate: data.lca_rate?.toString() || '',
          is_lca_project: data.is_lca_project || false,
          project_status: data.project_status || 'active',
        })
      }
      setLoading(false)
    } catch (err) {
      console.error('Error fetching project:', err)
      setError(err.message || 'Failed to load project')
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.project_name.trim()) {
      errors.project_name = 'Project name is required'
    }
    if (!formData.employee_id) {
      errors.employee_id = 'Please select an employee'
    }
    if (!formData.end_client_name.trim()) {
      errors.end_client_name = 'End client name is required'
    }
    if (!formData.project_start_date) {
      errors.project_start_date = 'Start date is required'
    }
    if (formData.project_end_date && formData.project_end_date < formData.project_start_date) {
      errors.project_end_date = 'End date must be after start date'
    }
    if (formData.is_lca_project && !formData.lca_rate) {
      errors.lca_rate = 'LCA rate is required for LCA projects'
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSaving(true)
      setError(null)

      const projectData = {
        tenant_id: tenant.tenant_id,
        business_id: selectedBusiness?.business_id || null,
        project_name: formData.project_name.trim(),
        project_code: formData.project_code.trim() || null,
        employee_id: formData.employee_id,
        end_client_name: formData.end_client_name.trim(),
        end_client_manager_name: formData.end_client_manager_name.trim() || null,
        end_client_manager_email: formData.end_client_manager_email.trim() || null,
        end_client_manager_phone: formData.end_client_manager_phone.trim() || null,
        work_location_type: formData.work_location_type,
        project_start_date: formData.project_start_date || null,
        project_end_date: formData.project_end_date || null,
        actual_client_bill_rate: formData.actual_client_bill_rate ? parseFloat(formData.actual_client_bill_rate) : null,
        informed_rate_to_candidate: formData.informed_rate_to_candidate ? parseFloat(formData.informed_rate_to_candidate) : null,
        candidate_percentage: formData.candidate_percentage ? parseFloat(formData.candidate_percentage) : null,
        rate_paid_to_candidate: formData.rate_paid_to_candidate ? parseFloat(formData.rate_paid_to_candidate) : null,
        lca_rate: formData.lca_rate ? parseFloat(formData.lca_rate) : null,
        is_lca_project: formData.is_lca_project,
        project_status: formData.project_status,
        created_by: user?.id,
        updated_by: user?.id,
      }

      let result
      if (isEditMode) {
        const { data, error: updateError } = await supabase
          .from('hrms_projects')
          .update(projectData)
          .eq('project_id', projectId)
          .eq('tenant_id', tenant.tenant_id)
          .select()
          .single()

        if (updateError) throw updateError
        result = data
      } else {
        const { data, error: insertError } = await supabase
          .from('hrms_projects')
          .insert(projectData)
          .select()
          .single()

        if (insertError) throw insertError
        result = data
      }

      // If initial rate is provided, create rate history entry
      if (result && formData.actual_client_bill_rate) {
        await supabase
          .from('hrms_project_rate_history')
          .insert({
            tenant_id: tenant.tenant_id,
            business_id: selectedBusiness?.business_id || null,
            project_id: result.project_id,
            actual_client_bill_rate: parseFloat(formData.actual_client_bill_rate),
            informed_rate_to_candidate: formData.informed_rate_to_candidate ? parseFloat(formData.informed_rate_to_candidate) : null,
            candidate_percentage: formData.candidate_percentage ? parseFloat(formData.candidate_percentage) : null,
            rate_paid_to_candidate: formData.rate_paid_to_candidate ? parseFloat(formData.rate_paid_to_candidate) : null,
            lca_rate: formData.lca_rate ? parseFloat(formData.lca_rate) : null,
            effective_from_date: formData.project_start_date || new Date().toISOString().split('T')[0],
            change_reason: 'initial_rate',
            created_by: user?.id,
          })
      }

      // Show success toast
      showSuccess(
        isEditMode ? 'Project updated successfully' : 'Project created successfully'
      )
      
      navigate(`/hrms/projects/${result.project_id}`)
    } catch (err) {
      console.error('Error saving project:', err)
      const errorResponse = normalizeError(err, 'project form submission')
      const errorMessage = getErrorMessage(errorResponse)
      setError(errorMessage)
      showErrorResponse(errorResponse)
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
    return <LoadingSpinner fullScreen message={isEditMode ? 'Loading project...' : 'Loading form...'} data-testid="loading-spinner" />
  }

  return (
    <div className="project-form-container">
      <Link to="/hrms/projects" className="back-link">
        <ArrowLeftIcon className="icon-sm" />
        Back to Projects
      </Link>

      <div className="project-form-header">
        <h1 className="page-title">{isEditMode ? 'Edit Project' : 'Create New Project'}</h1>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-section">
          <h2 className="form-section-title">Project Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="project_name">
                Project Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="project_name"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                className={validationErrors.project_name ? 'error' : ''}
                required
              />
              {validationErrors.project_name && (
                <span className="error-message">{validationErrors.project_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="project_code">Project Code</label>
              <input
                type="text"
                id="project_code"
                name="project_code"
                value={formData.project_code}
                onChange={handleChange}
                placeholder="Auto-generated if left blank"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Employee Assignment</h2>
          <div className="form-group">
            <label htmlFor="employee_id">
              Select Employee <span className="required">*</span>
            </label>
            <select
              id="employee_id"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              className={validationErrors.employee_id ? 'error' : ''}
              required
            >
              <option value="">Select an employee...</option>
              {employees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_code})
                </option>
              ))}
            </select>
            {validationErrors.employee_id && (
              <span className="error-message">{validationErrors.employee_id}</span>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Client Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="end_client_name">
                End Client Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="end_client_name"
                name="end_client_name"
                value={formData.end_client_name}
                onChange={handleChange}
                className={validationErrors.end_client_name ? 'error' : ''}
                required
              />
              {validationErrors.end_client_name && (
                <span className="error-message">{validationErrors.end_client_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="end_client_manager_name">Client Manager Name</label>
              <input
                type="text"
                id="end_client_manager_name"
                name="end_client_manager_name"
                value={formData.end_client_manager_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_client_manager_email">Client Manager Email</label>
              <input
                type="email"
                id="end_client_manager_email"
                name="end_client_manager_email"
                value={formData.end_client_manager_email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_client_manager_phone">Client Manager Phone</label>
              <input
                type="tel"
                id="end_client_manager_phone"
                name="end_client_manager_phone"
                value={formData.end_client_manager_phone}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Project Dates</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="project_start_date">
                Start Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="project_start_date"
                name="project_start_date"
                value={formData.project_start_date}
                onChange={handleChange}
                className={validationErrors.project_start_date ? 'error' : ''}
                required
              />
              {validationErrors.project_start_date && (
                <span className="error-message">{validationErrors.project_start_date}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="project_end_date">End Date (Expected)</label>
              <input
                type="date"
                id="project_end_date"
                name="project_end_date"
                value={formData.project_end_date}
                onChange={handleChange}
                className={validationErrors.project_end_date ? 'error' : ''}
              />
              {validationErrors.project_end_date && (
                <span className="error-message">{validationErrors.project_end_date}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="work_location_type">Work Location Type</label>
              <select
                id="work_location_type"
                name="work_location_type"
                value={formData.work_location_type}
                onChange={handleChange}
              >
                <option value="onsite">Onsite</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Financials & Rates</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="actual_client_bill_rate">Actual Client Bill Rate ($)</label>
              <input
                type="number"
                id="actual_client_bill_rate"
                name="actual_client_bill_rate"
                value={formData.actual_client_bill_rate}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="informed_rate_to_candidate">Informed Rate to Candidate ($)</label>
              <input
                type="number"
                id="informed_rate_to_candidate"
                name="informed_rate_to_candidate"
                value={formData.informed_rate_to_candidate}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="candidate_percentage">Candidate Percentage (%)</label>
              <input
                type="number"
                id="candidate_percentage"
                name="candidate_percentage"
                value={formData.candidate_percentage}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="rate_paid_to_candidate">Rate Paid to Candidate ($)</label>
              <input
                type="number"
                id="rate_paid_to_candidate"
                name="rate_paid_to_candidate"
                value={formData.rate_paid_to_candidate}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">LCA Compliance</h2>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_lca_project"
                checked={formData.is_lca_project}
                onChange={handleChange}
              />
              <span>This is an LCA Project</span>
            </label>
            <p className="form-help-text">Required for H1B employees. Rate must meet prevailing wage.</p>
          </div>

          {formData.is_lca_project && (
            <div className="form-group">
              <label htmlFor="lca_rate">
                LCA Rate ($) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="lca_rate"
                name="lca_rate"
                value={formData.lca_rate}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={validationErrors.lca_rate ? 'error' : ''}
                required={formData.is_lca_project}
              />
              {validationErrors.lca_rate && (
                <span className="error-message">{validationErrors.lca_rate}</span>
              )}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Status</h2>
          <div className="form-group">
            <label htmlFor="project_status">Project Status</label>
            <select
              id="project_status"
              name="project_status"
              value={formData.project_status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <Link to="/hrms/projects" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProjectForm
