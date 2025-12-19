/**
 * DocumentList Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import DocumentList from './DocumentList'

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  or: vi.fn(() => mockSupabase),
  order: vi.fn(() => mockSupabase),
  range: vi.fn(() => mockSupabase),
  lte: vi.fn(() => mockSupabase),
  gte: vi.fn(() => mockSupabase),
  lt: vi.fn(() => mockSupabase),
  storage: {
    from: vi.fn(() => ({
      download: vi.fn(() => Promise.resolve({ data: new Blob(), error: null })),
    })),
  },
}

vi.mock('../../../api/supabaseClient', () => ({
  supabase: mockSupabase,
}))

// Mock TenantProvider
const mockTenant = {
  tenant: { tenant_id: 'test-tenant-id' },
  selectedBusiness: { business_id: 'test-business-id' },
}

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => mockTenant,
}))

// Mock AuthProvider
vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}))

const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('DocumentList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.order.mockReturnValue(mockSupabase)
    mockSupabase.range.mockReturnValue(mockSupabase)
  })

  it('shows loading spinner initially', () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<DocumentList />, { wrapper: Wrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders page header after loading', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<DocumentList />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument()
      expect(screen.getByText(/manage and track all documents/i)).toBeInTheDocument()
    })
  })

  it('renders upload button', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<DocumentList />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('upload-doc-button')).toBeInTheDocument()
    })
  })

  it('renders search input', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<DocumentList />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })
  })

  it('renders filters', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<DocumentList />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('entity-type-filter')).toBeInTheDocument()
      expect(screen.getByTestId('document-type-filter')).toBeInTheDocument()
      expect(screen.getByTestId('status-filter')).toBeInTheDocument()
      expect(screen.getByTestId('expiry-filter')).toBeInTheDocument()
    })
  })

  it('displays empty state when no documents', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    })

    render(<DocumentList />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('No documents found')).toBeInTheDocument()
    })
  })

  it('displays documents list when documents exist', async () => {
    const mockDocuments = [
      {
        document_id: 'doc-1',
        document_name: 'Test Document',
        file_name: 'test.pdf',
        size_bytes: 1024,
        entity_type: 'employee',
        document_type: 'passport',
        document_status: 'active',
        expiry_date: null,
        uploaded_at: '2024-01-01T00:00:00Z',
        employee: {
          employee_id: 'emp-1',
          first_name: 'John',
          last_name: 'Doe',
          employee_code: 'IES00001',
        },
      },
    ]

    mockSupabase.range.mockResolvedValue({
      data: mockDocuments,
      error: null,
      count: 1,
    })

    render(<DocumentList />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument()
    })
  })
})
