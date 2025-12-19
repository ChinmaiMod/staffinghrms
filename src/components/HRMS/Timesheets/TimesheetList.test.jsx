/**
 * TimesheetList Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock Supabase
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
}

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
  },
}))

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: vi.fn(() => ({
    tenant: { tenant_id: 'test-tenant-id' },
    selectedBusiness: { business_id: 'test-business-id' },
  })),
}))

vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
  })),
}))

import TimesheetList from './TimesheetList'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('TimesheetList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseQuery.select.mockReturnThis()
    mockSupabaseQuery.eq.mockReturnThis()
    mockSupabaseQuery.order.mockReturnThis()
    mockSupabaseQuery.range.mockReturnThis()
    mockSupabaseQuery.maybeSingle.mockResolvedValue({ data: null, error: null })
  })

  it('renders loading state initially', () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<TimesheetList />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders timesheet list page header', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/My Timesheets/i)).toBeInTheDocument()
      expect(screen.getByText(/Track and manage your working hours/i)).toBeInTheDocument()
    })
  })

  it('renders current period card when timesheet exists', async () => {
    const mockTimesheet = {
      timesheet_id: 'ts-001',
      period_start_date: '2025-01-13',
      period_end_date: '2025-01-19',
      total_hours_worked: 32,
      regular_hours: 32,
      overtime_hours: 0,
      submission_status: 'draft',
      project: {
        project_name: 'Acme Corp Dev',
      },
    }

    // Mock current period fetch
    mockSupabaseQuery.maybeSingle.mockResolvedValueOnce({
      data: mockTimesheet,
      error: null,
    })

    // Mock list fetch
    mockSupabaseQuery.range.mockResolvedValue({
      data: [mockTimesheet],
      error: null,
      count: 1,
    })

    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Current Period/i)).toBeInTheDocument()
      expect(screen.getByText(/32 \/ 40 hrs/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('renders filters bar', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Project/i)).toBeInTheDocument()
    })
  })

  it('renders New Timesheet button', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/New Timesheet/i)).toBeInTheDocument()
    })
  })

  it('displays timesheet table with data', async () => {
    const mockTimesheets = [
      {
        timesheet_id: 'ts-001',
        period_start_date: '2025-01-06',
        period_end_date: '2025-01-12',
        total_hours_worked: 40,
        regular_hours: 40,
        overtime_hours: 0,
        submission_status: 'approved',
        submitted_at: '2025-01-12T10:00:00Z',
        project: {
          project_name: 'Acme Corp Dev',
        },
      },
    ]

    // Mock current period fetch (no current period)
    mockSupabaseQuery.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    // Mock list fetch
    mockSupabaseQuery.range.mockResolvedValue({
      data: mockTimesheets,
      error: null,
      count: 1,
    })

    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      // Check for project name and hours (date format may vary)
      expect(screen.getByText(/Acme Corp Dev/i)).toBeInTheDocument()
      const tableCells = screen.getAllByText(/40/i)
      expect(tableCells.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('handles error state', async () => {
    // Mock current period fetch (no error, just no data)
    mockSupabaseQuery.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    // Mock list fetch error - need to make range throw
    const mockRange = vi.fn().mockRejectedValue(new Error('Database error'))
    mockSupabaseQuery.range = mockRange

    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      // Error should be displayed in error banner
      expect(screen.getByText(/Database error/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('filters timesheets by status', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      const statusSelect = screen.getByLabelText(/Status/i)
      fireEvent.change(statusSelect, { target: { value: 'submitted' } })
    })

    await waitFor(() => {
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('submission_status', 'submitted')
    })
  })

  it('navigates to new timesheet page when button clicked', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      const newButton = screen.getByText(/New Timesheet/i)
      expect(newButton.closest('a')).toHaveAttribute('href', '/hrms/timesheets/new')
    })
  })
})
