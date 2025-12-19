import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import './NotificationPreferences.css'

/**
 * NotificationPreferences - Modal for notification preferences
 * Based on UI_DESIGN_DOCS/13_NOTIFICATIONS.md
 */
function NotificationPreferences({ onClose }) {
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    inApp: true,
    quietHours: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    types: {
      compliance: { inApp: true, email: true, push: true },
      documentExpiry: { inApp: true, email: true, push: true },
      visaRenewals: { inApp: true, email: true, push: true },
      timesheetReminders: { inApp: true, email: true, push: false },
      projectUpdates: { inApp: true, email: false, push: false },
      employeeUpdates: { inApp: true, email: false, push: false },
      systemUpdates: { inApp: true, email: false, push: false },
    },
  })

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notificationPreferences')
    if (saved) {
      try {
        setPreferences(JSON.parse(saved))
      } catch {
        // Invalid JSON, use defaults
      }
    }
  }, [])

  const handleToggle = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleTypeToggle = (type, channel) => {
    setPreferences(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: {
          ...prev.types[type],
          [channel]: !prev.types[type][channel],
        },
      },
    }))
  }

  const handleSave = () => {
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences))
    onClose()
  }

  return (
    <div className="notification-preferences-overlay" onClick={onClose}>
      <div
        className="notification-preferences-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="preferences-title"
        aria-modal="true"
      >
        <div className="notification-preferences-header">
          <h2 id="preferences-title" className="preferences-title">
            Notification Preferences
          </h2>
          <button
            className="preferences-close-btn"
            onClick={onClose}
            aria-label="Close preferences"
          >
            <XMarkIcon className="close-icon" aria-hidden="true" />
          </button>
        </div>

        <div className="notification-preferences-content">
          {/* Notification Channels */}
          <section className="preferences-section">
            <h3 className="preferences-section-title">NOTIFICATION CHANNELS</h3>
            <div className="preferences-channels">
              <div className="preferences-channel-item">
                <div>
                  <label className="preferences-channel-label">Email Notifications</label>
                  <p className="preferences-channel-desc">Receive notifications via email</p>
                </div>
                <ToggleSwitch
                  checked={preferences.email}
                  onChange={() => handleToggle('email')}
                />
              </div>

              <div className="preferences-channel-item">
                <div>
                  <label className="preferences-channel-label">Push Notifications</label>
                  <p className="preferences-channel-desc">Browser push notifications</p>
                </div>
                <ToggleSwitch
                  checked={preferences.push}
                  onChange={() => handleToggle('push')}
                />
              </div>

              <div className="preferences-channel-item">
                <div>
                  <label className="preferences-channel-label">In-App Notifications</label>
                  <p className="preferences-channel-desc">Show in notification center (required)</p>
                </div>
                <ToggleSwitch checked={true} disabled />
              </div>
            </div>
          </section>

          {/* Notification Types */}
          <section className="preferences-section">
            <h3 className="preferences-section-title">NOTIFICATION TYPES</h3>
            <div className="preferences-types-table">
              <div className="preferences-types-header">
                <span></span>
                <span>In-App</span>
                <span>Email</span>
                <span>Push</span>
              </div>

              {Object.entries({
                compliance: { label: '🔴 Compliance Alerts', desc: 'Overdue items, critical compliance' },
                documentExpiry: { label: '📄 Document Expiry', desc: '30/60/90 day expiry warnings' },
                visaRenewals: { label: '🛂 Visa Renewals', desc: 'Visa expiry and amendment alerts' },
                timesheetReminders: { label: '🕐 Timesheet Reminders', desc: 'Submission deadlines, approvals' },
                projectUpdates: { label: '📊 Project Updates', desc: 'Rate changes, project status' },
                employeeUpdates: { label: '👤 Employee Updates', desc: 'New hires, status changes' },
                systemUpdates: { label: '🔧 System Updates', desc: 'Feature updates, maintenance' },
              }).map(([key, { label, desc }]) => (
                <div key={key} className="preferences-type-row">
                  <div className="preferences-type-info">
                    <span className="preferences-type-label">{label}</span>
                    <span className="preferences-type-desc">{desc}</span>
                  </div>
                  <ToggleSwitch
                    checked={preferences.types[key].inApp}
                    onChange={() => handleTypeToggle(key, 'inApp')}
                    disabled
                  />
                  <ToggleSwitch
                    checked={preferences.types[key].email}
                    onChange={() => handleTypeToggle(key, 'email')}
                    disabled={!preferences.email}
                  />
                  <ToggleSwitch
                    checked={preferences.types[key].push}
                    onChange={() => handleTypeToggle(key, 'push')}
                    disabled={!preferences.push}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Quiet Hours */}
          <section className="preferences-section">
            <h3 className="preferences-section-title">QUIET HOURS</h3>
            <div className="preferences-quiet-hours">
              <div className="preferences-quiet-hours-toggle">
                <ToggleSwitch
                  checked={preferences.quietHours}
                  onChange={() => handleToggle('quietHours')}
                />
                <label>Enable Quiet Hours</label>
              </div>

              {preferences.quietHours && (
                <div className="preferences-quiet-hours-config">
                  <p>Don't send push/email notifications between:</p>
                  <div className="preferences-time-inputs">
                    <div>
                      <label>From:</label>
                      <input
                        type="time"
                        value={preferences.quietHoursStart}
                        onChange={(e) =>
                          setPreferences(prev => ({
                            ...prev,
                            quietHoursStart: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label>To:</label>
                      <input
                        type="time"
                        value={preferences.quietHoursEnd}
                        onChange={(e) =>
                          setPreferences(prev => ({
                            ...prev,
                            quietHoursEnd: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <p className="preferences-quiet-hours-note">
                    ℹ️ Critical compliance alerts will still be sent during quiet hours
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="notification-preferences-footer">
          <button className="preferences-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="preferences-save-btn" onClick={handleSave}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * ToggleSwitch - Reusable toggle switch component
 */
function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      className={`toggle-switch ${checked ? 'on' : 'off'} ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onChange}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
    >
      <span className="toggle-switch-track">
        <span className="toggle-switch-thumb" />
      </span>
      <span className="toggle-switch-label">{checked ? 'ON' : 'OFF'}</span>
    </button>
  )
}

export default NotificationPreferences
