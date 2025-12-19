/**
 * IssueManagement Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

const mockIssues = [
  {
    issue_id: 'test-issue-1',
    title: 'Critical Issue',
    description: 'This is a critical issue',
    severity: 'critical',
    status: 'open',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    issue_id: 'test-issue-2',
    title: 'High Priority Issue',
    description: 'This is a high priority issue',
    severity: 'high',
    status: 'in_progress',
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    issue_id: 'test-issue-3',
    title: 'Resolved Issue',
    description: 'This issue is resolved',
    severity: 'medium',
    status: 'resolved',
    created_at: '2024-01-03T00:00:00Z',
    resolved_at: '2024-01-04T00:00:00Z',
  },
]

const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: mockIssues, error: null }),
}

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
  },
}))

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: vi.fn(() => ({
    tenant: { tenant_id: 'test-tenant-id' },
  })),
}))

vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
  })),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  }
})

import IssueManagement from './IssueManagement'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('IssueManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseQuery.select.mockReturnThis()
    mockSupabaseQuery.eq.mockReturnThis()
    mockSupabaseQuery.order.mockResolvedValue({ data: mockIssues, error: null })
    mockSupabaseQuery.update.mockResolvedValue({ error: null })
  })

  it('renders the management page', async () => {
    render(
      <TestWrapper>
        <IssueManagement />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Issue Management/i)).toBeInTheDocument()
    })
  })

  it('displays statistics', async () => {
    render(
      <TestWrapper>
        <IssueManagement />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Total Issues/i)).toBeInTheDocument()
      expect(screen.getByText(/Open/i)).toBeInTheDocument()
      expect(screen.getByText(/In Progress/i)).toBeInTheDocument()
      expect(screen.getByText(/Resolved/i)).toBeInTheDocument()
    })
  })

  it('displays critical issues section', async () => {
    render(
      <TestWrapper>
        <IssueManagement />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Critical & High Priority Issues/i)).toBeInTheDocument()
      expect(screen.getByText(/Critical Issue/i)).toBeInTheDocument()
    })
  })

  it('filters issues by status', async () => {
    render(
      <TestWrapper>
        <IssueManagement />
      </TestWrapper>
    )

    await waitFor(() => {
      const openFilter = screen.getByText(/Open/i)
      fireEvent.click(openFilter)
    })

    await waitFor(() => {
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'open')
    })
  })

  it('opens update modal when update button is clicked', async () => {
    render(
      <TestWrapper>
        <IssueManagement />
      </TestWrapper>
    )

    await waitFor(() => {
      const updateButtons = screen.getAllByText(/Update/i)
      fireEvent.click(updateButtons[0])
    })

    await waitFor(() => {
      expect(screen.getByText(/Update Issue/i)).toBeInTheDocument()
    })
  })

  it('updates issue status', async () => {
    render(
      <TestWrapper>
        <IssueManagement />
      </TestWrapper>
    )

    await waitFor(() => {
      const updateButtons = screen.getAllByText(/Update/i)
      fireEvent.click(updateButtons[0])
    })

    await waitFor(() => {
      const statusSelect = screen.getByLabelText(/Status/i)
      fireEvent.change(statusSelect, { target: { value: 'resolved' } })

      const resolutionTextarea = screen.getByLabelText(/Response \/ Resolution/i)
      fireEvent.change(resolutionTextarea, { target: { value: 'Issue has been resolved' } })

      const saveButton = screen.getByText(/Save & Update Status/i)
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(mockSupabaseQuery.update).toHaveBeenCalled()
    })
  })
})
