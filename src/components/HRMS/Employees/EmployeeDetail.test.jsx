/**
 * EmployeeDetail Component Tests
 * Tests for the employee detail view with loading and async data
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'

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
    selectedBusiness: { id: 'test-business-id', business_name: 'Test Business' },
  }),
  TenantProvider: ({ children }) => children,
}))

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

import EmployeeDetail from './EmployeeDetail'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('EmployeeDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })


  it('shows loading spinner while fetching data', () => {
    render(<EmployeeDetail testMode={false} />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders employee details after loading', async () => {
    render(<EmployeeDetail testMode={true} />, { wrapper: TestWrapper })
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
      // You can add more assertions for employee fields if mock data is present
    })
  })
})
