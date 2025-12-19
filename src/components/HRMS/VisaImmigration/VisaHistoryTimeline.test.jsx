/**
 * VisaHistoryTimeline Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

vi.mock('../../../api/supabaseClient', () => {
  const mockVisaHistory = [
    {
      visa_status_id: 'visa-001',
      visa_type_name: 'H1B - Specialty Occupation',
      receipt_number: 'WAC-24-123-45678',
      start_date: '2024-01-01',
      end_date: '2026-12-15',
      visa_status: 'active',
      is_current: true,
    },
    {
      visa_status_id: 'visa-002',
      visa_type_name: 'H1B Extension',
      receipt_number: 'WAC-21-098-76543',
      start_date: '2021-10-01',
      end_date: '2023-12-31',
      visa_status: 'expired',
      is_current: false,
    },
  ]

  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockVisaHistory,
          error: null,
        }),
      }),
    },
  }
})

import VisaHistoryTimeline from './VisaHistoryTimeline'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('VisaHistoryTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner while fetching visa history', () => {
    render(<VisaHistoryTimeline employeeId="emp-001" />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders visa history timeline after loading', async () => {
    render(<VisaHistoryTimeline employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/H1B - Specialty Occupation/i)).toBeInTheDocument()
      expect(screen.getByText(/H1B Extension/i)).toBeInTheDocument()
    })
  })

  it('displays current visa status correctly', async () => {
    render(<VisaHistoryTimeline employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Active/i)).toBeInTheDocument()
    })
  })

  it('displays expired visa status correctly', async () => {
    render(<VisaHistoryTimeline employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Expired/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no visa history', async () => {
    const { supabase } = await import('../../../api/supabaseClient')
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })

    render(<VisaHistoryTimeline employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/No visa history found/i)).toBeInTheDocument()
    })
  })
})
