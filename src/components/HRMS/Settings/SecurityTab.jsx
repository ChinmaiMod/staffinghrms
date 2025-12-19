import { useState } from 'react'
import { useAuth } from '../../../contexts/AuthProvider'
import './SecurityTab.css'

function SecurityTab({ user, preferences, onUpdate }) {
  const { updatePassword } = useAuth()
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const checkPasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    }

    setPasswordRequirements(requirements)

    const metCount = Object.values(requirements).filter(Boolean).length
    const strength = (metCount / 5) * 100
    setPasswordStrength(strength)
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(null)

    if (name === 'newPassword') {
      checkPasswordStrength(value)
    }
  }

  const handleChangePassword = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate passwords match
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      // Validate password requirements
      const allMet = Object.values(passwordRequirements).every(Boolean)
      if (!allMet) {
        setError('Password does not meet all requirements')
        setLoading(false)
        return
      }

      // Update password via Supabase Auth
      const { error: updateError } = await updatePassword(passwordData.newPassword)

      if (updateError) {
        throw updateError
      }

      // Update password_changed_at in preferences
      await onUpdate({
        password_changed_at: new Date().toISOString(),
      })

      setSuccess('Password changed successfully')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setShowChangePassword(false)
    } catch (err) {
      console.error('Error changing password:', err)
      setError(err.message || 'Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 20) return { label: 'Very Weak', color: '#EF4444' }
    if (passwordStrength < 40) return { label: 'Weak', color: '#F97316' }
    if (passwordStrength < 60) return { label: 'Fair', color: '#F59E0B' }
    if (passwordStrength < 80) return { label: 'Strong', color: '#84CC16' }
    return { label: 'Very Strong', color: '#22C55E' }
  }

  const strengthInfo = getPasswordStrengthLabel()
  const twoFactorEnabled = preferences?.two_factor_enabled || false
  const passwordChangedAt = preferences?.password_changed_at
    ? new Date(preferences.password_changed_at).toLocaleDateString()
    : 'Never'

  return (
    <div className="security-tab" data-testid="security-tab">
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Password</h3>
          {!showChangePassword && (
            <button
              className="btn btn-primary"
              onClick={() => setShowChangePassword(true)}
              data-testid="change-password-btn"
            >
              Change Password
            </button>
          )}
        </div>
        <div className="settings-card-content">
          {!showChangePassword ? (
            <>
              <div className="password-info">
                <div className="info-item">
                  <span className="info-label">Password Strength:</span>
                  <span className="info-value">Strong</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Changed:</span>
                  <span className="info-value">{passwordChangedAt}</span>
                </div>
              </div>
              <p className="help-text">
                ℹ️ We recommend changing your password every 90 days
              </p>
            </>
          ) : (
            <div className="change-password-form">
              <div className="form-group">
                <label>
                  Current Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                />
              </div>

              <div className="form-group">
                <label>
                  New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />
                {passwordData.newPassword && (
                  <>
                    <div className="password-strength-meter">
                      <div
                        className="password-strength-bar"
                        style={{
                          width: `${passwordStrength}%`,
                          backgroundColor: strengthInfo.color,
                        }}
                      />
                    </div>
                    <div className="password-strength-label">
                      {passwordStrength}% {strengthInfo.label}
                    </div>
                    <div className="password-requirements">
                      <div className={passwordRequirements.length ? 'met' : ''}>
                        {passwordRequirements.length ? '✅' : '⬜'} At least 8 characters
                      </div>
                      <div className={passwordRequirements.uppercase ? 'met' : ''}>
                        {passwordRequirements.uppercase ? '✅' : '⬜'} Contains uppercase letter
                      </div>
                      <div className={passwordRequirements.lowercase ? 'met' : ''}>
                        {passwordRequirements.lowercase ? '✅' : '⬜'} Contains lowercase letter
                      </div>
                      <div className={passwordRequirements.number ? 'met' : ''}>
                        {passwordRequirements.number ? '✅' : '⬜'} Contains number
                      </div>
                      <div className={passwordRequirements.special ? 'met' : ''}>
                        {passwordRequirements.special ? '✅' : '⬜'} Contains special character
                        (!@#$%^&*)
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="form-group">
                <label>
                  Confirm New Password <span className="required">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />
                {passwordData.confirmPassword &&
                  passwordData.newPassword === passwordData.confirmPassword && (
                    <div className="success-message">✅ Passwords match</div>
                  )}
                {passwordData.confirmPassword &&
                  passwordData.newPassword !== passwordData.confirmPassword && (
                    <div className="error-message">❌ Passwords do not match</div>
                  )}
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowChangePassword(false)
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    })
                    setError(null)
                    setSuccess(null)
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleChangePassword}
                  disabled={loading}
                  data-testid="save-password-btn"
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Two-Factor Authentication</h3>
          {!twoFactorEnabled && (
            <button className="btn btn-primary" disabled>
              Set Up 2FA
            </button>
          )}
        </div>
        <div className="settings-card-content">
          {twoFactorEnabled ? (
            <div className="two-factor-status enabled">
              <span className="status-icon">✅</span>
              <span>Two-factor authentication is enabled</span>
            </div>
          ) : (
            <>
              <div className="two-factor-status disabled">
                <span className="status-icon">⚠️</span>
                <span>Not Enabled</span>
              </div>
              <p>
                Two-factor authentication adds an extra layer of security to your account by
                requiring a code from your mobile device.
              </p>
              <div className="two-factor-methods">
                <p>🔐 Supported Methods:</p>
                <ul>
                  <li>Authenticator App (Google Authenticator, Authy)</li>
                  <li>SMS Text Message</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Active Sessions</h3>
        </div>
        <div className="settings-card-content">
          <p className="help-text">Session management coming soon...</p>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Login History</h3>
        </div>
        <div className="settings-card-content">
          <p className="help-text">Login history coming soon...</p>
        </div>
      </div>
    </div>
  )
}

export default SecurityTab
