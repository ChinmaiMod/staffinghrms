/**
 * ClientContactModal Component Tests
 * Tests for the add/edit client contact modal
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
    profile: { id: 'test-profile-id', tenant_id: 'test-tenant-id' },
  }),
}))

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { tenant_id: 'test-tenant-id', company_name: 'Test Company' },
    loading: false,
    selectedBusiness: { business_id: 'test-business-id', business_name: 'Test Business' },
  }),
}))

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
    }),
  },
}))

import ClientContactModal from './ClientContactModal'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('ClientContactModal', () => {
  const onClose = vi.fn()
  const onSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal title', () => {
    render(<ClientContactModal isOpen={true} onClose={onClose} onSuccess={onSuccess} clientId="client-1" />, {
      wrapper: TestWrapper,
    })

    expect(screen.getByText(/add client contact/i)).toBeInTheDocument()
  })

  it('renders form fields', () => {
    render(<ClientContactModal isOpen={true} onClose={onClose} onSuccess={onSuccess} clientId="client-1" />, {
      wrapper: TestWrapper,
    })

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty required fields', async () => {
    render(<ClientContactModal isOpen={true} onClose={onClose} onSuccess={onSuccess} clientId="client-1" />, {
      wrapper: TestWrapper,
    })

    const submitButton = screen.getByRole('button', { name: /save contact/i })
    const user = userEvent.setup()
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    render(<ClientContactModal isOpen={true} onClose={onClose} onSuccess={onSuccess} clientId="client-1" />, {
      wrapper: TestWrapper,
    })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/email/i), 'john.doe@acme.com')
    await user.type(screen.getByLabelText(/phone/i), '+1-555-1234')

    const submitButton = screen.getByRole('button', { name: /save contact/i })
    await user.click(submitButton)

    await waitFor(() => {
      // Form submission should trigger onSuccess callback
      expect(onSuccess).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('calls onClose when Cancel is clicked', async () => {
    render(<ClientContactModal isOpen={true} onClose={onClose} onSuccess={onSuccess} clientId="client-1" />, {
      wrapper: TestWrapper,
    })

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    const user = userEvent.setup()
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })
})
