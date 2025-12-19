/**
 * DependentForm Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'admin@example.com' },
    loading: false,
  }),
}))

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { tenant_id: 'test-tenant-id', company_name: 'Test Company' },
    loading: false,
  }),
}))

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: { dependent_id: 'dep-001' }, error: null }),
      update: vi.fn().mockResolvedValue({ data: { dependent_id: 'dep-001' }, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          dependent_id: 'dep-001',
          first_name: 'Jane',
          last_name: 'Smith',
          relationship: 'spouse',
          date_of_birth: '1992-03-15',
          visa_type: 'H4',
          visa_status: 'active',
        },
        error: null,
      }),
    }),
  },
}))

import DependentForm from './DependentForm'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('DependentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields for new dependent', () => {
    render(
      <DependentForm employeeId="emp-001" onClose={vi.fn()} onSave={vi.fn()} />,
      { wrapper: TestWrapper }
    )

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/relationship/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument()
  })

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup()
    render(
      <DependentForm employeeId="emp-001" onClose={vi.fn()} onSave={vi.fn()} />,
      { wrapper: TestWrapper }
    )

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/relationship is required/i)).toBeInTheDocument()
    })
  })

  it('validates date of birth is not in future', async () => {
    const user = userEvent.setup()
    render(
      <DependentForm employeeId="emp-001" onClose={vi.fn()} onSave={vi.fn()} />,
      { wrapper: TestWrapper }
    )

    const dobInput = screen.getByLabelText(/date of birth/i)
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    await user.type(dobInput, futureDate.toISOString().split('T')[0])

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/date of birth cannot be in the future/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    
    render(
      <DependentForm employeeId="emp-001" onClose={vi.fn()} onSave={onSave} />,
      { wrapper: TestWrapper }
    )

    await user.type(screen.getByLabelText(/first name/i), 'Jane')
    await user.type(screen.getByLabelText(/last name/i), 'Smith')
    await user.selectOptions(screen.getByLabelText(/relationship/i), 'spouse')
    await user.type(screen.getByLabelText(/date of birth/i), '1992-03-15')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })
  })

  it('loads existing dependent data in edit mode', async () => {
    render(
      <DependentForm
        employeeId="emp-001"
        dependentId="dep-001"
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
      { wrapper: TestWrapper }
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Jane/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue(/Smith/i)).toBeInTheDocument()
    })
  })
})
