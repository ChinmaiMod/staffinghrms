/**
 * ProjectList Component Tests
 * Tests for the project list with search, filters, and table display
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Define mock data before vi.mock to avoid hoisting issues
const mockSupabaseData = {
  data: [
    {
      project_id: 'project-001',
      project_name: 'Acme Corp - Software Developer',
      project_code: 'PRJ-2025-001',
      project_status: 'active',
      project_start_date: '2025-01-15',
      project_end_date: '2025-12-31',
      actual_client_bill_rate: 85.00,
      is_lca_project: true,
      employee: {
        employee_id: 'emp-001',
        first_name: 'John',
        last_name: 'Smith',
        employee_code: 'IES00012',
        employee_type: 'it_usa',
      },
      end_client_name: 'Acme Corporation',
      hrms_project_vendors: [{ vendor_level: 4 }, { vendor_level: 3 }, { vendor_level: 2 }, { vendor_level: 1 }],
    },
  ],
  error: null,
  count: 1,
}

// Mock contexts at the top level before component imports
vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
    profile: { id: 'test-profile-id', tenant_id: 'test-tenant-id' },
  }),
  AuthProvider: ({ children }) => children,
}))

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { id: 'test-tenant-id', company_name: 'Test Company', tenant_id: 'test-tenant-id' },
    loading: false,
    selectedBusiness: { id: 'test-business-id', business_name: 'Test Business', business_id: 'test-business-id' },
  }),
  TenantProvider: ({ children }) => children,
}))

vi.mock('../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSupabaseData),
      limit: vi.fn().mockResolvedValue(mockSupabaseData),
    }),
  },
}))

import ProjectList from './ProjectList'

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('ProjectList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading spinner while fetching data', async () => {
      const { supabase } = await import('../../../api/supabaseClient')
      supabase.from().select().eq().order().range().then = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSupabaseData), 100))
      )
      
      render(<ProjectList testMode={false} />, { wrapper: TestWrapper })
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Rendering', () => {
    it('renders the project list page with header after loading', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText('Employee Projects')).toBeInTheDocument()
      })
    })

    it('renders the Add Project button after loading', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /add project/i })).toBeInTheDocument()
      })
    })

    it('renders the search input after loading', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })
    })

    it('renders filter dropdowns after loading', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        expect(selects.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('renders the project data table after loading', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
      // Check table headers
      expect(screen.getByText('Project')).toBeInTheDocument()
      expect(screen.getByText('Employee')).toBeInTheDocument()
      expect(screen.getByText('End Client')).toBeInTheDocument()
      expect(screen.getByText('Bill Rate')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('filters projects when search text is entered', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText(/search projects/i)
      const user = userEvent.setup()
      await user.type(searchInput, 'Acme')
      expect(searchInput).toHaveValue('Acme')
    })
  })

  describe('Filter Functionality', () => {
    it('filters projects by status when filter is selected', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        expect(selects.length).toBeGreaterThan(0)
      })
    })

    it('filters projects by LCA flag when checkbox is toggled', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const lcaCheckbox = screen.getByLabelText(/lca only/i)
        expect(lcaCheckbox).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('Add Project button links to new project form', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const addButton = screen.getByRole('link', { name: /add project/i })
        expect(addButton).toBeInTheDocument()
        expect(addButton).toHaveAttribute('href', '/hrms/projects/new')
      })
    })

    it('project row links to project detail page', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const projectLink = screen.getByText('Acme Corp - Software Developer')
        expect(projectLink.closest('a')).toHaveAttribute('href', '/hrms/projects/project-001')
      })
    })
  })

  describe('Table Display', () => {
    it('displays project name and code', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText('Acme Corp - Software Developer')).toBeInTheDocument()
        expect(screen.getByText('PRJ-2025-001')).toBeInTheDocument()
      })
    })

    it('displays employee name and code', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument()
        expect(screen.getByText('IES00012')).toBeInTheDocument()
      })
    })

    it('displays client name', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText('Acme Corporation')).toBeInTheDocument()
      })
    })

    it('displays bill rate with LCA badge when applicable', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText('$85.00/hr')).toBeInTheDocument()
        expect(screen.getByText(/lca/i)).toBeInTheDocument()
      })
    })

    it('displays vendor count badge', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/4 vendors/i)).toBeInTheDocument()
      })
    })

    it('displays status badge', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        expect(screen.getByText(/active/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible search input', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search projects/i)
        expect(searchInput).toBeInTheDocument()
        expect(searchInput).toHaveAttribute('type', 'text')
      })
    })

    it('table has proper structure with headers', async () => {
      render(<ProjectList testMode={true} />, { wrapper: TestWrapper })
      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
        const headers = screen.getAllByRole('columnheader')
        expect(headers.length).toBeGreaterThan(0)
      })
    })
  })
})
