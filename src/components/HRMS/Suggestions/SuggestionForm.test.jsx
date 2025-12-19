/**
 * SuggestionForm Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock Supabase
const mockSupabaseQuery = {
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
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
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
  }
})

import SuggestionForm from './SuggestionForm'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('SuggestionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseQuery.insert.mockReturnThis()
    mockSupabaseQuery.update.mockReturnThis()
    mockSupabaseQuery.eq.mockReturnThis()
    mockSupabaseQuery.select.mockReturnThis()
    mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null })
  })

  it('renders form fields', () => {
    render(<SuggestionForm />, { wrapper: TestWrapper })
    
    expect(screen.getByLabelText(/Suggestion Type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Priority/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<SuggestionForm />, { wrapper: TestWrapper })
    
    const submitButton = screen.getByText(/Submit Suggestion/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Please select a suggestion type/i)).toBeInTheDocument()
    })
  })

  it('validates title length', async () => {
    render(<SuggestionForm />, { wrapper: TestWrapper })
    
    const titleInput = screen.getByLabelText(/Title/i)
    fireEvent.change(titleInput, { target: { value: 'Hi' } })
    
    const submitButton = screen.getByText(/Submit Suggestion/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Title must be between 5 and 100 characters/i)).toBeInTheDocument()
    })
  })

  it('validates description length', async () => {
    render(<SuggestionForm />, { wrapper: TestWrapper })
    
    const descriptionInput = screen.getByLabelText(/Description/i)
    fireEvent.change(descriptionInput, { target: { value: 'Short' } })
    
    const submitButton = screen.getByText(/Submit Suggestion/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Description must be at least 50 characters/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    mockSupabaseQuery.single.mockResolvedValue({
      data: { suggestion_id: 'sug-001' },
      error: null,
    })

    render(<SuggestionForm />, { wrapper: TestWrapper })
    
    fireEvent.change(screen.getByLabelText(/Suggestion Type/i), { target: { value: 'feature' } })
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Test Suggestion Title' } })
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'This is a detailed description that meets the minimum length requirement of 50 characters.' } })
    fireEvent.change(screen.getByLabelText(/Priority/i), { target: { value: 'medium' } })
    
    const submitButton = screen.getByText(/Submit Suggestion/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSupabaseQuery.insert).toHaveBeenCalled()
    })
  })
})
