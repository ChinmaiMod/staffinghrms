import { useState } from 'react'
import './SystemSettingsTab.css'

function SystemSettingsTab({ preferences, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  return (
    <div className="system-settings-tab" data-testid="system-settings-tab">
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>General Settings</h3>
        </div>
        <div className="settings-card-content">
          <p className="help-text">System settings coming soon...</p>
        </div>
      </div>
    </div>
  )
}

export default SystemSettingsTab
