/**
 * IssueDetail Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

const mockIssue = {
  issue_id: 'test-issue-id',
  title: 'Test Issue',
  description: 'This is a test issue description',
  severity: 'high',
  status: 'open',
  issue_type: 'bug',
  reported_by_user_id: 'test-user-id',
  steps_to_reproduce: 'Step 1\nStep 2',
  expected_behavior: 'Expected behavior',
  actual_behavior: 'Actual behavior',
  browser: 'Chrome',
  os: 'Windows',
  screen_resolution: '1920 × 1080',
  page_url: 'https://example.com',
  screenshot_paths: ['https://example.com/screenshot.png'],
  created_at: '2024-01-01T00:00:00Z',
  resolution: null,
  resolved_at: null,
}

const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: mockIssue, error: null }),
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
    useParams: vi.fn(() => ({ issueId: 'test-issue-id' })),
    useNavigate: vi.fn(() => vi.fn()),
  }
})

import IssueDetail from './IssueDetail'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('IssueDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseQuery.select.mockReturnThis()
    mockSupabaseQuery.eq.mockReturnThis()
    mockSupabaseQuery.single.mockResolvedValue({ data: mockIssue, error: null })
  })

  it('renders issue details', async () => {
    render(
      <TestWrapper>
        <IssueDetail />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Test Issue/i)).toBeInTheDocument()
      expect(screen.getByText(/This is a test issue description/i)).toBeInTheDocument()
    })
  })

  it('displays severity and status badges', async () => {
    render(
      <TestWrapper>
        <IssueDetail />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/High/i)).toBeInTheDocument()
      expect(screen.getByText(/Open/i)).toBeInTheDocument()
    })
  })

  it('displays steps to reproduce', async () => {
    render(
      <TestWrapper>
        <IssueDetail />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Steps to Reproduce/i)).toBeInTheDocument()
      expect(screen.getByText(/Step 1/i)).toBeInTheDocument()
    })
  })

  it('displays system information', async () => {
    render(
      <TestWrapper>
        <IssueDetail />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Browser:/i)).toBeInTheDocument()
      expect(screen.getByText(/Chrome/i)).toBeInTheDocument()
      expect(screen.getByText(/Windows/i)).toBeInTheDocument()
    })
  })

  it('displays screenshots when available', async () => {
    render(
      <TestWrapper>
        <IssueDetail />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Screenshots/i)).toBeInTheDocument()
      const img = screen.getByAltText(/Screenshot 1/i)
      expect(img).toHaveAttribute('src', 'https://example.com/screenshot.png')
    })
  })

  it('displays resolution when resolved', async () => {
    const resolvedIssue = {
      ...mockIssue,
      status: 'resolved',
      resolution: 'This issue has been resolved',
      resolved_at: '2024-01-02T00:00:00Z',
    }

    mockSupabaseQuery.single.mockResolvedValue({ data: resolvedIssue, error: null })

    render(
      <TestWrapper>
        <IssueDetail />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Support Response/i)).toBeInTheDocument()
      expect(screen.getByText(/This issue has been resolved/i)).toBeInTheDocument()
    })
  })

  it('shows error when issue not found', async () => {
    mockSupabaseQuery.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })

    render(
      <TestWrapper>
        <IssueDetail />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Issue not found/i)).toBeInTheDocument()
    })
  })
})
