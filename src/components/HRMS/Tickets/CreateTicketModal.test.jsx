/**
 * CreateTicketModal Component Tests
 * Tests for the ticket creation modal form
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock contexts
vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
  }),
}))

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { id: 'test-tenant-id' },
    selectedBusiness: { id: 'test-business-id', short_name: 'TEST' },
  }),
}))

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
  },
}))

import CreateTicketModal from './CreateTicketModal'

describe('CreateTicketModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the modal when open', () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      expect(screen.getByText(/create new ticket/i)).toBeInTheDocument()
    })

    it('renders department dropdown', () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      expect(screen.getByLabelText(/department/i)).toBeInTheDocument()
    })

    it('renders request type dropdown', () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      expect(screen.getByLabelText(/request type/i)).toBeInTheDocument()
    })

    it('renders subject input', () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    })

    it('renders description textarea', () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    })

    it('renders file upload area', () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      expect(screen.getByText(/drag & drop files/i)).toBeInTheDocument()
    })

    it('renders cancel and submit buttons', () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /submit ticket/i })).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('shows validation error when department is not selected', async () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const user = userEvent.setup()
      const submitButton = screen.getByRole('button', { name: /submit ticket/i })
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/please select a department/i)).toBeInTheDocument()
      })
    })

    it('shows validation error when request type is not selected', async () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const user = userEvent.setup()
      const departmentSelect = screen.getByLabelText(/department/i)
      await user.selectOptions(departmentSelect, 'HR')
      const submitButton = screen.getByRole('button', { name: /submit ticket/i })
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/please select a request type/i)).toBeInTheDocument()
      })
    })

    it('shows validation error when subject is too short', async () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const user = userEvent.setup()
      const departmentSelect = screen.getByLabelText(/department/i)
      await user.selectOptions(departmentSelect, 'HR')
      const requestTypeSelect = screen.getByLabelText(/request type/i)
      await user.selectOptions(requestTypeSelect, 'Payroll Discrepancy')
      const subjectInput = screen.getByLabelText(/subject/i)
      await user.type(subjectInput, 'Short')
      const submitButton = screen.getByRole('button', { name: /submit ticket/i })
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/subject must be 10-200 characters/i)).toBeInTheDocument()
      })
    })

    it('shows validation error when description is too short', async () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const user = userEvent.setup()
      const departmentSelect = screen.getByLabelText(/department/i)
      await user.selectOptions(departmentSelect, 'HR')
      const requestTypeSelect = screen.getByLabelText(/request type/i)
      await user.selectOptions(requestTypeSelect, 'Payroll Discrepancy')
      const subjectInput = screen.getByLabelText(/subject/i)
      await user.type(subjectInput, 'This is a valid subject that is long enough')
      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'Short')
      const submitButton = screen.getByRole('button', { name: /submit ticket/i })
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/description must be 50-2000 characters/i)).toBeInTheDocument()
      })
    })
  })

  describe('Department and Request Type Interaction', () => {
    it('updates request type options when department changes', async () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const user = userEvent.setup()
      const departmentSelect = screen.getByLabelText(/department/i)
      await user.selectOptions(departmentSelect, 'HR')
      const requestTypeSelect = screen.getByLabelText(/request type/i)
      expect(requestTypeSelect).toBeInTheDocument()
      // HR request types should be available
      expect(screen.getByText(/payroll discrepancy/i)).toBeInTheDocument()
    })

    it('shows immigration request types when immigration department is selected', async () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const user = userEvent.setup()
      const departmentSelect = screen.getByLabelText(/department/i)
      await user.selectOptions(departmentSelect, 'Immigration')
      // Immigration request types should be available
      expect(screen.getByText(/h1b extension/i)).toBeInTheDocument()
    })
  })

  describe('File Upload', () => {
    it('allows file selection', async () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const fileInput = screen.getByLabelText(/attach files/i)
      expect(fileInput).toBeInTheDocument()
    })

    it('displays uploaded file names', async () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const fileInput = screen.getByLabelText(/attach files/i)
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const user = userEvent.setup()
      await user.upload(fileInput, file)
      await waitFor(() => {
        expect(screen.getByText(/test.pdf/i)).toBeInTheDocument()
      })
    })
  })

  describe('Modal Actions', () => {
    it('calls onClose when cancel button is clicked', async () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const user = userEvent.setup()
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when close icon is clicked', async () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const user = userEvent.setup()
      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const user = userEvent.setup()
      
      // Fill in form
      const departmentSelect = screen.getByLabelText(/department/i)
      await user.selectOptions(departmentSelect, 'HR')
      
      const requestTypeSelect = screen.getByLabelText(/request type/i)
      await user.selectOptions(requestTypeSelect, 'Payroll Discrepancy')
      
      const subjectInput = screen.getByLabelText(/subject/i)
      await user.type(subjectInput, 'Payroll Discrepancy - November Overtime')
      
      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'I noticed that my November overtime hours were not included in my last paycheck. I worked 10 hours of overtime during the week of November 15-19, 2025.')
      
      const submitButton = screen.getByRole('button', { name: /submit ticket/i })
      await user.click(submitButton)
      
      // Should call onSuccess after successful submission
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  describe('Accessibility', () => {
    it('has accessible form labels', () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      expect(screen.getByLabelText(/department/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/request type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    })

    it('has proper modal role', () => {
      render(<CreateTicketModal onClose={mockOnClose} onSuccess={mockOnSuccess} />)
      const modal = screen.getByRole('dialog')
      expect(modal).toBeInTheDocument()
    })
  })
})

