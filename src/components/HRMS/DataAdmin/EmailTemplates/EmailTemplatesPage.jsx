import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../../../api/supabaseClient'
import { useTenant } from '../../../../contexts/TenantProvider'
import { useAuth } from '../../../../contexts/AuthProvider'
import { sendTestEmail } from '../../../../api/edgeFunctions'
import EmailTemplateForm from './EmailTemplateForm'
import TestEmailModal from './TestEmailModal'
import './EmailTemplatesPage.css'

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

const AVAILABLE_VARIABLES = {
  employee: [
    { key: '{{employee_name}}', label: 'Employee Name' },
    { key: '{{employee_code}}', label: 'Employee Code' },
    { key: '{{employee_email}}', label: 'Employee Email' },
    { key: '{{employee_type}}', label: 'Employee Type' },
  ],
  document: [
    { key: '{{document_name}}', label: 'Document Name' },
    { key: '{{document_type}}', label: 'Document Type' },
    { key: '{{expiry_date}}', label: 'Expiry Date' },
    { key: '{{days_remaining}}', label: 'Days Remaining' },
  ],
  company: [
    { key: '{{company_name}}', label: 'Company Name' },
    { key: '{{company_logo}}', label: 'Company Logo' },
    { key: '{{support_email}}', label: 'Support Email' },
    { key: '{{support_phone}}', label: 'Support Phone' },
  ],
  link: [
    { key: '{{upload_link}}', label: 'Upload Link' },
    { key: '{{dashboard_link}}', label: 'Dashboard Link' },
  ],
}

export default function EmailTemplatesPage() {
  const { tenant } = useTenant()
  const { profile } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [showTestModal, setShowTestModal] = useState(false)
  const [testingTemplate, setTestingTemplate] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const fetchTemplates = useCallback(async () => {
    if (!tenant?.tenant_id) return

    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('hrms_email_templates')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .order('is_system_template', { ascending: false })
        .order('template_category', { ascending: true })
        .order('template_name', { ascending: true })

      if (fetchError) throw fetchError

      setTemplates(data || [])
    } catch (err) {
      console.error('Error fetching email templates:', err)
      const errorMessage =
        err.message || err.error?.message || 'Failed to load email templates. Please try again later.'
      setError(errorMessage)
      setTemplates([])
      
      // Log to error tracking service if available
      if (window.Sentry) {
        window.Sentry.captureException(err)
      }
    } finally {
      setLoading(false)
    }
  }, [tenant?.tenant_id])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleCreate = () => {
    setEditingTemplate(null)
    setShowForm(true)
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setShowForm(true)
  }

  const handleDelete = async (template) => {
    if (template.is_system_template) {
      alert('System templates cannot be deleted')
      return
    }

    if (!window.confirm(`Delete email template "${template.template_name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('hrms_email_templates')
        .delete()
        .eq('template_id', template.template_id)
        .eq('tenant_id', tenant.tenant_id)

      if (deleteError) throw deleteError

      fetchTemplates()
    } catch (err) {
      console.error('Error deleting email template:', err)
      alert('Failed to delete email template: ' + err.message)
    }
  }

  const handleTestEmail = (template) => {
    setTestingTemplate(template)
    setShowTestModal(true)
  }

  const handleSendTestEmail = async (recipientEmail, variables) => {
    if (!testingTemplate) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      await sendTestEmail(testingTemplate.template_id, recipientEmail, variables, token)
      alert(`Test email sent successfully to ${recipientEmail}`)
      setShowTestModal(false)
      setTestingTemplate(null)
    } catch (err) {
      console.error('Error sending test email:', err)
      alert('Failed to send test email: ' + err.message)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTemplate(null)
  }

  const handleFormSave = () => {
    handleFormClose()
    fetchTemplates()
  }

  const filteredTemplates = useMemo(() => {
    let filtered = [...templates]

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (template) =>
          template.template_name.toLowerCase().includes(term) ||
          template.template_key.toLowerCase().includes(term) ||
          template.subject.toLowerCase().includes(term)
      )
    }

    // Filter by category
    if (filterCategory !== 'ALL') {
      filtered = filtered.filter((template) => template.template_category === filterCategory)
    }

    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((template) =>
        filterStatus === 'ACTIVE' ? template.is_active : !template.is_active
      )
    }

    return filtered
  }, [templates, searchTerm, filterCategory, filterStatus])

  const systemTemplates = useMemo(() => filteredTemplates.filter((t) => t.is_system_template), [filteredTemplates])
  const customTemplates = useMemo(() => filteredTemplates.filter((t) => !t.is_system_template), [filteredTemplates])

  if (loading) {
    return (
      <div className="email-templates-page">
        <div className="loading">Loading email templates...</div>
      </div>
    )
  }

  return (
    <div className="email-templates-page">
      <div className="crm-header">
        <h1>Email Templates Management</h1>
        <p style={{ margin: 0, color: '#64748b' }}>
          Customize email templates for system notifications
        </p>
      </div>

      <div className="email-templates-actions">
        <button className="btn btn-primary" onClick={handleCreate}>
          + Create Template
        </button>
        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="🔍 Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Categories</option>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {systemTemplates.length > 0 && (
        <div className="email-templates-section">
          <h2>System Templates</h2>
          <div className="email-templates-grid">
            {systemTemplates.map((template) => (
              <EmailTemplateCard
                key={template.template_id}
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTest={handleTestEmail}
                isSystemTemplate={true}
              />
            ))}
          </div>
        </div>
      )}

      {customTemplates.length > 0 && (
        <div className="email-templates-section">
          <h2>Custom Templates</h2>
          <div className="email-templates-grid">
            {customTemplates.map((template) => (
              <EmailTemplateCard
                key={template.template_id}
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTest={handleTestEmail}
                isSystemTemplate={false}
              />
            ))}
          </div>
        </div>
      )}

      {filteredTemplates.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon">📧</div>
          <h3>No Email Templates Found</h3>
          <p>
            {searchTerm || filterCategory !== 'ALL' || filterStatus !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Create your first email template to get started'}
          </p>
        </div>
      )}

      {showForm && (
        <EmailTemplateForm
          template={editingTemplate}
          onClose={handleFormClose}
          onSave={handleFormSave}
          tenantId={tenant?.tenant_id}
          userId={profile?.id}
          availableVariables={AVAILABLE_VARIABLES}
        />
      )}

      {showTestModal && testingTemplate && (
        <TestEmailModal
          template={testingTemplate}
          onClose={() => {
            setShowTestModal(false)
            setTestingTemplate(null)
          }}
          onSend={handleSendTestEmail}
          availableVariables={AVAILABLE_VARIABLES}
        />
      )}
    </div>
  )
}

function EmailTemplateCard({ template, onEdit, onDelete, onTest, isSystemTemplate }) {
  return (
    <div className="email-template-card">
      <div className="email-template-card-header">
        <div className="email-template-icon">📧</div>
        <div className="email-template-title">
          <h3>{template.template_name}</h3>
          {isSystemTemplate && <span className="system-badge">🔒 System Template</span>}
        </div>
        <div className="email-template-status">
          {template.is_active ? '🟢 Active' : '🔴 Inactive'}
        </div>
      </div>
      <div className="email-template-card-body">
        <div className="email-template-info">
          <div className="info-row">
            <span className="info-label">Key:</span>
            <span className="info-value">{template.template_key}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Category:</span>
            <span className="info-value">
              {TEMPLATE_CATEGORIES.find((c) => c.value === template.template_category)?.label ||
                template.template_category}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Subject:</span>
            <span className="info-value subject-preview">{template.subject}</span>
          </div>
          {template.updated_at && (
            <div className="info-row">
              <span className="info-label">Last edited:</span>
              <span className="info-value">
                {new Date(template.updated_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="email-template-card-actions">
        <button className="btn btn-sm btn-primary" onClick={() => onEdit(template)}>
          Edit
        </button>
        <button className="btn btn-sm btn-secondary" onClick={() => onTest(template)}>
          Test
        </button>
        {!isSystemTemplate && (
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(template)}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
