import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import ReferenceTableEditor from './ReferenceTableEditor'
import BusinessesPage from './Businesses/BusinessesPage'
import InternalStaffPage from './InternalStaff/InternalStaffPage'
import TeamsPage from './Teams/TeamsPage'
import ResendApiKeysPage from './ResendApiKeys/ResendApiKeysPage'
import AssignUserRoles from '../../DataAdministration/UserRoles/AssignUserRoles'
import InviteUsers from '../../DataAdministration/UserInvitations/InviteUsers'
import RBACAdministration from '../../DataAdministration/RBAC/RBACAdministration'
import AIPromptsPage from './AIPrompts/AIPromptsPage'

const REFERENCE_TABLES = [
  { id: 'rbac_admin', label: 'Access Control', icon: '🛡️', path: 'rbac-admin' },
  { id: 'assign_roles', label: 'Assign User Roles', icon: '👤', path: 'assign-roles' },
  { id: 'invite_users', label: 'Invite Users', icon: '📧', path: 'invite-users' },
  { id: 'resend_api_keys', label: 'Configure Resend API Keys', icon: '🔑', path: 'resend-api-keys' },
  { id: 'ai_prompts', label: 'AI Prompts for Newsletter', icon: '🤖', path: 'ai-prompts' },
  { id: 'businesses', label: 'Businesses', icon: '🏢', path: 'businesses' },
  { id: 'internal_staff', label: 'Internal Staff', icon: '👥', path: 'internal-staff' },
  { id: 'teams', label: 'Teams', icon: '🤝', path: 'teams' },
  { id: 'visa_status', label: 'Visa Statuses', icon: '🛂' },
  { id: 'job_titles_it', label: 'IT Job Titles', icon: '💼' },
  { id: 'job_titles_healthcare', label: 'Healthcare Job Titles', icon: '🏥' },
  { id: 'reasons_for_contact', label: 'Reasons for Contact', icon: '📋' },
  { id: 'statuses', label: 'Contact Statuses', icon: '📊' },
  { id: 'role_types', label: 'Role Types', icon: '🎯' },
  { id: 'countries', label: 'Countries', icon: '🌍' },
  { id: 'states', label: 'States', icon: '📍' },
  { id: 'cities', label: 'Cities', icon: '🏙️' },
  { id: 'years_experience', label: 'Years of Experience', icon: '⏳' },
  { id: 'referral_sources', label: 'Referral Sources', icon: '🔗' },
]

export default function DataAdministration() {
  const navigate = useNavigate()
  const [selectedTable, setSelectedTable] = useState(null)

  const handleTableClick = (table) => {
    if (table.path) {
      navigate(`/hrms/data-admin/${table.path}`)
    } else {
      setSelectedTable(table)
    }
  }

  return (
    <Routes>
      <Route path="rbac-admin" element={<RBACAdministration />} />
      <Route path="assign-roles" element={<AssignUserRoles />} />
      <Route path="invite-users" element={<InviteUsers />} />
      <Route path="resend-api-keys" element={<ResendApiKeysPage />} />
      <Route path="ai-prompts" element={<AIPromptsPage />} />
      <Route path="businesses" element={<BusinessesPage />} />
      <Route path="internal-staff" element={<InternalStaffPage />} />
      <Route path="teams" element={<TeamsPage />} />
      <Route path="/" element={
        <div>
          <div className="crm-header">
            <h1>Data Administration</h1>
            <p style={{ margin: 0, color: '#64748b' }}>Manage reference tables and lookup values</p>
          </div>

          {!selectedTable ? (
            <div className="stats-grid">
              {REFERENCE_TABLES.map(table => (
                <div 
                  key={table.id}
                  className="stat-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleTableClick(table)}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>{table.icon}</div>
                  <h3 style={{ fontSize: '16px', margin: 0 }}>{table.label}</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '8px 0 0 0' }}>
                    Click to manage
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setSelectedTable(null)}
                >
                  ← Back to All Tables
                </button>
              </div>
              <ReferenceTableEditor 
                table={selectedTable}
                onClose={() => setSelectedTable(null)}
              />
            </>
          )}
        </div>
      } />
    </Routes>
  )
}
