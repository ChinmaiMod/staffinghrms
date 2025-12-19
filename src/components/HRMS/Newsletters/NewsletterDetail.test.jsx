/**
 * NewsletterDetail Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock Supabase
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: vi.fn(() => ({ newsletterId: 'nl-001' })),
  }
})

import NewsletterDetail from './NewsletterDetail'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('NewsletterDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseQuery.select.mockReturnThis()
    mockSupabaseQuery.eq.mockReturnThis()
  })

  it('renders loading state initially', () => {
    mockSupabaseQuery.single.mockResolvedValue({
      data: null,
      error: null,
    })

    render(<NewsletterDetail />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('displays newsletter details', async () => {
    const mockNewsletter = {
      newsletter_id: 'nl-001',
      title: 'December Company Update',
      subject_line: '📰 December Update: Q4 Highlights',
      content_html: '<p>Test content</p>',
      newsletter_status: 'sent',
      sent_at: '2024-12-15T10:30:00Z',
      total_recipients: 98,
      total_opened: 76,
      created_at: '2024-12-10T08:00:00Z',
    }

    mockSupabaseQuery.single.mockResolvedValue({
      data: mockNewsletter,
      error: null,
    })

    render(<NewsletterDetail />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/December Company Update/i)).toBeInTheDocument()
      expect(screen.getByText(/📰 December Update: Q4 Highlights/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('handles error state', async () => {
    mockSupabaseQuery.single.mockRejectedValue(new Error('Database error'))

    render(<NewsletterDetail />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Database error/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
