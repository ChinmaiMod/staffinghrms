import { useState, useEffect } from 'react'
import { supabase } from '../../../api/supabaseClient'
import './ProfileTab.css'

function ProfileTab({ user, profile, preferences, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    timezone: 'America/Chicago',
    language: 'en-US',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
    photoUrl: '',
  })

  useEffect(() => {
    if (user && profile) {
      // Extract name from profile or user metadata
      const fullName = profile?.full_name || user?.user_metadata?.full_name || ''
      const nameParts = fullName.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      setFormData({
        firstName,
        lastName,
        phone: profile?.phone_number || '',
        timezone: preferences?.timezone || 'America/Chicago',
        language: preferences?.language || 'en-US',
        dateFormat: preferences?.date_format || 'MM/DD/YYYY',
        timeFormat: preferences?.time_format || '12-hour',
        photoUrl: preferences?.photo_url || '',
      })
    }
  }, [user, profile, preferences])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(null)
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be under 2MB')
      return
    }

    if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
      setError('Photo must be in JPG, PNG, or GIF format')
      return
    }

    setLoading(true)
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('hrms-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('hrms-assets')
        .getPublicUrl(filePath)

      setFormData((prev) => ({ ...prev, photoUrl: urlData.publicUrl }))
      setSuccess('Photo uploaded successfully')
    } catch (err) {
      console.error('Error uploading photo:', err)
      setError('Failed to upload photo. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate required fields
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('First name and last name are required')
        setLoading(false)
        return
      }

      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
          phone_number: formData.phone || null,
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update preferences
      const { error: prefsError } = await onUpdate({
        timezone: formData.timezone,
        language: formData.language,
        date_format: formData.dateFormat,
        time_format: formData.timeFormat,
        photo_url: formData.photoUrl || null,
      })

      if (prefsError) throw prefsError

      setSuccess('Profile updated successfully')
      setEditing(false)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data
    const fullName = profile?.full_name || user?.user_metadata?.full_name || ''
    const nameParts = fullName.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    setFormData({
      firstName,
      lastName,
      phone: profile?.phone_number || '',
      timezone: preferences?.timezone || 'America/Chicago',
      language: preferences?.language || 'en-US',
      dateFormat: preferences?.date_format || 'MM/DD/YYYY',
      timeFormat: preferences?.time_format || '12-hour',
      photoUrl: preferences?.photo_url || '',
    })
    setEditing(false)
    setError(null)
    setSuccess(null)
  }

  const displayName = profile?.full_name || user?.email || 'User'
  const displayEmail = user?.email || ''
  const displayPhoto = formData.photoUrl || preferences?.photo_url

  return (
    <div className="profile-tab" data-testid="profile-tab">
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Profile</h3>
          {!editing && (
            <button
              className="btn btn-primary"
              onClick={() => setEditing(true)}
              data-testid="edit-profile-btn"
            >
              ✏️ Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div className="profile-view">
            <div className="profile-photo-section">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="Profile"
                  className="profile-photo-large"
                />
              ) : (
                <div className="profile-photo-placeholder">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="profile-info">
                <h4>{displayName}</h4>
                <p className="profile-email">{displayEmail}</p>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-row">
                <span className="detail-label">Full Name:</span>
                <span className="detail-value">
                  {formData.firstName} {formData.lastName}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{displayEmail}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{formData.phone || 'Not set'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Timezone:</span>
                <span className="detail-value">{formData.timezone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Language:</span>
                <span className="detail-value">{formData.language}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date Format:</span>
                <span className="detail-value">{formData.dateFormat}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Time Format:</span>
                <span className="detail-value">{formData.timeFormat}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-edit">
            <div className="form-group">
              <label>Profile Photo</label>
              <div className="photo-upload-section">
                {formData.photoUrl ? (
                  <img
                    src={formData.photoUrl}
                    alt="Profile"
                    className="profile-photo-preview"
                  />
                ) : (
                  <div className="profile-photo-placeholder">
                    {formData.firstName.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="photo-upload-actions">
                  <label className="btn btn-secondary" htmlFor="photo-upload">
                    📷 Upload New Photo
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                  {formData.photoUrl && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '' }))}
                    >
                      🗑️ Remove Photo
                    </button>
                  )}
                </div>
                <p className="help-text">Max 2MB • JPG, PNG, or GIF</p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address (Read-only)</label>
              <input type="email" value={displayEmail} readOnly />
              <p className="help-text">
                ℹ️ Contact administrator to change email address
              </p>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
              />
              <p className="help-text">Format: +1 (XXX) XXX-XXXX</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Timezone</label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleInputChange}
                >
                  <option value="America/Chicago">America/Chicago (CST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Denver">America/Denver (MST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div className="form-group">
                <label>Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date Format</label>
                <select
                  name="dateFormat"
                  value={formData.dateFormat}
                  onChange={handleInputChange}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              <div className="form-group">
                <label>Time Format</label>
                <select
                  name="timeFormat"
                  value={formData.timeFormat}
                  onChange={handleInputChange}
                >
                  <option value="12-hour">12-hour (AM/PM)</option>
                  <option value="24-hour">24-hour</option>
                </select>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={loading}
                data-testid="save-profile-btn"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileTab
