/**
 * IssueReport Component Tests
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
  order: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: { issue_id: 'test-issue-id' }, error: null }),
}

const mockStorage = {
  from: vi.fn(() => ({
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.png' } }),
  })),
}

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseQuery),
    storage: mockStorage,
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

import IssueReport from './IssueReport'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('IssueReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabaseQuery.insert.mockReturnThis()
    mockSupabaseQuery.select.mockReturnThis()
    mockSupabaseQuery.single.mockResolvedValue({ data: { issue_id: 'test-issue-id' }, error: null })
  })

  it('renders the issue report form', () => {
    render(
      <TestWrapper>
        <IssueReport />
      </TestWrapper>
    )

    expect(screen.getByText(/Report an Issue/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Issue Title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Issue Type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(
      <TestWrapper>
        <IssueReport />
      </TestWrapper>
    )

    const submitButton = screen.getByText(/Submit Issue Report/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Please fix the errors/i)).toBeInTheDocument()
    })
  })

  it('submits issue report successfully', async () => {
    render(
      <TestWrapper>
        <IssueReport />
      </TestWrapper>
    )

    const titleInput = screen.getByLabelText(/Issue Title/i)
    const descriptionInput = screen.getByLabelText(/Description/i)

    fireEvent.change(titleInput, { target: { value: 'Test issue title with enough characters' } })
    fireEvent.change(descriptionInput, { target: { value: 'This is a test description with enough characters to pass validation' } })

    const submitButton = screen.getByText(/Submit Issue Report/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSupabaseQuery.insert).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText(/Thank you for reporting/i)).toBeInTheDocument()
    })
  })

  it('handles file upload', async () => {
    render(
      <TestWrapper>
        <IssueReport />
      </TestWrapper>
    )

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const fileInput = document.getElementById('screenshot-input')

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByAltText(/Screenshot preview/i)).toBeInTheDocument()
    })
  })

  it('resets form when reset button is clicked', () => {
    render(
      <TestWrapper>
        <IssueReport />
      </TestWrapper>
    )

    const titleInput = screen.getByLabelText(/Issue Title/i)
    fireEvent.change(titleInput, { target: { value: 'Test title' } })

    const resetButton = screen.getByText(/Reset/i)
    fireEvent.click(resetButton)

    expect(titleInput.value).toBe('')
  })
})
