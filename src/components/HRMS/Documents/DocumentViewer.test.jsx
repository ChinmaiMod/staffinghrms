/**
 * DocumentViewer Component Tests
 * Comprehensive test suite following TDD principles
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import DocumentViewer from './DocumentViewer'

// Mock Supabase
vi.mock('../../../api/supabaseClient', () => {
  const createQueryBuilder = () => {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      or: vi.fn(() => builder),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      single: vi.fn(() => Promise.resolve({
        data: {
          document_id: 'doc-1',
          document_name: 'Test Document',
          file_name: 'test.pdf',
          file_path: 'documents/employee/emp-1/test.pdf',
          content_type: 'application/pdf',
          size_bytes: 1024,
          entity_type: 'employee',
          entity_id: 'emp-1',
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
          uploaded_by_user: {
            id: 'user-1',
            full_name: 'Admin User',
            email: 'admin@example.com',
          },
        },
        error: null,
      })),
    }
    return builder
  }

  return {
    supabase: {
      from: vi.fn(() => createQueryBuilder()),
      storage: {
        from: vi.fn(() => ({
          download: vi.fn(() => Promise.resolve({ data: new Blob(['test'], { type: 'application/pdf' }), error: null })),
          createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: 'https://example.com/signed-url.pdf' }, error: null })),
        })),
      },
    },
  }
})

// Mock TenantProvider
vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { tenant_id: 'test-tenant-id' },
  }),
}))

// Mock AuthProvider
vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}))

// Mock useParams and useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ documentId: 'doc-1' }),
    useNavigate: () => mockNavigate,
  }
})

const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('DocumentViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('Initial Render', () => {
    it('shows loading spinner initially', () => {
      render(<DocumentViewer />, { wrapper: Wrapper })
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('renders document viewer after loading', async () => {
      render(<DocumentViewer />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('document-viewer')).toBeInTheDocument()
      })
    })

    it('renders back button', async () => {
      render(<DocumentViewer />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument()
      })
    })

    it('navigates back when back button is clicked', async () => {
      render(<DocumentViewer />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument()
      })

      const backButton = screen.getByTestId('back-button')
      await userEvent.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/hrms/documents')
    })
  })

  describe('Document Information Display', () => {
    it('displays document name', async () => {
      render(<DocumentViewer />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByText('Test Document')).toBeInTheDocument()
      })
    })

    it('displays document type', async () => {
      render(<DocumentViewer />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByText('passport')).toBeInTheDocument()
      })
    })

    it('displays entity information for employee', async () => {
      render(<DocumentViewer />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
        expect(screen.getByText(/IES00001/i)).toBeInTheDocument()
      })
    })

    it('displays uploaded date', async () => {
      render(<DocumentViewer />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByText(/January 1, 2024/i)).toBeInTheDocument()
      })
    })

    it('displays uploaded by information', async () => {
      render(<DocumentViewer />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByText('Admin User')).toBeInTheDocument()
      })
    })

    it('displays file size', async () => {
      render(<DocumentViewer />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByText(/1.0 KB/i)).toBeInTheDocument()
      })
    })
  })

  describe('Document Preview', () => {
    it('displays PDF preview in iframe', async () => {
      render(<DocumentViewer />, { wrapper: Wrapper })

      await waitFor(() => {
        const iframe = document.querySelector('iframe')
        expect(iframe).toBeInTheDocument()
        expect(iframe).toHaveAttribute('title', 'Test Document')
      })
    })
  })

  describe('Document Actions', () => {
    it('navigates to edit page when edit button is clicked', async () => {
      render(<DocumentViewer />, { wrapper: Wrapper })

      await waitFor(() => {
        expect(screen.getByText(/Edit Info/i)).toBeInTheDocument()
      })

      const editButton = screen.getByText(/Edit Info/i)
      await userEvent.click(editButton)

      expect(mockNavigate).toHaveBeenCalledWith('/hrms/documents/doc-1/edit')
    })
  })
})
