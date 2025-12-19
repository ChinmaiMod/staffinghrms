import './ChecklistTypeDetails.css'

const ENTITY_TYPES = [
  { value: 'employee', label: 'Employee' },
  { value: 'project', label: 'Project' },
  { value: 'timesheet', label: 'Timesheet' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'visa', label: 'Visa' },
  { value: 'background_check', label: 'Background Check' },
  { value: 'performance', label: 'Performance' },
  { value: 'custom', label: 'Custom' },
]

export default function ChecklistTypeDetails({ type, onClose, onEdit }) {
  const getIcon = () => {
    if (type.icon) return type.icon
    const iconMap = {
      employee: '👤',
      project: '💼',
      timesheet: '🕐',
      compliance: '🛡️',
      visa: '🛂',
      background_check: '🔍',
      performance: '📊',
      custom: '📋',
    }
    return iconMap[type.target_entity_type] || '📋'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content checklist-type-details" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="details-header">
            <span className="details-icon">{getIcon()}</span>
            <h2>{type.type_name}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="details-content">
          <div className="details-section">
            <div className="details-info-card">
              <div className="info-item">
                <span className="info-label">Type Code:</span>
                <span className="info-value">{type.type_code}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Entity Type:</span>
                <span className="info-value">
                  {ENTITY_TYPES.find((et) => et.value === type.target_entity_type)?.label ||
                    type.target_entity_type}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Maps to:</span>
                <span className="info-value">
                  {type.target_table_name}.{type.target_id_column}
                </span>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{type.templates?.length || type.template_count || 0}</div>
                <div className="stat-label">Templates</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{type.documents_count || 0}</div>
                <div className="stat-label">Documents</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {type.is_active ? '✅' : '❌'}
                </div>
                <div className="stat-label">Status</div>
              </div>
            </div>
          </div>

          <div className="details-section">
            <h3>Configuration</h3>
            <div className="config-list">
              <div className="config-item">
                <span className="config-label">Allow Multiple Templates:</span>
                <span className="config-value">{type.allow_multiple_templates ? '✅' : '❌'}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Enable AI Parsing:</span>
                <span className="config-value">{type.enable_ai_parsing ? '✅' : '❌'}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Enable Compliance Tracking:</span>
                <span className="config-value">{type.enable_compliance_tracking ? '✅' : '❌'}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Require Employee Type:</span>
                <span className="config-value">{type.require_employee_type ? '✅' : '❌'}</span>
              </div>
              {type.is_system_type && (
                <div className="config-item">
                  <span className="config-label">System Type:</span>
                  <span className="config-value">🔒 Protected</span>
                </div>
              )}
            </div>
          </div>

          {type.templates && type.templates.length > 0 && (
            <div className="details-section">
              <h3>Templates Using This Type</h3>
              <div className="templates-list">
                {type.templates.map((template) => (
                  <div key={template.template_id} className="template-item">
                    <div className="template-name">{template.template_name}</div>
                    {template.employee_type && (
                      <div className="template-meta">Employee Type: {template.employee_type}</div>
                    )}
                    <div className="template-status">
                      {template.is_active ? '🟢 Active' : '🔴 Inactive'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {type.type_description && (
            <div className="details-section">
              <h3>Description</h3>
              <p className="description-text">{type.type_description}</p>
            </div>
          )}

          <div className="details-section">
            <div className="audit-info">
              <small>
                Created: {type.created_at ? new Date(type.created_at).toLocaleDateString() : 'N/A'}
                {type.updated_at && type.updated_at !== type.created_at && (
                  <> • Updated: {new Date(type.updated_at).toLocaleDateString()}</>
                )}
              </small>
            </div>
          </div>
        </div>

        <div className="details-actions">
          {!type.is_system_type && (
            <button className="btn btn-primary" onClick={() => { onClose(); onEdit(type); }}>
              Edit Type
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
