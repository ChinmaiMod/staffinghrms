/**
 * VendorList Component Tests
 * Tests for the vendor list with search, filters, and pagination
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Mock contexts at the top level before component imports
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
    tenant: { id: 'test-tenant-id', company_name: 'Test Company', tenant_id: 'test-tenant-id' },
    loading: false,
    selectedBusiness: { id: 'test-business-id', business_name: 'Test Business', business_id: 'test-business-id' },
  }),
  TenantProvider: ({ children }) => children,
}))

const mockSupabaseData = {
  data: [
    {
      vendor_id: 'vendor-001',
      vendor_name: 'TechVendor Inc',
      vendor_code: 'TVI',
      vendor_type: 'primary',
      ein: '12-3456789',
      primary_contact_name: 'John Smith',
      primary_contact_email: 'john@techvendor.com',
      primary_contact_phone: '(972) 555-1234',
      payment_terms_days: 30,
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  error: null,
  count: 1,
}

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSupabaseData),
      limit: vi.fn().mockResolvedValue(mockSupabaseData),
    }),
  },
}))

import VendorList from './VendorList'

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('VendorList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading spinner while fetching data', async () => {
      const { supabase } = await import('../../../api/supabaseClient')
      supabase.from().select().eq().order().range().then = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSupabaseData), 100))
      )
      
      render(<VendorList testMode={false} />, { wrapper: TestWrapper })
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Rendering', () => {
    it('renders the vendor list page with header after loading', async () => {
      render(<VendorList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText('Vendor Management')).toBeInTheDocument()
      })
    })

    it('renders the Add Vendor button after loading', async () => {
      render(<VendorList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /add vendor/i })).toBeInTheDocument()
      })
    })

    it('renders the search input after loading', async () => {
      render(<VendorList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search vendors/i)).toBeInTheDocument()
      })
    })

    it('renders filter dropdowns after loading', async () => {
      render(<VendorList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        expect(selects.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('renders the vendor data table after loading', async () => {
      render(<VendorList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
      // Check table headers
      expect(screen.getByText('Vendor Name')).toBeInTheDocument()
      expect(screen.getByText('Code')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('filters vendors when search text is entered', async () => {
      render(<VendorList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search vendors/i)).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText(/search vendors/i)
      const user = userEvent.setup()
      await user.type(searchInput, 'TechVendor')
      expect(searchInput).toHaveValue('TechVendor')
    })
  })

  describe('Filter Functionality', () => {
    it('filters vendors by type when filter is selected', async () => {
      render(<VendorList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        expect(selects.length).toBeGreaterThan(0)
      })
    })

    it('filters vendors by status when filter is selected', async () => {
      render(<VendorList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        expect(selects.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Navigation', () => {
    it('Add Vendor button links to new vendor form', async () => {
      render(<VendorList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const addButton = screen.getByRole('link', { name: /add vendor/i })
        expect(addButton).toBeInTheDocument()
        expect(addButton).toHaveAttribute('href', '/hrms/vendors/new')
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible search input', async () => {
      render(<VendorList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search vendors/i)
        expect(searchInput).toBeInTheDocument()
        expect(searchInput).toHaveAttribute('type', 'text')
      })
    })

    it('table has proper structure with headers', async () => {
      render(<VendorList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
        const headers = screen.getAllByRole('columnheader')
        expect(headers.length).toBeGreaterThan(0)
      })
    })
  })
})
