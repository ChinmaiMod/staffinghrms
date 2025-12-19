/**
 * NewsletterForm Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock Supabase
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
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
    useParams: vi.fn(() => ({})),
    useNavigate: vi.fn(() => vi.fn()),
  }
})

import NewsletterForm from './NewsletterForm'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('NewsletterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseQuery.select.mockReturnThis()
    mockSupabaseQuery.eq.mockReturnThis()
    mockSupabaseQuery.insert.mockReturnThis()
    mockSupabaseQuery.update.mockReturnThis()
    mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null })
  })

  it('renders form for new newsletter', async () => {
    render(<NewsletterForm />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByLabelText(/Newsletter Title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Subject Line/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Content/i)).toBeInTheDocument()
    })
  })

  it('validates required fields', async () => {
    render(<NewsletterForm />, { wrapper: TestWrapper })

    await waitFor(() => {
      const submitButton = screen.getByText(/Save as Draft/i)
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument()
    })
  })

  it('allows entering newsletter title', async () => {
    render(<NewsletterForm />, { wrapper: TestWrapper })

    await waitFor(() => {
      const titleInput = screen.getByLabelText(/Newsletter Title/i)
      fireEvent.change(titleInput, { target: { value: 'Test Newsletter' } })
      expect(titleInput.value).toBe('Test Newsletter')
    })
  })

  it('allows entering subject line', async () => {
    render(<NewsletterForm />, { wrapper: TestWrapper })

    await waitFor(() => {
      const subjectInput = screen.getByLabelText(/Subject Line/i)
      fireEvent.change(subjectInput, { target: { value: 'Test Subject' } })
      expect(subjectInput.value).toBe('Test Subject')
    })
  })

  it('allows entering content', async () => {
    render(<NewsletterForm />, { wrapper: TestWrapper })

    await waitFor(() => {
      const contentInput = screen.getByLabelText(/Content/i)
      fireEvent.change(contentInput, { target: { value: 'Test content' } })
      expect(contentInput.value).toBe('Test content')
    })
  })

  it('shows save buttons', async () => {
    render(<NewsletterForm />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Save as Draft/i)).toBeInTheDocument()
      expect(screen.getByText(/Preview/i)).toBeInTheDocument()
    })
  })
})
