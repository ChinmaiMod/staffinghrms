/**
 * TimesheetList Component Tests (HRMS Read-only View)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

vi.mock('../../../api/supabaseClient', () => {
  const createMockQuery = (finalResult) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue(finalResult || { data: [], error: null, count: 0 }),
  })

  const mockFrom = vi.fn((table) => {
    if (table === 'hrms_employees') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { employee_id: 'emp-001', first_name: 'John', last_name: 'Smith', employee_code: 'IES00012' },
          ],
          error: null,
        }),
      }
    }
    if (table === 'hrms_projects') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            { project_id: 'project-001', project_name: 'Acme Corp Dev' },
          ],
          error: null,
        }),
      }
    }
    // Default for hrms_timesheets
    return createMockQuery()
  })

  return {
    supabase: {
      from: mockFrom,
    },
  }
})

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: vi.fn(() => ({
    tenant: { tenant_id: 'test-tenant-id' },
    selectedBusiness: { business_id: 'test-business-id' },
  })),
}))

import TimesheetList from './TimesheetList'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('TimesheetList (HRMS Read-only)', () => {
  let mockFrom

  beforeEach(async () => {
    vi.clearAllMocks()
    // Get the mock from the module
    const { supabase } = await import('../../../api/supabaseClient')
    mockFrom = supabase.from
  })

  it('renders loading state initially', () => {
    render(<TimesheetList />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders timesheet list page header', async () => {
    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      const headers = screen.getAllByText(/Timesheets/i)
      expect(headers.length).toBeGreaterThan(0)
      expect(screen.getByText(/View and download employee timesheets/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('renders export Excel button', async () => {
    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Export Excel/i)).toBeInTheDocument()
    })
  })

  it('renders filters bar with period, employee, status, and project filters', async () => {
    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByLabelText(/Period Type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Employee/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Project/i)).toBeInTheDocument()
    })
  })

  it('displays timesheet table with employee information', async () => {
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
        employee: {
          employee_id: 'emp-001',
          first_name: 'John',
          last_name: 'Smith',
          employee_code: 'IES00012',
        },
        project: {
          project_name: 'Acme Corp Dev',
        },
      },
    ]

    mockFrom.mockImplementation((table) => {
      if (table === 'hrms_employees') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              { employee_id: 'emp-001', first_name: 'John', last_name: 'Smith', employee_code: 'IES00012' },
            ],
            error: null,
          }),
        }
      }
      if (table === 'hrms_projects') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [
              { project_id: 'project-001', project_name: 'Acme Corp Dev' },
            ],
            error: null,
          }),
        }
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockTimesheets, error: null, count: 1 }),
      }
    })

    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      const johnSmithElements = screen.getAllByText(/John Smith/i)
      expect(johnSmithElements.length).toBeGreaterThan(0)
      const employeeCodes = screen.getAllByText(/IES00012/i)
      expect(employeeCodes.length).toBeGreaterThan(0)
      const projectNames = screen.getAllByText(/Acme Corp Dev/i)
      expect(projectNames.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('does not show create/edit buttons (read-only)', async () => {
    render(<TimesheetList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.queryByText(/New Timesheet/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Edit/i)).not.toBeInTheDocument()
    })
  })
})
