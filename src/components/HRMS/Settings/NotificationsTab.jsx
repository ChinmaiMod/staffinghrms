import { useState, useEffect } from 'react'
import './NotificationsTab.css'

function NotificationsTab({ preferences, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [notificationPrefs, setNotificationPrefs] = useState({
    in_app: true,
    email: true,
    sms: false,
    compliance_alerts: {
      document_expiry: { in_app: true, email: true, sms: true },
      visa_renewal: { in_app: true, email: true, sms: true },
      project_end_date: { in_app: true, email: true, sms: false },
      missing_documents: { in_app: true, email: true, sms: false },
      amendment_required: { in_app: true, email: true, sms: true },
    },
    timesheet_notifications: {
      submitted: { in_app: true, email: true, sms: false },
      approved: { in_app: true, email: true, sms: false },
      rejected: { in_app: true, email: true, sms: true },
      pending_approval: { in_app: true, email: true, sms: false },
    },
    system_notifications: {
      newsletter: { in_app: true, email: true, sms: false },
      issue_updates: { in_app: true, email: true, sms: false },
      suggestion_status: { in_app: true, email: true, sms: false },
      security_alerts: { in_app: true, email: true, sms: true },
    },
    quiet_hours: {
      enabled: false,
      start_time: '22:00',
      end_time: '07:00',
    },
  })

  useEffect(() => {
    if (preferences?.notification_preferences) {
      setNotificationPrefs(preferences.notification_preferences)
    }
  }, [preferences])

  const handleToggle = (path) => {
    const keys = path.split('.')
    setNotificationPrefs((prev) => {
      const newPrefs = JSON.parse(JSON.stringify(prev))
      let current = newPrefs
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = !current[keys[keys.length - 1]]
      return newPrefs
    })
    setError(null)
    setSuccess(null)
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await onUpdate({
        notification_preferences: notificationPrefs,
      })

      if (updateError) throw updateError

      setSuccess('Notification preferences saved successfully')
    } catch (err) {
      console.error('Error saving notification preferences:', err)
      setError('Failed to save preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`toggle-switch ${checked ? 'on' : 'off'}`}
      onClick={onChange}
      disabled={disabled}
      data-testid={`toggle-${checked}`}
    >
      <span className="toggle-slider" />
    </button>
  )

  return (
    <div className="notifications-tab" data-testid="notifications-tab">
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Notification Channels</h3>
        </div>
        <div className="settings-card-content">
          <div className="notification-channels">
            <div className="channel-row">
              <span className="channel-label">All Notifications</span>
              <div className="channel-toggles">
                <ToggleSwitch
                  checked={notificationPrefs.in_app}
                  onChange={() => handleToggle('in_app')}
                />
                <ToggleSwitch
                  checked={notificationPrefs.email}
                  onChange={() => handleToggle('email')}
                />
                <ToggleSwitch
                  checked={notificationPrefs.sms}
                  onChange={() => handleToggle('sms')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Compliance Alerts</h3>
        </div>
        <div className="settings-card-content">
          {Object.entries(notificationPrefs.compliance_alerts).map(([key, value]) => (
            <div key={key} className="notification-item">
              <div className="notification-item-header">
                <span className="notification-label">
                  {key
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </span>
                <div className="notification-toggles">
                  <ToggleSwitch
                    checked={value.in_app}
                    onChange={() => handleToggle(`compliance_alerts.${key}.in_app`)}
                  />
                  <ToggleSwitch
                    checked={value.email}
                    onChange={() => handleToggle(`compliance_alerts.${key}.email`)}
                  />
                  <ToggleSwitch
                    checked={value.sms}
                    onChange={() => handleToggle(`compliance_alerts.${key}.sms`)}
                  />
                </div>
              </div>
              <p className="help-text">
                {key === 'document_expiry' && '30 days before expiration'}
                {key === 'visa_renewal' && '60 days before visa expiration'}
                {key === 'project_end_date' && '30 days before project end'}
                {key === 'missing_documents' && 'When required documents are missing'}
                {key === 'amendment_required' && 'When LCA amendment is needed'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Timesheet Notifications</h3>
        </div>
        <div className="settings-card-content">
          {Object.entries(notificationPrefs.timesheet_notifications).map(([key, value]) => (
            <div key={key} className="notification-item">
              <div className="notification-item-header">
                <span className="notification-label">
                  {key
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </span>
                <div className="notification-toggles">
                  <ToggleSwitch
                    checked={value.in_app}
                    onChange={() => handleToggle(`timesheet_notifications.${key}.in_app`)}
                  />
                  <ToggleSwitch
                    checked={value.email}
                    onChange={() => handleToggle(`timesheet_notifications.${key}.email`)}
                  />
                  <ToggleSwitch
                    checked={value.sms}
                    onChange={() => handleToggle(`timesheet_notifications.${key}.sms`)}
                  />
                </div>
              </div>
              <p className="help-text">
                {key === 'submitted' && 'When your timesheet is submitted for approval'}
                {key === 'approved' && 'When your timesheet is approved'}
                {key === 'rejected' && 'When your timesheet needs revision'}
                {key === 'pending_approval' && 'When you have timesheets to approve (managers)'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h3>System Notifications</h3>
        </div>
        <div className="settings-card-content">
          {Object.entries(notificationPrefs.system_notifications).map(([key, value]) => (
            <div key={key} className="notification-item">
              <div className="notification-item-header">
                <span className="notification-label">
                  {key
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </span>
                <div className="notification-toggles">
                  <ToggleSwitch
                    checked={value.in_app}
                    onChange={() => handleToggle(`system_notifications.${key}.in_app`)}
                  />
                  <ToggleSwitch
                    checked={value.email}
                    onChange={() => handleToggle(`system_notifications.${key}.email`)}
                  />
                  <ToggleSwitch
                    checked={value.sms}
                    onChange={() => handleToggle(`system_notifications.${key}.sms`)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Quiet Hours</h3>
        </div>
        <div className="settings-card-content">
          <div className="notification-item">
            <div className="notification-item-header">
              <span className="notification-label">Enable Quiet Hours</span>
              <ToggleSwitch
                checked={notificationPrefs.quiet_hours.enabled}
                onChange={() => handleToggle('quiet_hours.enabled')}
              />
            </div>
            {notificationPrefs.quiet_hours.enabled && (
              <div className="quiet-hours-times">
                <div className="form-group">
                  <label>From:</label>
                  <input
                    type="time"
                    value={notificationPrefs.quiet_hours.start_time}
                    onChange={(e) => {
                      setNotificationPrefs((prev) => ({
                        ...prev,
                        quiet_hours: { ...prev.quiet_hours, start_time: e.target.value },
                      }))
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>To:</label>
                  <input
                    type="time"
                    value={notificationPrefs.quiet_hours.end_time}
                    onChange={(e) => {
                      setNotificationPrefs((prev) => ({
                        ...prev,
                        quiet_hours: { ...prev.quiet_hours, end_time: e.target.value },
                      }))
                    }}
                  />
                </div>
              </div>
            )}
            <p className="help-text">
              ℹ️ Non-critical notifications will be held during quiet hours
            </p>
            <p className="help-text">
              ⚠️ Critical alerts (security, urgent compliance) will still notify
            </p>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading}
          data-testid="save-notifications-btn"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

export default NotificationsTab
