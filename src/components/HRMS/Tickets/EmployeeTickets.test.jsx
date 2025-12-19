/**
 * EmployeeTickets (admin) Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock contexts
vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'admin@example.com' },
    loading: false,
    profile: { id: 'test-profile-id', tenant_id: 'test-tenant-id' },
  }),
  AuthProvider: ({ children }) => children,
}))

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { tenant_id: 'test-tenant-id', company_name: 'Test Company' },
    loading: false,
    selectedBusiness: { business_id: 'test-business-id', business_name: 'Test Business' },
  }),
  TenantProvider: ({ children }) => children,
}))

// Mock Supabase
const mockTicketsData = [
  {
    ticket_id: 'tkt-0045',
    ticket_number: 'IESTKT0045',
    subject: 'Payroll Discrepancy - Missing December Bonus',
    department: 'HR',
    request_type: 'Payroll Discrepancy',
    status: 'ticket_created',
    priority: 'high',
    created_at: '2025-12-15T10:00:00Z',
    assigned_to: null,
    assigned_team: 'HR_Team',
    employee: {
      employee_id: 'emp-001',
      first_name: 'John',
      last_name: 'Smith',
      employee_code: 'IES00012',
    },
    business: {
      business_id: 'biz-001',
      business_name: 'Intuites LLC',
    },
    comments: [{ count: 0 }],
  },
  {
    ticket_id: 'tkt-0044',
    ticket_number: 'IESTKT0044',
    subject: 'Benefits Enrollment Question',
    department: 'HR',
    request_type: 'Benefits Inquiry',
    status: 'in_team_review',
    priority: 'normal',
    created_at: '2025-12-14T09:00:00Z',
    assigned_to: 'test-user-id',
    assigned_team: 'HR_Team',
    employee: {
      employee_id: 'emp-002',
      first_name: 'Mary',
      last_name: 'Chen',
      employee_code: 'IES00034',
    },
    business: {
      business_id: 'biz-001',
      business_name: 'Intuites LLC',
    },
    comments: [{ count: 3 }],
  },
]

vi.mock('../../../api/supabaseClient', () => {
  const createQueryBuilder = () => {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      not: vi.fn(() => builder),
      order: vi.fn(() => Promise.resolve({ data: mockTicketsData, error: null })),
    }
    return builder
  }

  return {
    supabase: {
      from: vi.fn(() => createQueryBuilder()),
    },
  }
})

import EmployeeTickets from './EmployeeTickets'

const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('EmployeeTickets (admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    render(<EmployeeTickets />, { wrapper: Wrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders page header after loading', async () => {
    render(<EmployeeTickets />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Employee Tickets')).toBeInTheDocument()
      expect(screen.getByText(/manage employee requests/i)).toBeInTheDocument()
    })
  })

  it('renders HR and Immigration tabs with counts', async () => {
    render(<EmployeeTickets />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /HR/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Immigration/i })).toBeInTheDocument()
    })
  })

  it('renders quick stats cards', async () => {
    render(<EmployeeTickets />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText(/New Today/i)).toBeInTheDocument()
      expect(screen.getByText(/In Review/i)).toBeInTheDocument()
      expect(screen.getByText(/Pending Response/i)).toBeInTheDocument()
      expect(screen.getByText(/Avg Resolve/i)).toBeInTheDocument()
    })
  })

  it('renders tickets list with HR tickets by default', async () => {
    render(<EmployeeTickets />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(
        screen.getByText(/Payroll Discrepancy - Missing December Bonus/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/Benefits Enrollment Question/i)).toBeInTheDocument()
    })
  })
})


