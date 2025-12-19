/**
 * DependentsManagement Component Tests
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
  const mockDependents = [
    {
      dependent_id: 'dep-001',
      first_name: 'Jane',
      last_name: 'Smith',
      relationship: 'spouse',
      date_of_birth: '1992-03-15',
      visa_type: 'H4',
      visa_status: 'active',
      visa_expiry_date: '2026-12-15',
      email: 'jane.smith@email.com',
      phone: '+1 (555) 123-4568',
    },
    {
      dependent_id: 'dep-002',
      first_name: 'Tom',
      last_name: 'Smith',
      relationship: 'child',
      date_of_birth: '2018-08-20',
      visa_type: 'H4',
      visa_status: 'active',
      visa_expiry_date: '2026-12-15',
    },
  ]

  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockDependents,
          error: null,
        }),
        delete: vi.fn().mockReturnThis(),
      }),
    },
  }
})

import DependentsManagement from './DependentsManagement'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('DependentsManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner while fetching dependents', () => {
    render(<DependentsManagement employeeId="emp-001" />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders dependents list after loading', async () => {
    render(<DependentsManagement employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument()
      expect(screen.getByText(/Tom Smith/i)).toBeInTheDocument()
    })
  })

  it('displays relationship information', async () => {
    render(<DependentsManagement employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Spouse/i)).toBeInTheDocument()
      expect(screen.getByText(/Child/i)).toBeInTheDocument()
    })
  })

  it('displays visa status for dependents', async () => {
    render(<DependentsManagement employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/H4/i)).toBeInTheDocument()
      expect(screen.getByText(/Active/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no dependents', async () => {
    const { supabase } = await import('../../../api/supabaseClient')
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    })

    render(<DependentsManagement employeeId="emp-001" />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/No dependents found/i)).toBeInTheDocument()
    })
  })
})
