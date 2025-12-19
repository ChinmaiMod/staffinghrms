/**
 * DocumentUpload Component Tests
 * Comprehensive test suite following TDD principles
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import DocumentUpload from './DocumentUpload'

// Mock Supabase
vi.mock('../../../api/supabaseClient', () => {
  const createQueryBuilder = () => {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      order: vi.fn(() => Promise.resolve({ data: [{ employee_id: 'emp-1', first_name: 'John', last_name: 'Doe', employee_code: 'IES00001' }], error: null })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    }
    return builder
  }

  return {
    supabase: {
      from: vi.fn(() => createQueryBuilder()),
      storage: {
        from: vi.fn(() => ({
          upload: vi.fn(() => Promise.resolve({ data: { path: 'test.pdf' }, error: null })),
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

// Mock useNavigate and useLocation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  }
})

const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('DocumentUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('Initial Render', () => {
    it('renders upload page header', () => {
      render(<DocumentUpload />, { wrapper: Wrapper })
      expect(screen.getByText('Upload Document')).toBeInTheDocument()
    })

    it('renders upload zone', () => {
      render(<DocumentUpload />, { wrapper: Wrapper })
      expect(screen.getByTestId('upload-zone')).toBeInTheDocument()
    })

    it('renders document details form', () => {
      render(<DocumentUpload />, { wrapper: Wrapper })
      expect(screen.getByTestId('document-name-input')).toBeInTheDocument()
    })

    it('renders entity type selector', () => {
      render(<DocumentUpload />, { wrapper: Wrapper })
      expect(screen.getByTestId('entity-type-select')).toBeInTheDocument()
    })

    it('renders document type selector', () => {
      render(<DocumentUpload />, { wrapper: Wrapper })
      expect(screen.getByTestId('document-type-select')).toBeInTheDocument()
    })

    it('renders tracking options checkboxes', () => {
      render(<DocumentUpload />, { wrapper: Wrapper })
      expect(screen.getByTestId('compliance-tracking-checkbox')).toBeInTheDocument()
      expect(screen.getByTestId('visible-to-employee-checkbox')).toBeInTheDocument()
    })
  })

  describe('File Selection', () => {
    it('allows file selection via input', async () => {
      render(<DocumentUpload />, { wrapper: Wrapper })

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const input = document.querySelector('input[type="file"]')

      await userEvent.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })
    })

    it('validates file type', async () => {
      render(<DocumentUpload />, { wrapper: Wrapper })

      const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' })
      const input = document.querySelector('input[type="file"]')

      await userEvent.upload(input, file)

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByText(/Unsupported file type/i)).toBeInTheDocument()
      })
    })

    it('validates file size (max 10MB)', async () => {
      render(<DocumentUpload />, { wrapper: Wrapper })

      // Create a file larger than 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      })
      const input = document.querySelector('input[type="file"]')

      await userEvent.upload(input, largeFile)

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByText(/File size exceeds 10MB/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('requires document name', async () => {
      render(<DocumentUpload />, { wrapper: Wrapper })

      const uploadButton = screen.getByTestId('upload-button')
      await userEvent.click(uploadButton)

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByText(/Document name is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('navigates back when cancel button is clicked', async () => {
      render(<DocumentUpload />, { wrapper: Wrapper })

      const cancelButton = screen.getByText('Cancel')
      await userEvent.click(cancelButton)

      expect(mockNavigate).toHaveBeenCalledWith('/hrms/documents')
    })
  })
})
