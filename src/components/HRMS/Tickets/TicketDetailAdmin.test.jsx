/**
 * TicketDetailAdmin Component Tests
 * Tests for the admin ticket detail view with status management
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Mock contexts
vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'admin@example.com' },
    loading: false,
    profile: { id: 'test-profile-id', tenant_id: 'test-tenant-id' },
  }),
  AuthProvider: ({ children }) => children,
}))

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { id: 'test-tenant-id', company_name: 'Test Company' },
    loading: false,
    selectedBusiness: { id: 'test-business-id', business_name: 'Test Business', short_name: 'TEST' },
  }),
  TenantProvider: ({ children }) => children,
}))

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
    }),
  },
}))

import TicketDetailAdmin from './TicketDetailAdmin'

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('TicketDetailAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading spinner while fetching ticket', () => {
      render(<TicketDetailAdmin />, { wrapper: TestWrapper })
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Rendering', () => {
    it('renders ticket detail page header after loading', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/TESTTKT0042/i)).toBeInTheDocument()
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      })
    })

    it('renders back to tickets button', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /back to tickets/i })).toBeInTheDocument()
      })
    })

    it('renders Change Status button', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /change status/i })).toBeInTheDocument()
      })
    })

    it('displays ticket subject', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/Request for H1B Extension Filing/i)).toBeInTheDocument()
      })
    })

    it('displays ticket department, type, and status badges', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/Immigration/i)).toBeInTheDocument()
        expect(screen.getByText(/H1B Extension/i)).toBeInTheDocument()
        expect(screen.getByText(/Sent to Candidate for Review/i)).toBeInTheDocument()
      })
    })

    it('displays employee information', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
        expect(screen.getByText(/john.doe@company.com/i)).toBeInTheDocument()
        expect(screen.getByText(/IES00015/i)).toBeInTheDocument()
      })
    })

    it('displays ticket metadata', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/Ticket ID:/i)).toBeInTheDocument()
        expect(screen.getByText(/Created:/i)).toBeInTheDocument()
        expect(screen.getByText(/Days Open:/i)).toBeInTheDocument()
      })
    })

    it('displays original request description', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/My H1B visa expires/i)).toBeInTheDocument()
      })
    })

    it('displays attachments', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/I-797_copy.pdf/i)).toBeInTheDocument()
      })
    })

    it('displays activity timeline with comments and status changes', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/STATUS CHANGE/i)).toBeInTheDocument()
        expect(screen.getByText(/COMMENT/i)).toBeInTheDocument()
      })
    })

    it('displays add comment form', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type your comment/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /add comment/i })).toBeInTheDocument()
      })
    })
  })

  describe('Status Management', () => {
    it('opens Change Status modal when button is clicked', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /change status/i })).toBeInTheDocument()
      })
      const user = userEvent.setup()
      const changeStatusButton = screen.getByRole('button', { name: /change status/i })
      await user.click(changeStatusButton)
      await waitFor(() => {
        expect(screen.getByText(/change status/i)).toBeInTheDocument()
      })
    })

    it('displays current status in Change Status modal', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /change status/i })).toBeInTheDocument()
      })
      const user = userEvent.setup()
      const changeStatusButton = screen.getByRole('button', { name: /change status/i })
      await user.click(changeStatusButton)
      await waitFor(() => {
        expect(screen.getByText(/current status/i)).toBeInTheDocument()
      })
    })
  })

  describe('Comment Functionality', () => {
    it('allows typing a comment', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type your comment/i)).toBeInTheDocument()
      })
      const user = userEvent.setup()
      const commentInput = screen.getByPlaceholderText(/type your comment/i)
      await user.type(commentInput, 'This is a test comment')
      expect(commentInput).toHaveValue('This is a test comment')
    })

    it('has internal note checkbox', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByLabelText(/internal note/i)).toBeInTheDocument()
      })
    })

    it('has email notification checkbox', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByLabelText(/send email notification/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('back button links to tickets list', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /back to tickets/i })
        expect(backLink).toBeInTheDocument()
        expect(backLink).toHaveAttribute('href', '/hrms/tickets')
      })
    })

    it('view employee profile link navigates to employee detail', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const profileLink = screen.getByRole('link', { name: /view employee profile/i })
        expect(profileLink).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error message when ticket fetch fails', async () => {
      render(<TicketDetailAdmin testMode={true} errorMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })

    it('shows retry button when error occurs', async () => {
      render(<TicketDetailAdmin testMode={true} errorMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })

    it('shows not found message when ticket does not exist', async () => {
      render(<TicketDetailAdmin testMode={true} notFoundMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/not found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible page structure', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('article')).toBeInTheDocument()
      })
    })

    it('has accessible form labels', async () => {
      render(<TicketDetailAdmin testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const commentInput = screen.getByPlaceholderText(/type your comment/i)
        expect(commentInput).toHaveAttribute('aria-label')
      })
    })
  })
})

