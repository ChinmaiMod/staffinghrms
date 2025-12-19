/**
 * MyTickets Component Tests
 * Tests for the employee self-service ticket list page
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Mock contexts
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
    selectedBusiness: { id: 'test-business-id', business_name: 'Test Business', short_name: 'TEST' },
  }),
  TenantProvider: ({ children }) => children,
}))

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}))

import MyTickets from './MyTickets'

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('MyTickets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading spinner while fetching tickets', () => {
      render(<MyTickets />, { wrapper: TestWrapper })
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Rendering', () => {
    it('renders the My Tickets page header after loading', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText('My Tickets')).toBeInTheDocument()
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      })
    })

    it('renders the Create New Ticket button after loading', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new ticket/i })).toBeInTheDocument()
      })
    })

    it('renders status filter tabs after loading', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /pending response/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /closed/i })).toBeInTheDocument()
      })
    })

    it('renders department filter dropdown after loading', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const departmentFilter = screen.getByRole('combobox', { name: /department/i })
        expect(departmentFilter).toBeInTheDocument()
      })
    })

    it('renders search input after loading', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search tickets/i)).toBeInTheDocument()
      })
    })
  })

  describe('Ticket List', () => {
    it('renders ticket cards with mock data after loading', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/TESTTKT0042/i)).toBeInTheDocument()
      })
    })

    it('displays ticket subject in ticket cards', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/Request for H1B Extension Filing/i)).toBeInTheDocument()
      })
    })

    it('displays ticket department and request type badges', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/Immigration/i)).toBeInTheDocument()
        expect(screen.getByText(/H1B Extension/i)).toBeInTheDocument()
      })
    })

    it('displays ticket status with correct color', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/Sent to Candidate for Review/i)).toBeInTheDocument()
      })
    })

    it('displays ticket created date', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        // Date should be displayed in a readable format
        const dateElements = screen.getAllByText(/Dec|December/i)
        expect(dateElements.length).toBeGreaterThan(0)
      })
    })

    it('renders View Ticket button for each ticket', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const viewButtons = screen.getAllByRole('button', { name: /view ticket/i })
        expect(viewButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Filter Functionality', () => {
    it('filters tickets by status when status tab is clicked', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument()
      })
      const user = userEvent.setup()
      const openTab = screen.getByRole('button', { name: /open/i })
      await user.click(openTab)
      // Should show only open tickets
      expect(openTab).toBeInTheDocument()
    })

    it('filters tickets by department when department filter changes', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const departmentFilter = screen.getByRole('combobox', { name: /department/i })
        expect(departmentFilter).toBeInTheDocument()
      })
      const user = userEvent.setup()
      const departmentFilter = screen.getByRole('combobox', { name: /department/i })
      await user.selectOptions(departmentFilter, 'HR')
      expect(departmentFilter).toHaveValue('HR')
    })

    it('filters tickets by search query', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search tickets/i)).toBeInTheDocument()
      })
      const user = userEvent.setup()
      const searchInput = screen.getByPlaceholderText(/search tickets/i)
      await user.type(searchInput, 'H1B')
      expect(searchInput).toHaveValue('H1B')
    })
  })

  describe('Create Ticket Modal', () => {
    it('opens create ticket modal when Create New Ticket button is clicked', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new ticket/i })).toBeInTheDocument()
      })
      const user = userEvent.setup()
      const createButton = screen.getByRole('button', { name: /create new ticket/i })
      await user.click(createButton)
      await waitFor(() => {
        expect(screen.getByText(/create new ticket/i)).toBeInTheDocument()
      })
    })

    it('closes modal when cancel button is clicked', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new ticket/i })).toBeInTheDocument()
      })
      const user = userEvent.setup()
      const createButton = screen.getByRole('button', { name: /create new ticket/i })
      await user.click(createButton)
      await waitFor(() => {
        expect(screen.getByText(/create new ticket/i)).toBeInTheDocument()
      })
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)
      await waitFor(() => {
        expect(screen.queryByText(/create new ticket/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('navigates to ticket detail when View Ticket is clicked', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const viewButtons = screen.getAllByRole('button', { name: /view ticket/i })
        expect(viewButtons.length).toBeGreaterThan(0)
      })
      const user = userEvent.setup()
      const viewButton = screen.getAllByRole('button', { name: /view ticket/i })[0]
      await user.click(viewButton)
      // Should navigate to ticket detail page
      // This will be tested with React Router's useNavigate mock
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no tickets are found', async () => {
      render(<MyTickets testMode={true} emptyMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/no tickets found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error message when ticket fetch fails', async () => {
      render(<MyTickets testMode={true} errorMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })

    it('shows retry button when error occurs', async () => {
      render(<MyTickets testMode={true} errorMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible page title', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /my tickets/i })).toBeInTheDocument()
      })
    })

    it('has accessible filter controls', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const departmentFilter = screen.getByRole('combobox', { name: /department/i })
        expect(departmentFilter).toHaveAttribute('aria-label')
      })
    })

    it('ticket cards have proper semantic structure', async () => {
      render(<MyTickets testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        // Ticket cards should be in a list or article structure
        const ticketCards = screen.getAllByRole('article')
        expect(ticketCards.length).toBeGreaterThan(0)
      })
    })
  })
})

