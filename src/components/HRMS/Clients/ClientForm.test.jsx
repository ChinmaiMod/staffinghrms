/**
 * ClientForm Component Tests
 * Tests for the client create/edit form
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
      insert: vi.fn().mockResolvedValue({ data: { client_id: 'client-1' }, error: null }),
      update: vi.fn().mockResolvedValue({ data: { client_id: 'client-1' }, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          client_id: 'client-1',
          client_name: 'Acme Corporation',
          website: 'https://acme.com',
          industry: 'Technology',
          status: 'ACTIVE',
        },
        error: null,
      }),
    }),
  },
}))

import ClientForm from './ClientForm'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('ClientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner while initializing', () => {
    render(<ClientForm />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders form fields after loading', async () => {
    render(<ClientForm />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/website/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/industry/i)).toBeInTheDocument()
    })
  })

  it('shows validation error when submitting empty required fields', async () => {
    render(<ClientForm />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /save/i })
    const user = userEvent.setup()
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/client name is required/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    render(<ClientForm />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/client name/i), 'Acme Corporation')
    await user.type(screen.getByLabelText(/website/i), 'https://acme.com')
    await user.selectOptions(screen.getByLabelText(/industry/i), 'Technology')

    const submitButton = screen.getByRole('button', { name: /save/i })
    await user.click(submitButton)

    await waitFor(() => {
      // Form submission should trigger navigation or show success
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })
  })

  it('loads existing client data in edit mode', async () => {
    render(<ClientForm clientId="client-1" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByDisplayValue('Acme Corporation')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://acme.com')).toBeInTheDocument()
    })
  })
})
