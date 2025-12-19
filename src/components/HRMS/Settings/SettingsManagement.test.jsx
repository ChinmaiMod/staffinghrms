import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SettingsManagement from './SettingsManagement'
import { useAuth } from '../../../contexts/AuthProvider'
import { supabase } from '../../../api/supabaseClient'

vi.mock('../../../contexts/AuthProvider')
vi.mock('../../../api/supabaseClient')

describe('SettingsManagement', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockProfile = {
    id: 'user-123',
    tenant_id: 'tenant-123',
    full_name: 'Test User',
    role: 'user',
  }

  const mockPreferences = {
    preference_id: 'pref-123',
    user_id: 'user-123',
    tenant_id: 'tenant-123',
    timezone: 'America/Chicago',
    language: 'en-US',
    date_format: 'MM/DD/YYYY',
    time_format: '12-hour',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      user: mockUser,
      profile: mockProfile,
    })

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
    })
  })

  it('renders settings management component', async () => {
    render(
      <BrowserRouter>
        <SettingsManagement />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('settings-management')).toBeInTheDocument()
    })
  })

  it('displays settings header', async () => {
    render(
      <BrowserRouter>
        <SettingsManagement />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  it('displays profile tab by default', async () => {
    render(
      <BrowserRouter>
        <SettingsManagement />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('settings-tab-profile')).toBeInTheDocument()
    })
  })

  it('displays all user tabs', async () => {
    render(
      <BrowserRouter>
        <SettingsManagement />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('settings-tab-profile')).toBeInTheDocument()
      expect(screen.getByTestId('settings-tab-security')).toBeInTheDocument()
      expect(screen.getByTestId('settings-tab-notifications')).toBeInTheDocument()
    })
  })

  it('loads user preferences on mount', async () => {
    render(
      <BrowserRouter>
        <SettingsManagement />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('hrms_user_preferences')
    })
  })

  it('creates default preferences if none exist', async () => {
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    })

    supabase.from.mockReturnValueOnce({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockPreferences, error: null }),
    })

    render(
      <BrowserRouter>
        <SettingsManagement />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled()
    })
  })
})
