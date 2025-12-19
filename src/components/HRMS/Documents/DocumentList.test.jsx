/**
 * DocumentList Component Tests
 * Comprehensive test suite following TDD principles
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import DocumentList from './DocumentList'

// Mock Supabase
vi.mock('../../../api/supabaseClient', () => {
  const createQueryBuilder = () => {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      or: vi.fn(() => builder),
      order: vi.fn(() => builder),
      range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
      lte: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      lt: vi.fn(() => builder),
      ilike: vi.fn(() => builder),
    }
    return builder
  }

  return {
    supabase: {
      from: vi.fn(() => createQueryBuilder()),
      storage: {
        from: vi.fn(() => ({
          download: vi.fn(() => Promise.resolve({ data: new Blob(['test'], { type: 'application/pdf' }), error: null })),
        })),
      },
    },
  }
})

// Mock TenantProvider
vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { tenant_id: 'test-tenant-id' },
    selectedBusiness: { business_id: 'test-business-id' },
  }),
}))

// Mock AuthProvider
vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const Wrapper = ({ children }) => <BrowserRouter>{children}</Wrapper>

describe('DocumentList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('Initial Render', () => {
    it('shows loading spinner initially', () => {
      render(<DocumentList />, { wrapper: Wrapper })
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('renders page header after loading', async () => {
      render(<DocumentList />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByText('Documents')).toBeInTheDocument()
        expect(screen.getByText(/manage and track all documents/i)).toBeInTheDocument()
      })
    })

    it('renders upload button', async () => {
      render(<DocumentList />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('upload-doc-button')).toBeInTheDocument()
      })
    })

    it('navigates to upload page when upload button is clicked', async () => {
      render(<DocumentList />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('upload-doc-button')).toBeInTheDocument()
      })

      const uploadButton = screen.getByTestId('upload-doc-button')
      await userEvent.click(uploadButton)

      expect(mockNavigate).toHaveBeenCalledWith('/hrms/documents/upload')
    })
  })

  describe('Search and Filters', () => {
    it('renders search input', async () => {
      render(<DocumentList />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })
    })

    it('renders all filters', async () => {
      render(<DocumentList />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('entity-type-filter')).toBeInTheDocument()
        expect(screen.getByTestId('document-type-filter')).toBeInTheDocument()
        expect(screen.getByTestId('status-filter')).toBeInTheDocument()
        expect(screen.getByTestId('expiry-filter')).toBeInTheDocument()
      })
    })

    it('updates search query when typing', async () => {
      render(<DocumentList />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument()
      })

      const searchInput = screen.getByTestId('search-input')
      await userEvent.type(searchInput, 'test query')

      expect(searchInput).toHaveValue('test query')
    })

    it('filters documents by entity type', async () => {
      render(<DocumentList />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('entity-type-filter')).toBeInTheDocument()
      })

      const entityFilter = screen.getByTestId('entity-type-filter')
      await userEvent.selectOptions(entityFilter, 'employee')

      expect(entityFilter).toHaveValue('employee')
    })
  })

  describe('Document Display', () => {
    it('displays empty state when no documents', async () => {
      render(<DocumentList />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByText('No documents found')).toBeInTheDocument()
      })
    })

    it('displays documents list when documents exist', async () => {
      const { supabase } = await import('../../../api/supabaseClient')
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

      supabase.from().range.mockResolvedValue({
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

  describe('Document Actions', () => {
    it('navigates to document viewer when view button is clicked', async () => {
      const { supabase } = await import('../../../api/supabaseClient')
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

      supabase.from().range.mockResolvedValue({
        data: mockDocuments,
        error: null,
        count: 1,
      })

      render(<DocumentList />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('view-doc-doc-1')).toBeInTheDocument()
      })

      const viewButton = screen.getByTestId('view-doc-doc-1')
      await userEvent.click(viewButton)

      expect(mockNavigate).toHaveBeenCalledWith('/hrms/documents/doc-1')
    })
  })

  describe('Error Handling', () => {
    it('displays error message when fetch fails', async () => {
      const { supabase } = await import('../../../api/supabaseClient')
      supabase.from().range.mockResolvedValue({
        data: null,
        error: { message: 'Failed to fetch documents' },
        count: 0,
      })

      render(<DocumentList />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch documents/i)).toBeInTheDocument()
      })
    })
  })
})
