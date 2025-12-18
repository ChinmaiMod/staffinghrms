import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../api/supabaseClient'
import { useTenant } from '../../../contexts/TenantProvider'
import { useAuth } from '../../../contexts/AuthProvider'
import { validateEmail } from '../../../utils/validators'
import './InviteUsers.css'

// HRMS Tier 2 Application Code - filters roles specific to HRMS application
const APPLICATION_CODE = 'HRMS'

export default function InviteUsers() {
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const { profile } = useAuth()
  const [invitations, setInvitations] = useState([])
  const [availableRoles, setAvailableRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    fullName: '',
    message: '',
    roleId: ''
  })
  const [fieldErrors, setFieldErrors] = useState({})

  const canInviteUsers = profile?.role === 'ADMIN' || profile?.role === 'CEO'

  const loadAvailableRoles = useCallback(async () => {
    try {
      // Load all roles that can be assigned
      // Users can assign roles at or below their level
      // Filter by HRMS application to only show HRMS-specific roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_id, role_name, role_level, role_code')
        .eq('application_code', APPLICATION_CODE)  // Filter by HRMS application
        .order('role_level', { ascending: true })

      if (rolesError) throw rolesError
      setAvailableRoles(roles || [])
    } catch (err) {
      console.error('Error loading roles:', err)
    }
  }, [])

  const loadInvitations = useCallback(async () => {
    if (!tenant?.tenant_id) return

    try {
      setLoading(true)
      const { data, error: inviteError } = await supabase
        .from('user_invitations')
        .select(`
          *,
          invited_by_profile:profiles!user_invitations_invited_by_fkey(
            full_name,
            email
          ),
          assigned_role:user_roles(
            role_id,
            role_name,
            role_level
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false })

      if (inviteError) throw inviteError
      setInvitations(data || [])
    } catch (err) {
      console.error('Error loading invitations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tenant?.tenant_id])

  useEffect(() => {
    loadInvitations()
    loadAvailableRoles()
  }, [loadInvitations, loadAvailableRoles])

  const validateForm = () => {
    const errors = {}

    if (!inviteForm.fullName.trim()) {
      errors.fullName = 'Full name is required'
    } else if (inviteForm.fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters'
    }

    const emailValidation = validateEmail(inviteForm.email)
    if (!emailValidation.valid) {
      errors.email = emailValidation.error
    }

    // Check if email domain matches tenant domain
    const emailDomain = inviteForm.email.split('@')[1]
    if (tenant?.email_domain && emailDomain !== tenant.email_domain) {
      errors.email = `Email must be from your company domain: @${tenant.email_domain}`
    }

    // Validate role selection
    if (!inviteForm.roleId) {
      errors.roleId = 'Please select a role for the user'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setError('Please fix the errors below')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', inviteForm.email.toLowerCase())
        .single()

      if (existingProfile) {
        setError('A user with this email already exists in your organization')
        setSubmitting(false)
        return
      }

      // Check if invitation already exists
      const { data: existingInvite } = await supabase
        .from('user_invitations')
        .select('id, status')
        .eq('email', inviteForm.email.toLowerCase())
        .eq('tenant_id', tenant.tenant_id)
        .in('status', ['PENDING', 'SENT'])
        .single()

      if (existingInvite) {
        setError('An invitation has already been sent to this email address')
        setSubmitting(false)
        return
      }

      // Call Edge Function to create invitation and send email
      // Get frontend URL from env var or current window location
      const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin
      
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'sendUserInvitation',
        {
          body: {
            email: inviteForm.email.toLowerCase(),
            fullName: inviteForm.fullName.trim(),
            message: inviteForm.message.trim() || null,
            tenantId: tenant.tenant_id,
            invitedBy: profile.id,
            frontendUrl: frontendUrl, // Pass frontend URL from client
            roleId: inviteForm.roleId ? parseInt(inviteForm.roleId, 10) : null // Pass selected role
          }
        }
      )

      if (functionError || functionData?.error) {
        throw new Error(functionData?.error || functionError?.message || 'Failed to send invitation')
      }

      // Check if email was actually sent
      if (!functionData?.emailSent) {
        const errorMsg = functionData?.emailError || 'Email could not be sent. Please configure Resend API keys in Data Administration > Resend API Keys.'
        setError(`${errorMsg}${functionData?.invitationUrl ? ` You can manually share this invitation link: ${functionData.invitationUrl}` : ''}`)
        // Still reload to show the invitation was created
        await loadInvitations()
        return
      }

      setSuccess(`Invitation sent successfully to ${inviteForm.email}`)
      setInviteForm({ email: '', fullName: '', message: '', roleId: '' })
      setShowInviteForm(false)
      await loadInvitations()
    } catch (err) {
      console.error('Error sending invitation:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendInvitation = async (invitation) => {
    try {
      setError('')
      setSuccess('')

      // Get frontend URL from env var or current window location
      const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin
      
      const { data, error } = await supabase.functions.invoke(
        'resendUserInvitation',
        {
          body: {
            invitationId: invitation.id,
            invitedBy: profile.id,
            frontendUrl: frontendUrl // Pass frontend URL from client
          }
        }
      )

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to resend invitation')
      }

      // Check if email was actually sent
      if (!data?.emailSent) {
        const errorMsg = data?.emailError || 'Email could not be sent. Please configure Resend API keys in Data Administration > Resend API Keys.'
        setError(`${errorMsg}${data?.invitationUrl ? ` You can manually share this invitation link: ${data.invitationUrl}` : ''}`)
        await loadInvitations()
        return
      }

      setSuccess(`Invitation resent to ${invitation.email}`)
      await loadInvitations()
    } catch (err) {
      console.error('Error resending invitation:', err)
      setError(err.message)
    }
  }

  const handleRevokeInvitation = async (invitation) => {
    if (!confirm(`Are you sure you want to revoke the invitation for ${invitation.email}?`)) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({
          status: 'REVOKED',
          revoked_at: new Date().toISOString(),
          revoked_by: profile.id
        })
        .eq('id', invitation.id)

      if (updateError) throw updateError

      setSuccess(`Invitation for ${invitation.email} has been revoked`)
      await loadInvitations()
    } catch (err) {
      console.error('Error revoking invitation:', err)
      setError(err.message)
    }
  }

  const getStatusBadgeClass = (status) => {
    const classes = {
      PENDING: 'status-pending',
      SENT: 'status-sent',
      ACCEPTED: 'status-accepted',
      EXPIRED: 'status-expired',
      REVOKED: 'status-revoked'
    }
    return classes[status] || 'status-default'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!canInviteUsers) {
    return (
      <div className="invite-users">
        <div className="alert alert-error">
          You do not have permission to invite users. Only CEOs and Admins can invite users.
        </div>
      </div>
    )
  }

  return (
    <div className="invite-users">
      <div style={{ marginBottom: '16px' }}>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/hrms/data-admin')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '14px',
            padding: '8px 16px'
          }}
        >
          ← Back to All Tables
        </button>
      </div>
      
      <div className="page-header">
        <div>
          <h1>👥 Invite Users</h1>
          <p className="page-description">
            Invite team members to join {tenant?.company_name || 'your organization'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowInviteForm(!showInviteForm)}
        >
          {showInviteForm ? '✕ Cancel' : '+ Invite User'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')}>&times;</button>
        </div>
      )}

      {showInviteForm && (
        <div className="invite-form-container">
          <form onSubmit={handleSubmit} className="invite-form">
            <h3>Send Invitation</h3>
            
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                value={inviteForm.fullName}
                onChange={(e) => {
                  setInviteForm({ ...inviteForm, fullName: e.target.value })
                  if (fieldErrors.fullName) {
                    setFieldErrors({ ...fieldErrors, fullName: '' })
                  }
                }}
                className={fieldErrors.fullName ? 'error' : ''}
                placeholder="John Doe"
              />
              {fieldErrors.fullName && (
                <small className="error-text">{fieldErrors.fullName}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                value={inviteForm.email}
                onChange={(e) => {
                  setInviteForm({ ...inviteForm, email: e.target.value })
                  if (fieldErrors.email) {
                    setFieldErrors({ ...fieldErrors, email: '' })
                  }
                }}
                className={fieldErrors.email ? 'error' : ''}
                placeholder={tenant?.email_domain ? `user@${tenant.email_domain}` : 'user@company.com'}
              />
              {fieldErrors.email && (
                <small className="error-text">{fieldErrors.email}</small>
              )}
              {tenant?.email_domain && (
                <small>Must use your company domain: @{tenant.email_domain}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="roleId">Role *</label>
              <select
                id="roleId"
                value={inviteForm.roleId}
                onChange={(e) => {
                  setInviteForm({ ...inviteForm, roleId: e.target.value })
                  if (fieldErrors.roleId) {
                    setFieldErrors({ ...fieldErrors, roleId: '' })
                  }
                }}
                className={fieldErrors.roleId ? 'error' : ''}
              >
                <option value="">Select a role...</option>
                {availableRoles.map((role) => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.role_name} (Level {role.role_level})
                  </option>
                ))}
              </select>
              {fieldErrors.roleId && (
                <small className="error-text">{fieldErrors.roleId}</small>
              )}
              <small>The role that will be assigned when the user accepts the invitation</small>
            </div>

            <div className="form-group">
              <label htmlFor="message">Personal Message (Optional)</label>
              <textarea
                id="message"
                value={inviteForm.message}
                onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                placeholder="Add a personal message to include in the invitation email..."
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowInviteForm(false)
                  setInviteForm({ email: '', fullName: '', message: '', roleId: '' })
                  setFieldErrors({})
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="invitations-table-container">
        {loading ? (
          <div className="loading-state">Loading invitations...</div>
        ) : invitations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📨</div>
            <h3>No Invitations</h3>
            <p>Start by inviting team members to join your organization</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Invited By</th>
                <th>Invited On</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => (
                <tr key={invitation.id}>
                  <td>
                    <strong>{invitation.invited_user_name}</strong>
                  </td>
                  <td>{invitation.email}</td>
                  <td>
                    {invitation.assigned_role?.role_name || 'Read Only'}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(invitation.status)}`}>
                      {invitation.status}
                    </span>
                  </td>
                  <td>
                    {invitation.invited_by_profile?.full_name || 
                     invitation.invited_by_profile?.email || 
                     'Unknown'}
                  </td>
                  <td>{formatDate(invitation.created_at)}</td>
                  <td>{formatDate(invitation.expires_at)}</td>
                  <td>
                    <div className="action-buttons">
                      {(invitation.status === 'PENDING' || invitation.status === 'SENT') && (
                        <>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleResendInvitation(invitation)}
                            title="Resend invitation email"
                          >
                            📧 Resend
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRevokeInvitation(invitation)}
                            title="Revoke invitation"
                          >
                            ✕ Revoke
                          </button>
                        </>
                      )}
                      {invitation.status === 'ACCEPTED' && (
                        <span className="text-success">✓ Joined</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
