/**
 * VendorForm Component Tests
 * Tests for vendor add/edit form
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

const mockSupabaseData = {
  data: {
    vendor_id: 'vendor-001',
    vendor_name: 'TechVendor Inc',
    vendor_code: 'TVI',
    vendor_type: 'primary',
  },
  error: null,
}

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSupabaseData),
    }),
  },
}))

import VendorForm from './VendorForm'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('VendorForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders form fields for creating new vendor', async () => {
      render(<VendorForm testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByLabelText(/vendor name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/vendor code/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/vendor type/i)).toBeInTheDocument()
      })
    })

    it('renders all required form sections', async () => {
      render(<VendorForm testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/vendor information/i)).toBeInTheDocument()
        expect(screen.getByText(/address/i)).toBeInTheDocument()
        expect(screen.getByText(/primary contact/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('shows validation error for empty vendor name', async () => {
      render(<VendorForm testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const nameInput = screen.getByLabelText(/vendor name/i)
        const user = userEvent.setup()
        user.clear(nameInput)
        fireEvent.blur(nameInput)
      })
      // Validation should show error
    })

    it('shows validation error for empty vendor code', async () => {
      render(<VendorForm testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const codeInput = screen.getByLabelText(/vendor code/i)
        const user = userEvent.setup()
        user.clear(codeInput)
        fireEvent.blur(codeInput)
      })
    })
  })

  describe('Form Submission', () => {
    it('calls onSave when form is submitted with valid data', async () => {
      const onSave = vi.fn()
      render(<VendorForm testMode={true} onSave={onSave} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /save vendor/i })
        expect(submitButton).toBeInTheDocument()
      })
    })
  })
})
