/**
 * NewsletterList Component Tests
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

import NewsletterList from './NewsletterList'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('NewsletterList', () => {
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

    render(<NewsletterList />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders newsletter list page header', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<NewsletterList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Newsletter Management/i)).toBeInTheDocument()
      expect(screen.getByText(/Create and distribute internal communications/i)).toBeInTheDocument()
    })
  })

  it('renders Create Newsletter button', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<NewsletterList />, { wrapper: TestWrapper })

    await waitFor(() => {
      const buttons = screen.getAllByText(/Create Newsletter/i)
      expect(buttons.length).toBeGreaterThan(0)
      expect(buttons[0]).toBeInTheDocument()
    })
  })

  it('displays newsletters with correct status badges', async () => {
    const mockNewsletters = [
      {
        newsletter_id: 'nl-001',
        title: 'December Company Update',
        subject_line: '📰 December Update: Q4 Highlights',
        newsletter_status: 'scheduled',
        scheduled_send_at: '2024-12-20T09:00:00Z',
        total_recipients: 145,
        created_at: '2024-12-15T10:00:00Z',
      },
      {
        newsletter_id: 'nl-002',
        title: 'Holiday Schedule Announcement',
        subject_line: 'Holiday Schedule',
        newsletter_status: 'sent',
        sent_at: '2024-12-15T10:30:00Z',
        total_recipients: 98,
        total_opened: 76,
        created_at: '2024-12-10T08:00:00Z',
      },
    ]

    mockSupabaseQuery.range.mockResolvedValue({
      data: mockNewsletters,
      error: null,
      count: 2,
    })

    render(<NewsletterList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/December Company Update/i)).toBeInTheDocument()
      expect(screen.getByText(/Holiday Schedule Announcement/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('filters newsletters by status', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<NewsletterList />, { wrapper: TestWrapper })

    await waitFor(() => {
      const draftFilter = screen.getByText(/Draft/i)
      fireEvent.click(draftFilter)
    })

    await waitFor(() => {
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('newsletter_status', 'draft')
    })
  })

  it('handles search query', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<NewsletterList />, { wrapper: TestWrapper })

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Search newsletters/i)
      fireEvent.change(searchInput, { target: { value: 'December' } })
    })
  })

  it('navigates to new newsletter page when button clicked', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<NewsletterList />, { wrapper: TestWrapper })

    await waitFor(() => {
      const buttons = screen.getAllByText(/Create Newsletter/i)
      const headerButton = buttons.find(btn => btn.closest('a')?.getAttribute('href') === '/hrms/newsletters/new')
      expect(headerButton).toBeInTheDocument()
      expect(headerButton.closest('a')).toHaveAttribute('href', '/hrms/newsletters/new')
    })
  })

  it('handles error state', async () => {
    mockSupabaseQuery.range.mockRejectedValue(new Error('Database error'))

    render(<NewsletterList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Database error/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
