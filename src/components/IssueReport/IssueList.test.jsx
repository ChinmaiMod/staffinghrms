/**
 * IssueList Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock Supabase
const mockIssues = [
  {
    issue_id: 'test-issue-1',
    title: 'Test Issue 1',
    description: 'This is a test issue',
    severity: 'high',
    status: 'open',
    reported_by_user_id: 'test-user-id',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    issue_id: 'test-issue-2',
    title: 'Test Issue 2',
    description: 'This is another test issue',
    severity: 'medium',
    status: 'resolved',
    reported_by_user_id: 'other-user-id',
    created_at: '2024-01-02T00:00:00Z',
    resolved_at: '2024-01-03T00:00:00Z',
  },
]

const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
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

import IssueList from './IssueList'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('IssueList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseQuery.select.mockReturnThis()
    mockSupabaseQuery.eq.mockReturnThis()
    mockSupabaseQuery.order.mockResolvedValue({ data: mockIssues, error: null })
  })

  it('renders the issue list', async () => {
    render(
      <TestWrapper>
        <IssueList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Report an Issue/i)).toBeInTheDocument()
    })
  })

  it('displays issues when loaded', async () => {
    render(
      <TestWrapper>
        <IssueList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Test Issue 1/i)).toBeInTheDocument()
      expect(screen.getByText(/Test Issue 2/i)).toBeInTheDocument()
    })
  })

  it('filters issues by status', async () => {
    render(
      <TestWrapper>
        <IssueList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Open/i)).toBeInTheDocument()
    })

    const openFilter = screen.getByText(/Open/i)
    fireEvent.click(openFilter)

    await waitFor(() => {
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'open')
    })
  })

  it('filters issues by my issues', async () => {
    render(
      <TestWrapper>
        <IssueList />
      </TestWrapper>
    )

    await waitFor(() => {
      const myIssuesFilter = screen.getByText(/My Issues/i)
      fireEvent.click(myIssuesFilter)
    })

    await waitFor(() => {
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('reported_by_user_id', 'test-user-id')
    })
  })

  it('shows empty state when no issues', async () => {
    mockSupabaseQuery.order.mockResolvedValue({ data: [], error: null })

    render(
      <TestWrapper>
        <IssueList />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/No issues found/i)).toBeInTheDocument()
    })
  })
})
