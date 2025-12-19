/**
 * VendorDetail Component Tests
 * Tests for vendor detail view
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock contexts
vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
    profile: { id: 'test-profile-id', tenant_id: 'test-tenant-id' },
  }),
}))

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { id: 'test-tenant-id', company_name: 'Test Company', tenant_id: 'test-tenant-id' },
    loading: false,
    selectedBusiness: { id: 'test-business-id', business_name: 'Test Business', business_id: 'test-business-id' },
  }),
}))

const mockVendorData = {
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
}

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockVendorData, error: null }),
    }),
  },
}))

import VendorDetail from './VendorDetail'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('VendorDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders vendor detail page with vendor name', async () => {
      render(<VendorDetail vendorId="vendor-001" testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText('TechVendor Inc')).toBeInTheDocument()
      })
    })

    it('renders vendor information sections', async () => {
      render(<VendorDetail vendorId="vendor-001" testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/company information/i)).toBeInTheDocument()
        expect(screen.getByText(/payment terms/i)).toBeInTheDocument()
      })
    })

    it('renders tabs for different views', async () => {
      render(<VendorDetail vendorId="vendor-001" testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/overview/i)).toBeInTheDocument()
        expect(screen.getByText(/projects/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner while fetching vendor data', () => {
      render(<VendorDetail vendorId="vendor-001" testMode={false} />, { wrapper: TestWrapper })
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })
})
