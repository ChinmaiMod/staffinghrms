/**
 * ChecklistTypesPage Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock contexts
vi.mock('../../../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'admin@example.com' },
    loading: false,
    profile: { id: 'test-profile-id', tenant_id: 'test-tenant-id' },
  }),
}))

vi.mock('../../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { tenant_id: 'test-tenant-id', company_name: 'Test Company' },
    loading: false,
  }),
}))

// Mock Supabase
const mockChecklistTypes = [
  {
    checklist_type_id: 'type-001',
    type_code: 'immigration',
    type_name: 'Immigration Documents',
    type_description: 'Documents for immigration',
    target_entity_type: 'employee',
    target_table_name: 'hrms_employees',
    target_id_column: 'employee_id',
    icon: '🛂',
    color_code: '#3B82F6',
    display_order: 1,
    allow_multiple_templates: true,
    require_employee_type: true,
    enable_ai_parsing: true,
    enable_compliance_tracking: true,
    is_active: true,
    is_system_type: true,
    template_count: 4,
    created_at: '2025-01-15T00:00:00Z',
  },
  {
    checklist_type_id: 'type-002',
    type_code: 'client_onboarding',
    type_name: 'Client Onboarding',
    type_description: 'Client onboarding documents',
    target_entity_type: 'custom',
    target_table_name: 'contacts',
    target_id_column: 'id',
    icon: '📋',
    color_code: '#10B981',
    display_order: 10,
    allow_multiple_templates: true,
    require_employee_type: false,
    enable_ai_parsing: true,
    enable_compliance_tracking: false,
    is_active: true,
    is_system_type: false,
    template_count: 3,
    created_at: '2025-01-20T00:00:00Z',
  },
]

let callCount = 0

const createQueryBuilder = (responseData) => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  }
  
  // Make builder thenable (awaitable) - this is how Supabase works
  builder.then = vi.fn((resolve) => {
    return Promise.resolve(responseData).then(resolve)
  })
  builder.catch = vi.fn((reject) => {
    return Promise.resolve(responseData).catch(reject)
  })
  
  return builder
}

vi.mock('../../../../api/supabaseClient', () => {
  const mockFrom = vi.fn((table) => {
    callCount++
    
    // First call: checklist types query from hrms_checklist_types
    if (callCount === 1 && table === 'hrms_checklist_types') {
      return createQueryBuilder({
        data: mockChecklistTypes,
        error: null,
      })
    }
    
    // Subsequent calls: template count queries from hrms_checklist_templates
    // These use select with count option
    if (table === 'hrms_checklist_templates') {
      return createQueryBuilder({
        data: null,
        error: null,
        count: 4,
      })
    }
    
    // Default fallback
    return createQueryBuilder({
      data: null,
      error: null,
    })
  })

  return {
    supabase: {
      from: mockFrom,
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    },
  }
})

import ChecklistTypesPage from './ChecklistTypesPage'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('ChecklistTypesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callCount = 0 // Reset call count before each test
  })

  it('renders loading state initially', () => {
    render(<ChecklistTypesPage />, { wrapper: TestWrapper })
    expect(screen.getByText(/Loading checklist types/i)).toBeInTheDocument()
  })

  it('renders checklist types after loading', async () => {
    render(<ChecklistTypesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Immigration Documents/i)).toBeInTheDocument()
      expect(screen.getByText(/Client Onboarding/i)).toBeInTheDocument()
    })
  })

  it('displays system types section', async () => {
    render(<ChecklistTypesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/System Types/i)).toBeInTheDocument()
      expect(screen.getByText(/Immigration Documents/i)).toBeInTheDocument()
    })
  })

  it('displays custom types section', async () => {
    render(<ChecklistTypesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Custom Types/i)).toBeInTheDocument()
      expect(screen.getByText(/Client Onboarding/i)).toBeInTheDocument()
    })
  })

  it('shows create button', async () => {
    render(<ChecklistTypesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Create New Checklist Type/i)).toBeInTheDocument()
    })
  })

  it('filters checklist types by search term', async () => {
    render(<ChecklistTypesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Immigration Documents/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Search types/i)
    fireEvent.change(searchInput, { target: { value: 'Immigration' } })

    await waitFor(() => {
      expect(screen.getByText(/Immigration Documents/i)).toBeInTheDocument()
      expect(screen.queryByText(/Client Onboarding/i)).not.toBeInTheDocument()
    })
  })

  it('filters checklist types by category', async () => {
    render(<ChecklistTypesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/System Types/i)).toBeInTheDocument()
    })

    const filterSelect = screen.getByDisplayValue(/All Types/i)
    fireEvent.change(filterSelect, { target: { value: 'SYSTEM' } })

    await waitFor(() => {
      expect(screen.getByText(/Immigration Documents/i)).toBeInTheDocument()
      expect(screen.queryByText(/Client Onboarding/i)).not.toBeInTheDocument()
    })
  })

  it('shows empty state when no types match filters', async () => {
    render(<ChecklistTypesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Immigration Documents/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Search types/i)
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } })

    await waitFor(() => {
      expect(screen.getByText(/No Checklist Types Found/i)).toBeInTheDocument()
    })
  })

  it('displays template count for each type', async () => {
    render(<ChecklistTypesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Templates:/i)).toBeInTheDocument()
    })
  })

  it('shows system type badge for system types', async () => {
    render(<ChecklistTypesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/🔒 System Type/i)).toBeInTheDocument()
    })
  })

  it('handles error state', async () => {
    const { supabase } = await import('../../../../api/supabaseClient')
    supabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Failed to fetch checklist types' },
      }),
    })

    render(<ChecklistTypesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch checklist types/i)).toBeInTheDocument()
    })
  })
})
