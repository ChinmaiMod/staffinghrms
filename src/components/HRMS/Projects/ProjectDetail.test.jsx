/**
 * ProjectDetail Component Tests
 * Tests for project detail view with tabs
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Define mock data before vi.mock to avoid hoisting issues
const mockProjectData = {
  project_id: 'project-001',
  project_name: 'Acme Corp - Software Developer',
  project_code: 'PRJ-2025-001',
  project_status: 'active',
  project_start_date: '2025-01-15',
  project_end_date: '2025-12-31',
  actual_client_bill_rate: 85.00,
  rate_paid_to_candidate: 68.00,
  candidate_percentage: 80,
  lca_rate: 75.00,
  is_lca_project: true,
  end_client_name: 'Acme Corporation',
  end_client_manager_name: 'Jane Wilson',
  end_client_manager_email: 'jane.wilson@acme.com',
  work_location_type: 'hybrid',
  employee: {
    employee_id: 'emp-001',
    first_name: 'John',
    last_name: 'Smith',
    employee_code: 'IES00012',
    employee_type: 'it_usa',
    email: 'john.smith@company.com',
  },
}

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
      single: vi.fn().mockResolvedValue({ data: mockProjectData, error: null }),
    }),
  },
}))

import ProjectDetail from './ProjectDetail'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('ProjectDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders project detail page with project name', async () => {
      render(<ProjectDetail testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText('Acme Corp - Software Developer')).toBeInTheDocument()
      })
    })

    it('renders project code', async () => {
      render(<ProjectDetail testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText('PRJ-2025-001')).toBeInTheDocument()
      })
    })

    it('renders employee information', async () => {
      render(<ProjectDetail testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
        expect(screen.getByText('IES00012')).toBeInTheDocument()
      })
    })

    it('renders client information', async () => {
      render(<ProjectDetail testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
      })
    })

    it('renders tabs for different views', async () => {
      render(<ProjectDetail testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/overview/i)).toBeInTheDocument()
        expect(screen.getByText(/vendor chain/i)).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner while fetching project data', () => {
      render(<ProjectDetail testMode={false} />, { wrapper: TestWrapper })
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('has back link to projects list', async () => {
      render(<ProjectDetail testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const backLink = screen.getByText(/back to projects/i)
        expect(backLink.closest('a')).toHaveAttribute('href', '/hrms/projects')
      })
    })

    it('has edit button linking to edit page', async () => {
      render(<ProjectDetail testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const editLink = screen.getByText(/edit/i)
        expect(editLink.closest('a')).toHaveAttribute('href', '/hrms/projects/project-001/edit')
      })
    })
  })
})
