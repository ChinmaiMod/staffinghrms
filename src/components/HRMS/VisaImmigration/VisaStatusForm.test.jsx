/**
 * VisaStatusForm Component Tests
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
      insert: vi.fn().mockResolvedValue({ data: { visa_status_id: 'visa-001' }, error: null }),
      update: vi.fn().mockResolvedValue({ data: { visa_status_id: 'visa-001' }, error: null }),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          visa_status_id: 'visa-001',
          visa_type_name: 'H1B - Specialty Occupation',
          receipt_number: 'WAC-24-123-45678',
          start_date: '2024-01-01',
          end_date: '2026-12-15',
          visa_status: 'active',
        },
        error: null,
      }),
    }),
  },
}))

import VisaStatusForm from './VisaStatusForm'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('VisaStatusForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields for new visa status', () => {
    render(
      <VisaStatusForm employeeId="emp-001" onClose={vi.fn()} onSave={vi.fn()} />,
      { wrapper: TestWrapper }
    )

    expect(screen.getByLabelText(/visa type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/visa status/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
  })

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup()
    render(
      <VisaStatusForm employeeId="emp-001" onClose={vi.fn()} onSave={vi.fn()} />,
      { wrapper: TestWrapper }
    )

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/visa type is required/i)).toBeInTheDocument()
      expect(screen.getByText(/start date is required/i)).toBeInTheDocument()
      expect(screen.getByText(/end date is required/i)).toBeInTheDocument()
    })
  })

  it('validates end date is after start date', async () => {
    const user = userEvent.setup()
    render(
      <VisaStatusForm employeeId="emp-001" onClose={vi.fn()} onSave={vi.fn()} />,
      { wrapper: TestWrapper }
    )

    const startDateInput = screen.getByLabelText(/start date/i)
    const endDateInput = screen.getByLabelText(/end date/i)

    await user.type(startDateInput, '2024-12-15')
    await user.type(endDateInput, '2024-01-01')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/end date must be after start date/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    
    render(
      <VisaStatusForm employeeId="emp-001" onClose={vi.fn()} onSave={onSave} />,
      { wrapper: TestWrapper }
    )

    const visaTypeSelect = screen.getByLabelText(/visa type/i)
    const startDateInput = screen.getByLabelText(/start date/i)
    const endDateInput = screen.getByLabelText(/end date/i)

    await user.selectOptions(visaTypeSelect, 'H1B - Specialty Occupation')
    await user.type(startDateInput, '2024-01-01')
    await user.type(endDateInput, '2026-12-15')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })
  })

  it('loads existing visa status data in edit mode', async () => {
    render(
      <VisaStatusForm
        employeeId="emp-001"
        visaStatusId="visa-001"
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
      { wrapper: TestWrapper }
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue(/H1B - Specialty Occupation/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue(/WAC-24-123-45678/i)).toBeInTheDocument()
    })
  })
})
