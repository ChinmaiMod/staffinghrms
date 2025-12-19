import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ProfileTab from './ProfileTab'
import { supabase } from '../../../api/supabaseClient'

vi.mock('../../../api/supabaseClient')

describe('ProfileTab', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  }

  const mockProfile = {
    id: 'user-123',
    full_name: 'Test User',
    phone_number: '+1 (555) 123-4567',
  }

  const mockPreferences = {
    timezone: 'America/Chicago',
    language: 'en-US',
    date_format: 'MM/DD/YYYY',
    time_format: '12-hour',
    photo_url: null,
  }

  const mockOnUpdate = vi.fn().mockResolvedValue({ data: {}, error: null })

  beforeEach(() => {
    vi.clearAllMocks()
    supabase.from.mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    supabase.storage = {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg' } }),
      }),
    }
  })

  it('renders profile tab', () => {
    render(
      <ProfileTab
        user={mockUser}
        profile={mockProfile}
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.getByTestId('profile-tab')).toBeInTheDocument()
  })

  it('displays user information', () => {
    render(
      <ProfileTab
        user={mockUser}
        profile={mockProfile}
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('shows edit button when not editing', () => {
    render(
      <ProfileTab
        user={mockUser}
        profile={mockProfile}
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    )

    expect(screen.getByTestId('edit-profile-btn')).toBeInTheDocument()
  })

  it('enters edit mode when edit button is clicked', async () => {
    render(
      <ProfileTab
        user={mockUser}
        profile={mockProfile}
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    )

    const editButton = screen.getByTestId('edit-profile-btn')
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByTestId('save-profile-btn')).toBeInTheDocument()
    })
  })

  it('validates required fields', async () => {
    render(
      <ProfileTab
        user={mockUser}
        profile={mockProfile}
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    )

    const editButton = screen.getByTestId('edit-profile-btn')
    fireEvent.click(editButton)

    await waitFor(() => {
      const firstNameInput = screen.getByLabelText(/first name/i)
      fireEvent.change(firstNameInput, { target: { value: '' } })
    })

    const saveButton = screen.getByTestId('save-profile-btn')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/first name and last name are required/i)).toBeInTheDocument()
    })
  })

  it('saves profile changes', async () => {
    render(
      <ProfileTab
        user={mockUser}
        profile={mockProfile}
        preferences={mockPreferences}
        onUpdate={mockOnUpdate}
      />
    )

    const editButton = screen.getByTestId('edit-profile-btn')
    fireEvent.click(editButton)

    await waitFor(() => {
      const firstNameInput = screen.getByLabelText(/first name/i)
      fireEvent.change(firstNameInput, { target: { value: 'Updated' } })
    })

    const saveButton = screen.getByTestId('save-profile-btn')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(mockOnUpdate).toHaveBeenCalled()
    })
  })
})
