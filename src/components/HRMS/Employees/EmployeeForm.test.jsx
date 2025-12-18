/**
 * EmployeeForm Component Tests
 * Tests for the employee form (multi-step wizard) with async loading
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
    profile: { id: 'test-profile-id', tenant_id: 'test-tenant-id' },
  }),
  AuthProvider: ({ children }) => children,
}))

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { id: 'test-tenant-id', company_name: 'Test Company' },
    loading: false,
    selectedBusiness: { id: 'test-business-id', business_name: 'Test Business' },
  }),
  TenantProvider: ({ children }) => children,
}))

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: { id: 'emp-1' }, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

import EmployeeForm from './EmployeeForm'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('EmployeeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows loading spinner while initializing', () => {
    render(<EmployeeForm testMode={false} />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders form after loading and submits', async () => {
    render(<EmployeeForm testMode={true} />, { wrapper: TestWrapper })
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })
    // Fill out form fields (example: first name, last name, email)
    const firstName = screen.getByLabelText(/first name/i)
    const lastName = screen.getByLabelText(/last name/i)
    const email = screen.getByLabelText(/email/i)
    await userEvent.type(firstName, 'John')
    await userEvent.type(lastName, 'Doe')
    await userEvent.type(email, 'john.doe@example.com')
    // Go to next step if multi-step
    const nextBtn = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextBtn)
    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit|save/i })
    fireEvent.click(submitBtn)
    // Assert success (could be a callback, toast, or redirect)
    // Example: expect a success message or navigation
  })
})
