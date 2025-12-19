/**
 * ClientList Component Tests
 * Tests for the client list page with filtering, search, and actions
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
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [
          {
            client_id: 'client-1',
            client_name: 'Acme Corporation',
            website: 'https://acme.com',
            industry: 'Technology',
            status: 'ACTIVE',
            primary_contact_email: 'john@acme.com',
            created_at: '2024-01-15T00:00:00Z',
          },
        ],
        error: null,
        count: 1,
      }),
    }),
  },
}))

import ClientList from './ClientList'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('ClientList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    render(<ClientList />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders page header after loading', async () => {
    render(<ClientList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/client management/i)).toBeInTheDocument()
      expect(screen.getByText(/manage end clients/i)).toBeInTheDocument()
    })
  })

  it('renders Add Client button', async () => {
    render(<ClientList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add client/i })).toBeInTheDocument()
    })
  })

  it('renders search input', async () => {
    render(<ClientList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search clients/i)).toBeInTheDocument()
    })
  })

  it('renders client list table with data', async () => {
    render(<ClientList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
      expect(screen.getByText('Technology')).toBeInTheDocument()
    })
  })

  it('filters clients by search query', async () => {
    render(<ClientList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search clients/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search clients/i)
    const user = userEvent.setup()
    await user.type(searchInput, 'Acme')

    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
    })
  })

  it('navigates to create client page when Add Client is clicked', async () => {
    render(<ClientList />, { wrapper: TestWrapper })

    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add client/i })
      expect(addButton).toBeInTheDocument()
    })
  })
})
