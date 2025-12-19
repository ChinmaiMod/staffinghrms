/**
 * SuggestionList Component Tests
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

import SuggestionList from './SuggestionList'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('SuggestionList', () => {
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

    render(<SuggestionList />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders suggestions list page header', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<SuggestionList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Suggestions & Ideas/i)).toBeInTheDocument()
    })
  })

  it('renders New Suggestion button', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<SuggestionList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/New Suggestion/i)).toBeInTheDocument()
    })
  })

  it('displays suggestions list with data', async () => {
    const mockSuggestions = [
      {
        suggestion_id: 'sug-001',
        title: 'Mobile App for Timesheet Submission',
        suggestion_type: 'feature',
        status: 'approved',
        priority: 'medium',
        description: 'It would be helpful to have a mobile app...',
        created_at: '2024-12-10T10:00:00Z',
      },
    ]

    mockSupabaseQuery.range.mockResolvedValue({
      data: mockSuggestions,
      error: null,
      count: 1,
    })

    render(<SuggestionList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Mobile App for Timesheet Submission/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('filters suggestions by status', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<SuggestionList />, { wrapper: TestWrapper })

    await waitFor(() => {
      const statusFilter = screen.getByLabelText(/Status/i)
      fireEvent.change(statusFilter, { target: { value: 'approved' } })
    })

    await waitFor(() => {
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('status', 'approved')
    })
  })

  it('filters suggestions by type', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<SuggestionList />, { wrapper: TestWrapper })

    await waitFor(() => {
      const typeFilter = screen.getByLabelText(/Type/i)
      fireEvent.change(typeFilter, { target: { value: 'feature' } })
    })

    await waitFor(() => {
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('suggestion_type', 'feature')
    })
  })

  it('handles error state', async () => {
    const mockRange = vi.fn().mockRejectedValue(new Error('Database error'))
    mockSupabaseQuery.range = mockRange

    render(<SuggestionList />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Database error/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('navigates to new suggestion page when button clicked', async () => {
    mockSupabaseQuery.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<SuggestionList />, { wrapper: TestWrapper })

    await waitFor(() => {
      const newButton = screen.getByText(/New Suggestion/i)
      expect(newButton.closest('a')).toHaveAttribute('href', '/hrms/suggestions/new')
    })
  })
})
