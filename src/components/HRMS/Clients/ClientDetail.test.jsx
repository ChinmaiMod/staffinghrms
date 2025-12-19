/**
 * ClientDetail Component Tests
 * Tests for the client detail page
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

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
      single: vi.fn().mockResolvedValue({
        data: {
          client_id: 'client-1',
          client_name: 'Acme Corporation',
          website: 'https://acme.com',
          industry: 'Technology',
          status: 'ACTIVE',
          primary_contact_email: 'john@acme.com',
          primary_contact_phone: '+1-555-1234',
          address: '123 Tech Park Drive',
          city: 'San Francisco',
          state: 'California',
          country: 'USA',
          postal_code: '94105',
          created_at: '2024-01-15T00:00:00Z',
        },
        error: null,
      }),
    }),
  },
}))

import ClientDetail from './ClientDetail'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('ClientDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    render(<ClientDetail />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders client name after loading', async () => {
    render(<ClientDetail />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
    })
  })

  it('renders client details sections', async () => {
    render(<ClientDetail />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/overview/i)).toBeInTheDocument()
      expect(screen.getByText(/contacts/i)).toBeInTheDocument()
    })
  })

  it('renders Edit Client button', async () => {
    render(<ClientDetail />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit client/i })).toBeInTheDocument()
    })
  })

  it('displays client address information', async () => {
    render(<ClientDetail />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/123 Tech Park Drive/i)).toBeInTheDocument()
      expect(screen.getByText(/San Francisco/i)).toBeInTheDocument()
    })
  })
})
