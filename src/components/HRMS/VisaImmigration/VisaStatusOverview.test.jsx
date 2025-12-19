/**
 * VisaStatusOverview Component Tests
 * Tests for displaying current visa status
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock contexts
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
    selectedBusiness: { business_id: 'test-business-id', business_name: 'Test Business' },
  }),
}))

// Mock Supabase
vi.mock('../../../api/supabaseClient', () => {
  const mockVisaStatus = {
    visa_status_id: 'visa-001',
    visa_type_name: 'H1B - Specialty Occupation',
    receipt_number: 'WAC-24-123-45678',
    petition_number: 'PET-2024-00123',
    case_number: 'I-129-2024-00456',
    start_date: '2024-01-01',
    end_date: '2026-12-15',
    visa_status: 'active',
    is_current: true,
  }

  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockVisaStatus,
          error: null,
        }),
        single: vi.fn().mockResolvedValue({
          data: mockVisaStatus,
          error: null,
        }),
      }),
    },
  }
})

import VisaStatusOverview from './VisaStatusOverview'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('VisaStatusOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner while fetching visa status', () => {
    render(<VisaStatusOverview employeeId="emp-001" />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders current visa status after loading', async () => {
    render(<VisaStatusOverview employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/H1B - Specialty Occupation/i)).toBeInTheDocument()
      expect(screen.getByText(/WAC-24-123-45678/i)).toBeInTheDocument()
      expect(screen.getByText(/PET-2024-00123/i)).toBeInTheDocument()
    })
  })

  it('displays visa validity period', async () => {
    render(<VisaStatusOverview employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      // Check that dates are displayed (format may vary by locale/timezone)
      expect(screen.getByText(/Start Date/i)).toBeInTheDocument()
      expect(screen.getByText(/Expiry Date/i)).toBeInTheDocument()
      expect(screen.getByText(/2024/i)).toBeInTheDocument()
      expect(screen.getByText(/2026/i)).toBeInTheDocument()
    })
  })

  it('shows active status badge', async () => {
    render(<VisaStatusOverview employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      const statusBadge = screen.getByText(/Active/i)
      expect(statusBadge).toBeInTheDocument()
    })
  })

  it('displays time remaining progress bar', async () => {
    render(<VisaStatusOverview employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Time Remaining/i)).toBeInTheDocument()
    })
  })

  it('shows message when no visa status found', async () => {
    const { supabase } = await import('../../../api/supabaseClient')
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })

    render(<VisaStatusOverview employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/No visa status found/i)).toBeInTheDocument()
    })
  })

  it('handles error when fetching visa status', async () => {
    const { supabase } = await import('../../../api/supabaseClient')
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Failed to fetch visa status' },
      }),
    })

    render(<VisaStatusOverview employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch visa status/i)).toBeInTheDocument()
    })
  })
})
