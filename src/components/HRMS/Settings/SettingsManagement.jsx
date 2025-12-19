import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthProvider'
import { supabase } from '../../../api/supabaseClient'
import ProfileTab from './ProfileTab'
import SecurityTab from './SecurityTab'
import NotificationsTab from './NotificationsTab'
import SystemSettingsTab from './SystemSettingsTab'
import './SettingsManagement.css'

const TABS = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
]

const ADMIN_TABS = [
  { id: 'system', label: 'System', icon: '⚙️' },
  { id: 'organization', label: 'Organization', icon: '🏢' },
  { id: 'email', label: 'Email Config', icon: '📧' },
  { id: 'api-keys', label: 'API Keys', icon: '🔑' },
]

function SettingsManagement() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [preferences, setPreferences] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (user && profile) {
      checkAdminStatus()
      loadPreferences()
    }
  }, [user, profile])

  const checkAdminStatus = () => {
    // Check if user is admin based on profile role
    const adminRoles = ['admin', 'super_admin', 'hr_admin']
    setIsAdmin(adminRoles.includes(profile?.role?.toLowerCase()))
  }

  const loadPreferences = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('hrms_user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" - we'll create defaults
        console.error('Error loading preferences:', error)
      }

      if (data) {
        setPreferences(data)
      } else {
        // Create default preferences
        await createDefaultPreferences()
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultPreferences = async () => {
    if (!user || !profile) return

    try {
      const defaultPrefs = {
        tenant_id: profile.tenant_id,
        user_id: user.id,
        timezone: 'America/Chicago',
        language: 'en-US',
        date_format: 'MM/DD/YYYY',
        time_format: '12-hour',
      }

      const { data, error } = await supabase
        .from('hrms_user_preferences')
        .insert(defaultPrefs)
        .select()
        .single()

      if (error) throw error
      setPreferences(data)
    } catch (error) {
      console.error('Error creating default preferences:', error)
    }
  }

  const updatePreferences = async (updates) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('hrms_user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      setPreferences(data)
      return { data, error: null }
    } catch (error) {
      console.error('Error updating preferences:', error)
      return { data: null, error }
    }
  }

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="spinner">Loading settings...</div>
      </div>
    )
  }

  const allTabs = [...TABS, ...(isAdmin ? ADMIN_TABS : [])]

  return (
    <div className="settings-management" data-testid="settings-management">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          {allTabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`settings-tab-${tab.id}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <ProfileTab
              user={user}
              profile={profile}
              preferences={preferences}
              onUpdate={updatePreferences}
            />
          )}
          {activeTab === 'security' && (
            <SecurityTab
              user={user}
              preferences={preferences}
              onUpdate={updatePreferences}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab
              preferences={preferences}
              onUpdate={updatePreferences}
            />
          )}
          {isAdmin && activeTab === 'system' && (
            <SystemSettingsTab preferences={preferences} onUpdate={updatePreferences} />
          )}
          {isAdmin && activeTab === 'organization' && (
            <div className="settings-section">
              <h2>Organization Settings</h2>
              <p>Organization settings coming soon...</p>
            </div>
          )}
          {isAdmin && activeTab === 'email' && (
            <div className="settings-section">
              <h2>Email Configuration</h2>
              <p>Email configuration coming soon...</p>
            </div>
          )}
          {isAdmin && activeTab === 'api-keys' && (
            <div className="settings-section">
              <h2>API Keys</h2>
              <p>API keys management coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsManagement
