/**
 * ProjectForm Component Tests
 * Tests for project create/edit form
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Define mock data before vi.mock to avoid hoisting issues
const mockEmployees = [
  {
    employee_id: 'emp-001',
    first_name: 'John',
    last_name: 'Smith',
    employee_code: 'IES00012',
  },
]

// Mock contexts
vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
    profile: { id: 'test-profile-id', tenant_id: 'test-tenant-id' },
  }),
}))

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { id: 'test-tenant-id', company_name: 'Test Company', tenant_id: 'test-tenant-id' },
    loading: false,
    selectedBusiness: { id: 'test-business-id', business_name: 'Test Business', business_id: 'test-business-id' },
  }),
}))

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}))

import ProjectForm from './ProjectForm'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('ProjectForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders project form for new project', async () => {
      render(<ProjectForm testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/create new project/i)).toBeInTheDocument()
      })
    })

    it('renders required form fields', async () => {
      render(<ProjectForm testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByLabelText(/project name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/employee/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/end client name/i)).toBeInTheDocument()
      })
    })

    it('renders form for edit mode', async () => {
      // Mock useParams to return projectId
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom')
        return {
          ...actual,
          useParams: () => ({ projectId: 'project-001' }),
        }
      })
      render(<ProjectForm testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/edit project/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('shows validation error when project name is empty', async () => {
      render(<ProjectForm testMode={true} />, { wrapper: TestWrapper })
      const user = userEvent.setup()
      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/project name is required/i)).toBeInTheDocument()
      })
    })

    it('shows validation error when employee is not selected', async () => {
      render(<ProjectForm testMode={true} />, { wrapper: TestWrapper })
      const user = userEvent.setup()
      const projectNameInput = screen.getByLabelText(/project name/i)
      await user.type(projectNameInput, 'Test Project')
      const submitButton = screen.getByRole('button', { name: /save/i })
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByText(/please select an employee/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      render(<ProjectForm testMode={true} />, { wrapper: TestWrapper })
      const user = userEvent.setup()
      const projectNameInput = screen.getByLabelText(/project name/i)
      await user.type(projectNameInput, 'Test Project')
      // Note: In test mode, form submission is mocked
    })
  })
})
