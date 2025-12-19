import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  PencilIcon,
  BuildingLibraryIcon,
  UserIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './ProjectDetail.css'

/**
 * ProjectDetail - Project detail view with tabs
 * URL: /hrms/projects/:projectId
 * Based on UI_DESIGN_DOCS/08_EMPLOYEE_PROJECTS.md
 */
function ProjectDetail({ testMode = false }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const [loading, setLoading] = useState(!testMode)
  const [error, setError] = useState(null)
  const [project, setProject] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [vendorChain, setVendorChain] = useState([])
  const [rateHistory, setRateHistory] = useState([])

  useEffect(() => {
    if (testMode) {
      setProject({
        project_id: 'project-001',
        project_name: 'Acme Corp - Software Developer',
        project_code: 'PRJ-2025-001',
        project_status: 'active',
        project_start_date: '2025-01-15',
        project_end_date: '2025-12-31',
        actual_client_bill_rate: 85.00,
        rate_paid_to_candidate: 68.00,
        candidate_percentage: 80,
        lca_rate: 75.00,
        vms_charges: 2.50,
        is_lca_project: true,
        end_client_name: 'Acme Corporation',
        end_client_manager_name: 'Jane Wilson',
        end_client_manager_email: 'jane.wilson@acme.com',
        end_client_manager_phone: '+1 (555) 100-2000',
        work_location_type: 'hybrid',
        employee: {
          employee_id: 'emp-001',
          first_name: 'John',
          last_name: 'Smith',
          employee_code: 'IES00012',
          employee_type: 'it_usa',
          email: 'john.smith@company.com',
        },
      })
      setVendorChain([
        { vendor_level: 4, vendor_name: 'Infosol Inc', vendor_hr_email: 'hr@infosol.com' },
        { vendor_level: 3, vendor_name: 'ATVS Corp' },
        { vendor_level: 2, vendor_name: 'Natsoft' },
        { vendor_level: 1, vendor_name: 'Tech Mahindra' },
      ])
      setRateHistory([
        {
          rate_history_id: 'rate-001',
          effective_from_date: '2025-03-01',
          effective_to_date: null,
          actual_client_bill_rate: 78.00,
          rate_paid_to_candidate: 62.40,
          change_reason: 'Client Reduction',
          is_current_rate: true,
        },
        {
          rate_history_id: 'rate-002',
          effective_from_date: '2025-01-01',
          effective_to_date: '2025-02-28',
          actual_client_bill_rate: 85.00,
          rate_paid_to_candidate: 68.00,
          change_reason: 'Initial Rate',
          is_current_rate: false,
        },
      ])
      setLoading(false)
      return
    }

    if (projectId && tenant?.tenant_id) {
      fetchProject()
      fetchVendorChain()
      fetchRateHistory()
    }
  }, [projectId, tenant?.tenant_id, testMode])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('hrms_projects')
        .select(`
          *,
          employee:hrms_employees!hrms_projects_employee_id_fkey(
            employee_id,
            first_name,
            last_name,
            employee_code,
            employee_type,
            email
          )
        `)
        .eq('project_id', projectId)
        .eq('tenant_id', tenant.tenant_id)
        .single()

      if (fetchError) throw fetchError
      setProject(data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching project:', err)
      setError(err.message || 'Failed to load project')
      setLoading(false)
    }
  }

  const fetchVendorChain = async () => {
    try {
      const { data, error } = await supabase
        .from('hrms_project_vendors')
        .select('*')
        .eq('project_id', projectId)
        .eq('tenant_id', tenant.tenant_id)
        .order('vendor_level', { ascending: false })

      if (error) throw error
      setVendorChain(data || [])
    } catch (err) {
      console.error('Error fetching vendor chain:', err)
    }
  }

  const fetchRateHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('hrms_project_rate_history')
        .select('*')
        .eq('project_id', projectId)
        .eq('tenant_id', tenant.tenant_id)
        .order('effective_from_date', { ascending: false })

      if (error) throw error
      setRateHistory(data || [])
    } catch (err) {
      console.error('Error fetching rate history:', err)
    }
  }

  const formatCurrency = (amount) => {
    if (!amount) return '-'
    return `$${parseFloat(amount).toFixed(2)}/hr`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const calculateMargin = () => {
    if (!project?.actual_client_bill_rate || !project?.rate_paid_to_candidate) return null
    const margin = project.actual_client_bill_rate - project.rate_paid_to_candidate
    const marginPercent = (margin / project.actual_client_bill_rate) * 100
    return { margin, marginPercent }
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading project..." data-testid="loading-spinner" />
  }

  if (error) {
    return (
      <div className="project-detail-container">
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchProject}>Retry</button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="project-detail-container">
        <p>Project not found</p>
        <Link to="/hrms/projects">Back to Projects</Link>
      </div>
    )
  }

  const margin = calculateMargin()
  const statusColors = {
    active: { bg: '#D1FAE5', text: '#065F46' },
    completed: { bg: '#DBEAFE', text: '#1E40AF' },
    on_hold: { bg: '#FEF3C7', text: '#92400E' },
    cancelled: { bg: '#FEE2E2', text: '#991B1B' },
  }

  return (
    <div className="project-detail-container">
      <Link to="/hrms/projects" className="back-link">
        <ArrowLeftIcon className="icon-sm" />
        Back to Projects
      </Link>

      {/* Project Header */}
      <div className="project-header">
        <div className="project-header-content">
          <BriefcaseIcon className="project-icon-large" />
          <div>
            <h1 className="project-name-title">{project.project_name}</h1>
            <div className="project-meta">
              <span>{project.project_code}</span>
              <span>•</span>
              <span
                className="status-badge"
                style={{
                  backgroundColor: statusColors[project.project_status]?.bg || '#F3F4F6',
                  color: statusColors[project.project_status]?.text || '#374151',
                }}
              >
                {project.project_status === 'active' ? 'Active' :
                 project.project_status === 'completed' ? 'Completed' :
                 project.project_status === 'on_hold' ? 'On Hold' : 'Cancelled'}
              </span>
              {project.is_lca_project && (
                <>
                  <span>•</span>
                  <span className="lca-badge-header">
                    <BuildingLibraryIcon className="lca-icon" />
                    LCA Project
                  </span>
                </>
              )}
            </div>
            <div className="project-employee-info">
              <UserIcon className="icon-xs" />
              <span>
                {project.employee?.first_name} {project.employee?.last_name} ({project.employee?.employee_code})
              </span>
              {project.work_location_type && (
                <>
                  <span>•</span>
                  <MapPinIcon className="icon-xs" />
                  <span className="capitalize">{project.work_location_type}</span>
                </>
              )}
            </div>
            <div className="project-dates">
              <span>Started: {formatDate(project.project_start_date)}</span>
              {project.project_end_date && (
                <>
                  <span>•</span>
                  <span>End: {formatDate(project.project_end_date)}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="project-header-actions">
          <Link to={`/hrms/projects/${projectId}/edit`} className="btn btn-secondary">
            <PencilIcon className="icon-sm" />
            Edit
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="project-tabs">
        <button
          type="button"
          className={`project-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          className={`project-tab ${activeTab === 'vendor-chain' ? 'active' : ''}`}
          onClick={() => setActiveTab('vendor-chain')}
        >
          Vendor Chain ({vendorChain.length})
        </button>
        <button
          type="button"
          className={`project-tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
        <button
          type="button"
          className={`project-tab ${activeTab === 'rate-history' ? 'active' : ''}`}
          onClick={() => setActiveTab('rate-history')}
        >
          Rate History
        </button>
        <button
          type="button"
          className={`project-tab ${activeTab === 'resumes' ? 'active' : ''}`}
          onClick={() => setActiveTab('resumes')}
        >
          Resumes
        </button>
        <button
          type="button"
          className={`project-tab ${activeTab === 'background-checks' ? 'active' : ''}`}
          onClick={() => setActiveTab('background-checks')}
        >
          Background Checks
        </button>
      </div>

      {/* Tab Content */}
      <div className="project-tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="overview-card">
                <h3>Project Financials</h3>
                <div className="financial-item">
                  <span className="financial-label">Bill Rate:</span>
                  <span className="financial-value">{formatCurrency(project.actual_client_bill_rate)}</span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">Pay Rate:</span>
                  <span className="financial-value">{formatCurrency(project.rate_paid_to_candidate)}</span>
                </div>
                {margin && (
                  <div className="financial-item">
                    <span className="financial-label">Margin:</span>
                    <span className="financial-value">
                      {formatCurrency(margin.margin)} ({margin.marginPercent.toFixed(1)}%)
                    </span>
                  </div>
                )}
                {project.is_lca_project && (
                  <div className="financial-item">
                    <span className="financial-label">LCA Rate:</span>
                    <span className="financial-value">{formatCurrency(project.lca_rate)}</span>
                  </div>
                )}
              </div>

              <div className="overview-card">
                <h3>End Client</h3>
                <div className="client-info">
                  <div className="client-name">{project.end_client_name}</div>
                  {project.end_client_manager_name && (
                    <div className="client-manager">
                      <span>Manager: {project.end_client_manager_name}</span>
                      {project.end_client_manager_email && (
                        <span>{project.end_client_manager_email}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vendor-chain' && (
          <div className="vendor-chain-tab">
            <h3>Vendor Chain ({vendorChain.length} vendors)</h3>
            {vendorChain.length === 0 ? (
              <p>No vendors in chain</p>
            ) : (
              <div className="vendor-chain-visual">
                {vendorChain.map((vendor, index) => (
                  <div key={vendor.vendor_entry_id || index} className="vendor-chain-item">
                    <div className="vendor-chain-card">
                      <div className="vendor-level-badge">Vendor {vendor.vendor_level}</div>
                      <div className="vendor-name">{vendor.vendor_name}</div>
                      {vendor.vendor_hr_email && (
                        <div className="vendor-contact">{vendor.vendor_hr_email}</div>
                      )}
                    </div>
                    {index < vendorChain.length - 1 && <div className="vendor-chain-arrow">↓</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'rate-history' && (
          <div className="rate-history-tab">
            <h3>Rate History</h3>
            {rateHistory.length === 0 ? (
              <p>No rate history available</p>
            ) : (
              <div className="rate-history-list">
                {rateHistory.map((rate) => (
                  <div key={rate.rate_history_id} className={`rate-history-item ${rate.is_current_rate ? 'current' : ''}`}>
                    <div className="rate-history-header">
                      <span className="rate-value">{formatCurrency(rate.actual_client_bill_rate)}</span>
                      {rate.is_current_rate && <span className="current-badge">Current</span>}
                    </div>
                    <div className="rate-history-details">
                      <span>Effective: {formatDate(rate.effective_from_date)}</span>
                      {rate.effective_to_date && (
                        <span>to {formatDate(rate.effective_to_date)}</span>
                      )}
                      {rate.change_reason && (
                        <span>• Reason: {rate.change_reason}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="documents-tab">
            <h3>Project Documents</h3>
            <p>Document management coming soon...</p>
          </div>
        )}

        {activeTab === 'resumes' && (
          <div className="resumes-tab">
            <h3>Resumes</h3>
            <p>Resume management coming soon...</p>
          </div>
        )}

        {activeTab === 'background-checks' && (
          <div className="background-checks-tab">
            <h3>Background Checks</h3>
            <p>Background check management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectDetail
