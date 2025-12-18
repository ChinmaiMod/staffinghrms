import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTenant } from '../../../contexts/TenantProvider'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import {
  ArrowLeftIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ClockIcon,
  IdentificationIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  ArrowDownTrayIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  StarIcon,
  ArrowPathIcon,
  UserIcon,
  BuildingOfficeIcon,
  GlobeAmericasIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid'
import './EmployeeDetail.css'

// Employee type configuration
const EMPLOYEE_TYPES = {
  internal_india: { label: 'Internal India', bgColor: '#EDE9FE', textColor: '#5B21B6', icon: '🇮🇳' },
  internal_usa: { label: 'Internal USA', bgColor: '#DBEAFE', textColor: '#1E40AF', icon: '🇺🇸' },
  it_usa: { label: 'IT USA', bgColor: '#D1FAE5', textColor: '#065F46', icon: '💻' },
  nonit_usa: { label: 'Non-IT USA', bgColor: '#FFEDD5', textColor: '#9A3412', icon: '🏢' },
  healthcare_usa: { label: 'Healthcare USA', bgColor: '#FCE7F3', textColor: '#9D174D', icon: '🏥' }
}

// Status configuration
const STATUS_CONFIG = {
  active: { label: 'Active', bgColor: '#D1FAE5', textColor: '#065F46', dotColor: '#10B981' },
  inactive: { label: 'Inactive', bgColor: '#F3F4F6', textColor: '#374151', dotColor: '#6B7280' },
  on_leave: { label: 'On Leave', bgColor: '#FEF3C7', textColor: '#92400E', dotColor: '#F59E0B' },
  terminated: { label: 'Terminated', bgColor: '#FEE2E2', textColor: '#991B1B', dotColor: '#EF4444' }
}

// Document status configuration
const DOC_STATUS = {
  valid: { icon: CheckCircleIcon, color: '#10B981', label: 'Valid' },
  expiring: { icon: ExclamationTriangleIcon, color: '#F59E0B', label: 'Expiring Soon' },
  expired: { icon: XCircleIcon, color: '#EF4444', label: 'Expired' },
  missing_required: { icon: ExclamationCircleIcon, color: '#EF4444', label: 'Missing (Required)' },
  missing_optional: { icon: MinusCircleIcon, color: '#6B7280', label: 'Missing (Optional)' },
  pending: { icon: ClockIcon, color: '#3B82F6', label: 'Pending Review' }
}

// Review status configuration
const REVIEW_STATUS = {
  draft: { label: 'Draft', bgColor: '#F3F4F6', textColor: '#374151', borderColor: '#D1D5DB' },
  in_progress: { label: 'In Progress', bgColor: '#FEF3C7', textColor: '#92400E', borderColor: '#FCD34D' },
  pending_acknowledgment: { label: 'Pending Acknowledgment', bgColor: '#DBEAFE', textColor: '#1E40AF', borderColor: '#93C5FD' },
  completed: { label: 'Completed', bgColor: '#D1FAE5', textColor: '#065F46', borderColor: '#6EE7B7' }
}

// Tab configuration
const TABS = [
  { id: 'overview', label: 'Overview', icon: UserIcon },
  { id: 'documents', label: 'Documents', icon: DocumentTextIcon },
  { id: 'projects', label: 'Projects', icon: BriefcaseIcon },
  { id: 'timesheets', label: 'Timesheets', icon: ClockIcon },
  { id: 'visa', label: 'Visa & Immigration', icon: IdentificationIcon },
  { id: 'performance', label: 'Performance Reviews', icon: ChartBarIcon },
  { id: 'notes', label: 'Notes', icon: ChatBubbleLeftRightIcon }
]

// Sub-components
function EmployeeTypeBadge({ type }) {
  const config = EMPLOYEE_TYPES[type] || EMPLOYEE_TYPES.it_usa
  return (
    <span 
      className="employee-type-badge"
      style={{ backgroundColor: config.bgColor, color: config.textColor }}
    >
      <span className="type-icon">{config.icon}</span>
      {config.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.active
  return (
    <span 
      className="status-badge"
      style={{ backgroundColor: config.bgColor, color: config.textColor }}
    >
      <span className="status-dot" style={{ backgroundColor: config.dotColor }} />
      {config.label}
    </span>
  )
}

function ReviewStatusBadge({ status }) {
  const config = REVIEW_STATUS[status] || REVIEW_STATUS.draft
  return (
    <span 
      className="review-status-badge"
      style={{ 
        backgroundColor: config.bgColor, 
        color: config.textColor,
        borderColor: config.borderColor 
      }}
    >
      {config.label}
    </span>
  )
}

function QuickStatCard({ icon: Icon, label, value, subtext, variant = 'default' }) {
  const variantClasses = {
    default: 'stat-card-default',
    success: 'stat-card-success',
    warning: 'stat-card-warning',
    danger: 'stat-card-danger'
  }
  
  return (
    <div className={`quick-stat-card ${variantClasses[variant]}`}>
      <div className="stat-icon">
        <Icon className="icon-md" />
      </div>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {subtext && <span className="stat-subtext">{subtext}</span>}
      </div>
    </div>
  )
}

function InfoField({ label, value, masked = false, onToggleMask, showMask = false }) {
  const [isRevealed, setIsRevealed] = useState(false)
  
  const displayValue = masked && !isRevealed ? '●●●-●●-' + (value?.slice(-4) || '****') : value
  
  const handleToggle = () => {
    setIsRevealed(!isRevealed)
    if (!isRevealed) {
      setTimeout(() => setIsRevealed(false), 10000) // Auto-hide after 10 seconds
    }
  }
  
  return (
    <div className="info-field">
      <span className="info-label">{label}</span>
      <div className="info-value-wrapper">
        <span className="info-value">{displayValue || '—'}</span>
        {masked && value && (
          <button className="mask-toggle" onClick={handleToggle} aria-label={isRevealed ? 'Hide' : 'Show'}>
            {isRevealed ? <EyeSlashIcon className="icon-sm" /> : <EyeIcon className="icon-sm" />}
          </button>
        )}
      </div>
    </div>
  )
}

function DocumentItem({ document, onView, onDownload }) {
  const getStatusConfig = (doc) => {
    if (!doc.uploaded) return doc.required ? DOC_STATUS.missing_required : DOC_STATUS.missing_optional
    if (doc.status === 'pending') return DOC_STATUS.pending
    if (doc.expiry_date) {
      const daysUntilExpiry = Math.floor((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
      if (daysUntilExpiry < 0) return DOC_STATUS.expired
      if (daysUntilExpiry <= 30) return DOC_STATUS.expiring
    }
    return DOC_STATUS.valid
  }
  
  const status = getStatusConfig(document)
  const StatusIcon = status.icon
  
  return (
    <div className={`document-item ${!document.uploaded ? 'document-missing' : ''}`}>
      <div className="document-status-icon" style={{ color: status.color }}>
        <StatusIcon className="icon-md" />
      </div>
      <div className="document-info">
        <span className="document-name">{document.name}</span>
        {document.uploaded ? (
          <span className="document-meta">
            v{document.version || '1.0'} • {document.file_type || 'PDF'} • {document.file_size || 'N/A'}
          </span>
        ) : (
          <span className="document-missing-text">
            {document.required ? 'Missing - Required' : 'Not uploaded (Optional)'}
          </span>
        )}
      </div>
      <div className="document-dates">
        {document.uploaded ? (
          <>
            <span className="document-uploaded">Uploaded: {document.uploaded_date}</span>
            {document.expiry_date && (
              <span className={`document-expiry ${status === DOC_STATUS.expiring || status === DOC_STATUS.expired ? 'expiry-warning' : ''}`}>
                Expires: {document.expiry_date}
              </span>
            )}
          </>
        ) : null}
      </div>
      <div className="document-actions">
        {document.uploaded ? (
          <>
            <button className="doc-action-btn" onClick={() => onView?.(document)} title="View">
              <EyeIcon className="icon-sm" />
            </button>
            <button className="doc-action-btn" onClick={() => onDownload?.(document)} title="Download">
              <ArrowDownTrayIcon className="icon-sm" />
            </button>
            <button className="doc-action-btn" title="More">
              <EllipsisHorizontalIcon className="icon-sm" />
            </button>
          </>
        ) : (
          <button className="upload-btn">
            <PlusIcon className="icon-sm" />
            Upload Now
          </button>
        )}
      </div>
    </div>
  )
}

function DocumentGroup({ title, documents, expanded = true, onToggle }) {
  return (
    <div className={`document-group ${expanded ? 'expanded' : 'collapsed'}`}>
      <button className="document-group-header" onClick={onToggle}>
        <span className="group-icon">📁</span>
        <span className="group-title">{title}</span>
        <span className={`group-chevron ${expanded ? 'rotated' : ''}`}>▼</span>
      </button>
      {expanded && (
        <div className="document-group-items">
          {documents.map((doc, idx) => (
            <DocumentItem key={idx} document={doc} />
          ))}
        </div>
      )}
    </div>
  )
}

function StarRating({ rating, maxRating = 5 }) {
  return (
    <div className="star-rating">
      {Array.from({ length: maxRating }).map((_, idx) => (
        <span key={idx} className="star">
          {idx < Math.floor(rating) ? (
            <StarSolid className="icon-md star-filled" />
          ) : idx < rating ? (
            <StarSolid className="icon-md star-half" />
          ) : (
            <StarIcon className="icon-md star-empty" />
          )}
        </span>
      ))}
      <span className="rating-value">{rating.toFixed(1)}/{maxRating}.0</span>
    </div>
  )
}

function PerformanceReviewCard({ review, isActive = false }) {
  const statusIcon = review.status === 'completed' ? CheckCircleSolid : ArrowPathIcon
  
  return (
    <div className={`review-card ${isActive ? 'review-active' : ''}`}>
      <div className="review-header">
        <div className="review-title-row">
          <statusIcon className={`icon-md ${review.status === 'completed' ? 'text-success' : 'text-warning'}`} />
          <h4 className="review-title">{review.title}</h4>
          <ReviewStatusBadge status={review.status} />
        </div>
        {review.rating && <StarRating rating={review.rating} />}
      </div>
      <div className="review-details">
        <p className="review-period">Review Period: {review.period_start} - {review.period_end}</p>
        <p className="review-reviewer">Reviewer: {review.reviewer} • {review.status === 'completed' ? `Completed: ${review.completed_date}` : 'In Progress'}</p>
        {review.summary && <p className="review-summary">{review.summary}</p>}
        {review.document && (
          <p className="review-document">📄 {review.document}</p>
        )}
      </div>
      <div className="review-actions">
        {isActive ? (
          <>
            <button className="btn-primary btn-sm">Complete Manager Review</button>
            <button className="btn-secondary btn-sm">View Self-Assessment</button>
          </>
        ) : (
          <>
            <button className="btn-secondary btn-sm">
              <EyeIcon className="icon-sm" /> View Full Review
            </button>
            <button className="btn-secondary btn-sm">
              <ArrowDownTrayIcon className="icon-sm" /> Download
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function AddressCard({ addresses }) {
  return (
    <div className="info-card">
      <div className="card-header">
        <h3>Address History</h3>
        <button className="btn-secondary btn-sm">
          <PlusIcon className="icon-sm" /> Add Address
        </button>
      </div>
      <div className="address-list">
        {addresses.map((addr, idx) => (
          <div key={idx} className={`address-item ${addr.is_current ? 'address-current' : ''}`}>
            <div className="address-header">
              {addr.is_current && <span className="current-badge">CURRENT</span>}
              <span className="address-dates">
                {addr.is_current ? `Since: ${addr.valid_from}` : `${addr.valid_from} - ${addr.valid_to}`}
              </span>
            </div>
            <div className="address-content">
              <p className="address-street">{addr.street_address_1}</p>
              {addr.street_address_2 && <p className="address-street2">{addr.street_address_2}</p>}
              <p className="address-city">{addr.city}, {addr.state} {addr.postal_code}</p>
              <p className="address-country">{addr.country}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProjectCard({ project }) {
  return (
    <div className="project-card">
      <div className="project-header">
        <h4 className="project-name">{project.name}</h4>
        <StatusBadge status={project.status} />
      </div>
      <div className="project-details">
        <p className="project-client">
          <BuildingOfficeIcon className="icon-sm" /> {project.client}
        </p>
        <p className="project-dates">
          <CalendarIcon className="icon-sm" /> {project.start_date} - {project.end_date || 'Present'}
        </p>
        <p className="project-location">
          <MapPinIcon className="icon-sm" /> {project.location} ({project.work_type})
        </p>
        <p className="project-rate">
          Bill Rate: ${project.bill_rate}/hr • Pay Rate: ${project.pay_rate}/hr
        </p>
      </div>
      {project.is_lca && (
        <div className="project-lca-badge">
          <GlobeAmericasIcon className="icon-sm" /> LCA Project
        </div>
      )}
    </div>
  )
}

function NoteItem({ note }) {
  return (
    <div className="note-item">
      <div className="note-header">
        <span className="note-author">{note.author}</span>
        <span className="note-date">{note.date}</span>
      </div>
      <p className="note-content">{note.content}</p>
      {note.category && <span className="note-category">{note.category}</span>}
    </div>
  )
}

/**
 * Employee Detail - Individual employee view with 7 tabs
 * Based on UI_DESIGN_DOCS/05_EMPLOYEE_MANAGEMENT.md Section 2
 */
function EmployeeDetail({ testMode = false } = {}) {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const { tenant, selectedBusiness } = useTenant()
  const [loading, setLoading] = useState(true)
  const [employee, setEmployee] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedDocGroups, setExpandedDocGroups] = useState({ immigration: true, educational: false })

  // Mock employee data for development
  const mockEmployee = useMemo(() => ({
    id: employeeId,
    employee_code: 'IES00012',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@company.com',
    phone: '+1 (555) 123-4567',
    date_of_birth: '1990-01-15',
    ssn: '123-45-6789',
    employee_type: 'it_usa',
    employment_status: 'active',
    start_date: '2024-01-15',
    department: 'Engineering',
    job_title: 'Senior React Developer',
    lca_job_title: 'Software Developer',
    manager: 'Sarah Johnson',
    avatar_url: null,
    
    // Quick stats
    active_projects: 2,
    documents_count: 8,
    documents_total: 12,
    compliance_score: 85,
    performance_rating: 4.2,
    
    // Addresses
    addresses: [
      {
        is_current: true,
        street_address_1: '123 Main Street, Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94102',
        country: 'United States',
        valid_from: 'Jan 2024'
      },
      {
        is_current: false,
        street_address_1: '456 Oak Avenue',
        city: 'Los Angeles',
        state: 'CA',
        postal_code: '90001',
        country: 'United States',
        valid_from: 'Jun 2022',
        valid_to: 'Dec 2023'
      }
    ],
    
    // Documents
    documents: {
      immigration: [
        { name: 'H1B Visa Copy', uploaded: true, version: '2.0', file_type: 'PDF', file_size: '2.3 MB', uploaded_date: 'Dec 1, 2024', expiry_date: 'Dec 20, 2025', required: true },
        { name: 'I-94', uploaded: true, version: '1.0', file_type: 'PDF', file_size: '1.1 MB', uploaded_date: 'Dec 1, 2024', expiry_date: 'Mar 15, 2026', required: true },
        { name: 'I-797 Approval Notice', uploaded: false, required: true },
        { name: 'Passport', uploaded: true, version: '1.0', file_type: 'PDF', file_size: '3.5 MB', uploaded_date: 'Dec 1, 2024', expiry_date: 'Jun 2028', status: 'pending', required: true }
      ],
      educational: [
        { name: "Bachelor's Degree", uploaded: true, version: '1.0', file_type: 'PDF', file_size: '1.2 MB', uploaded_date: 'Jan 15, 2024', required: true },
        { name: "Master's Degree", uploaded: false, required: false }
      ]
    },
    
    // Projects
    projects: [
      { name: 'Acme Corp - Senior Developer', client: 'Acme Corporation', status: 'active', start_date: 'Jan 15, 2024', location: 'San Francisco, CA', work_type: 'Hybrid', bill_rate: 85, pay_rate: 68, is_lca: true },
      { name: 'TechStart - React Migration', client: 'TechStart Inc', status: 'active', start_date: 'Mar 1, 2024', location: 'Remote', work_type: 'Remote', bill_rate: 90, pay_rate: 72, is_lca: false }
    ],
    
    // Timesheets
    timesheets: [
      { period: 'Dec 1-15, 2024', project: 'Acme Corp', hours: 80, status: 'approved', submitted: 'Dec 16, 2024' },
      { period: 'Nov 16-30, 2024', project: 'Acme Corp', hours: 76, status: 'approved', submitted: 'Dec 1, 2024' },
      { period: 'Nov 1-15, 2024', project: 'TechStart', hours: 80, status: 'approved', submitted: 'Nov 16, 2024' }
    ],
    
    // Visa status
    visa: {
      current_status: 'H1B',
      receipt_number: 'WAC-123-456-789',
      petition_number: 'PET-001',
      valid_from: 'Jan 1, 2024',
      valid_until: 'Dec 31, 2026',
      employer: 'Intuites LLC',
      lca_case_number: 'LCA-2024-001'
    },
    
    // Performance reviews
    reviews: [
      { 
        title: '2025 Annual Performance Review', 
        status: 'in_progress', 
        period_start: 'January 1, 2025', 
        period_end: 'December 31, 2025',
        reviewer: 'Sarah Johnson (Engineering Manager)'
      },
      { 
        title: '2024 Annual Performance Review', 
        status: 'completed', 
        rating: 4.2,
        period_start: 'Jan 1, 2024', 
        period_end: 'Dec 31, 2024',
        reviewer: 'Sarah Johnson',
        completed_date: 'Jan 15, 2025',
        summary: 'Exceeded expectations in technical delivery and mentorship. Successfully led microservices migration project.',
        document: 'Annual_Review_2024_JSmith.pdf'
      },
      { 
        title: '2024 Mid-Year Review', 
        status: 'completed', 
        rating: 4.0,
        period_start: 'Jan 1, 2024', 
        period_end: 'Jun 30, 2024',
        reviewer: 'Sarah Johnson',
        completed_date: 'Jul 20, 2024',
        summary: 'On track with goals. Strong collaboration with team members.',
        document: 'MidYear_Review_2024_JSmith.pdf'
      }
    ],
    
    // Notes
    notes: [
      { author: 'Sarah Johnson', date: 'Dec 10, 2024', content: 'Discussed career path and interest in technical lead role.', category: 'Career Development' },
      { author: 'HR Admin', date: 'Nov 15, 2024', content: 'Completed benefits enrollment for 2025.', category: 'Benefits' },
      { author: 'Immigration Team', date: 'Oct 1, 2024', content: 'H1B extension filed. Receipt received.', category: 'Immigration' }
    ]
  }), [employeeId])


  useEffect(() => {
    if (testMode) {
      setEmployee(mockEmployee)
      setLoading(false)
      setError(null)
      return
    }
    fetchEmployee()
  }, [employeeId, testMode])

  const fetchEmployee = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual Supabase query
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setEmployee(mockEmployee)
    } catch (err) {
      console.error('Error fetching employee:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleDocGroup = (groupId) => {
    setExpandedDocGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const getComplianceVariant = (score) => {
    if (score >= 90) return 'success'
    if (score >= 70) return 'warning'
    return 'danger'
  }

  const calculateAge = (dob) => {
    if (!dob) return null
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return <LoadingSpinner message="Loading employee details..." />
  }

  if (error) {
    return (
      <div className="employee-detail-error">
        <h2>Error Loading Employee</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={fetchEmployee} className="btn-primary">Retry</button>
          <button onClick={() => navigate('/hrms/employees')} className="btn-secondary">
            Back to Employees
          </button>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="employee-detail-not-found">
        <h2>Employee Not Found</h2>
        <p>The employee you're looking for doesn't exist or you don't have permission to view it.</p>
        <button onClick={() => navigate('/hrms/employees')} className="btn-primary">
          Back to Employees
        </button>
      </div>
    )
  }

  const age = calculateAge(employee.date_of_birth)

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="tab-content-overview">
            <div className="info-card">
              <h3>Personal Information</h3>
              <div className="info-grid">
                <InfoField label="Full Name" value={`${employee.first_name} ${employee.last_name}`} />
                <InfoField label="Date of Birth" value={employee.date_of_birth ? `${new Date(employee.date_of_birth).toLocaleDateString()} (Age: ${age})` : null} />
                <InfoField label="Email" value={employee.email} />
                <InfoField label="Phone" value={employee.phone} />
                <InfoField label="SSN" value={employee.ssn} masked />
                <InfoField label="Employee Code" value={employee.employee_code} />
                <InfoField label="Department" value={employee.department} />
                <InfoField label="Working Title" value={employee.job_title} />
                <InfoField label="LCA Job Title" value={employee.lca_job_title} />
                <InfoField label="Reports To" value={employee.manager} />
                <InfoField label="Start Date" value={employee.start_date} />
                <InfoField label="Employee Type" value={EMPLOYEE_TYPES[employee.employee_type]?.label} />
              </div>
            </div>
            <AddressCard addresses={employee.addresses} />
          </div>
        )
      
      case 'documents':
        return (
          <div className="tab-content-documents">
            <div className="documents-header">
              <div className="checklist-info">
                <span className="checklist-name">Checklist: IT USA Immigration Documents</span>
                <span className="checklist-progress">Progress: {employee.documents_count}/{employee.documents_total}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(employee.documents_count / employee.documents_total) * 100}%` }}
                />
              </div>
              <span className="progress-percent">{Math.round((employee.documents_count / employee.documents_total) * 100)}%</span>
            </div>
            <div className="document-groups">
              <DocumentGroup 
                title="Immigration Documents" 
                documents={employee.documents.immigration}
                expanded={expandedDocGroups.immigration}
                onToggle={() => toggleDocGroup('immigration')}
              />
              <DocumentGroup 
                title="Educational Documents" 
                documents={employee.documents.educational}
                expanded={expandedDocGroups.educational}
                onToggle={() => toggleDocGroup('educational')}
              />
            </div>
          </div>
        )
      
      case 'projects':
        return (
          <div className="tab-content-projects">
            <div className="projects-header">
              <h3>Active Projects ({employee.projects.filter(p => p.status === 'active').length})</h3>
              <button className="btn-primary btn-sm">
                <PlusIcon className="icon-sm" /> Assign to Project
              </button>
            </div>
            <div className="projects-grid">
              {employee.projects.map((project, idx) => (
                <ProjectCard key={idx} project={project} />
              ))}
            </div>
          </div>
        )
      
      case 'timesheets':
        return (
          <div className="tab-content-timesheets">
            <div className="timesheets-header">
              <h3>Recent Timesheets</h3>
              <button className="btn-primary btn-sm">
                <PlusIcon className="icon-sm" /> Submit Timesheet
              </button>
            </div>
            <table className="timesheets-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Project</th>
                  <th>Hours</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employee.timesheets.map((ts, idx) => (
                  <tr key={idx}>
                    <td>{ts.period}</td>
                    <td>{ts.project}</td>
                    <td>{ts.hours}</td>
                    <td>{ts.submitted}</td>
                    <td><StatusBadge status={ts.status === 'approved' ? 'active' : 'on_leave'} /></td>
                    <td>
                      <button className="btn-secondary btn-xs">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      
      case 'visa':
        return (
          <div className="tab-content-visa">
            <div className="info-card">
              <h3>Current Visa Status</h3>
              <div className="visa-status-badge">
                <IdentificationIcon className="icon-lg" />
                <span className="visa-type">{employee.visa.current_status}</span>
              </div>
              <div className="info-grid">
                <InfoField label="Receipt Number" value={employee.visa.receipt_number} />
                <InfoField label="Petition Number" value={employee.visa.petition_number} />
                <InfoField label="Valid From" value={employee.visa.valid_from} />
                <InfoField label="Valid Until" value={employee.visa.valid_until} />
                <InfoField label="Sponsoring Employer" value={employee.visa.employer} />
                <InfoField label="LCA Case Number" value={employee.visa.lca_case_number} />
              </div>
            </div>
          </div>
        )
      
      case 'performance':
        return (
          <div className="tab-content-performance">
            <div className="performance-header">
              <div>
                <p className="employee-info">Employee: {employee.first_name} {employee.last_name} ({employee.employee_code}) • {EMPLOYEE_TYPES[employee.employee_type]?.label}</p>
                <p className="current-project">Current Project: {employee.projects[0]?.name}</p>
              </div>
              <button className="btn-primary btn-sm">
                <PlusIcon className="icon-sm" /> Start Review
              </button>
            </div>
            
            {employee.reviews.filter(r => r.status !== 'completed').length > 0 && (
              <div className="reviews-section">
                <h4 className="section-title">ACTIVE REVIEW</h4>
                {employee.reviews.filter(r => r.status !== 'completed').map((review, idx) => (
                  <PerformanceReviewCard key={idx} review={review} isActive />
                ))}
              </div>
            )}
            
            <div className="reviews-section">
              <h4 className="section-title">COMPLETED REVIEWS</h4>
              {employee.reviews.filter(r => r.status === 'completed').map((review, idx) => (
                <PerformanceReviewCard key={idx} review={review} />
              ))}
            </div>
          </div>
        )
      
      case 'notes':
        return (
          <div className="tab-content-notes">
            <div className="notes-header">
              <h3>Notes & Comments</h3>
              <button className="btn-primary btn-sm">
                <PlusIcon className="icon-sm" /> Add Note
              </button>
            </div>
            <div className="notes-list">
              {employee.notes.map((note, idx) => (
                <NoteItem key={idx} note={note} />
              ))}
            </div>
          </div>
        )
      
      default:
        return <div>Tab content not available</div>
    }
  }

  return (
    <div className="employee-detail-container">
      {/* Breadcrumb and Actions Header */}
      <div className="employee-detail-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/hrms/employees')}>
            <ArrowLeftIcon className="icon-md" />
            <span>Back to Employees</span>
          </button>
        </div>
        <div className="header-actions">
          <Link to={`/hrms/employees/${employeeId}/edit`} className="btn-primary">
            <PencilIcon className="icon-sm" />
            Edit Employee
          </Link>
        </div>
      </div>

      {/* Employee Header Card */}
      <div className="employee-header-card">
        <div className="header-main">
          <div className="employee-avatar">
            {employee.avatar_url ? (
              <img src={employee.avatar_url} alt={`${employee.first_name} ${employee.last_name}`} />
            ) : (
              <span className="avatar-initials">
                {employee.first_name[0]}{employee.last_name[0]}
              </span>
            )}
          </div>
          <div className="employee-info">
            <h1 className="employee-name">{employee.first_name} {employee.last_name}</h1>
            <p className="employee-code">{employee.employee_code}</p>
            <div className="employee-badges">
              <EmployeeTypeBadge type={employee.employee_type} />
              <StatusBadge status={employee.employment_status} />
            </div>
          </div>
          <div className="employee-contact">
            <a href={`mailto:${employee.email}`} className="contact-item">
              <EnvelopeIcon className="icon-sm" />
              {employee.email}
            </a>
            <a href={`tel:${employee.phone}`} className="contact-item">
              <PhoneIcon className="icon-sm" />
              {employee.phone}
            </a>
            <span className="contact-item">
              <CalendarIcon className="icon-sm" />
              Started: {employee.start_date}
            </span>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="quick-stats">
          <QuickStatCard 
            icon={BriefcaseIcon} 
            label="Active Projects" 
            value={employee.active_projects}
          />
          <QuickStatCard 
            icon={DocumentTextIcon} 
            label="Documents" 
            value={`${employee.documents_count}/${employee.documents_total}`}
          />
          <QuickStatCard 
            icon={CheckCircleIcon} 
            label="Compliance" 
            value={`${employee.compliance_score}%`}
            variant={getComplianceVariant(employee.compliance_score)}
          />
          <QuickStatCard 
            icon={ChartBarIcon} 
            label="Performance" 
            value={employee.performance_rating.toFixed(1)}
            subtext="out of 5.0"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {TABS.map(tab => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <TabIcon className="icon-sm" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default EmployeeDetail
