/**
 * ChecklistTemplatesPage Component Tests
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
    type_name: 'Immigration Documents',
    type_code: 'immigration',
    is_active: true,
  },
  {
    checklist_type_id: 'type-002',
    type_name: 'Client Onboarding',
    type_code: 'client_onboarding',
    is_active: true,
  },
]

const mockTemplates = [
  {
    template_id: 'template-001',
    template_name: 'H1B Visa Checklist',
    checklist_type_id: 'type-001',
    employee_type: 'it_usa',
    description: 'Checklist for H1B visa documents',
    is_active: true,
    created_at: '2025-01-15T00:00:00Z',
    hrms_checklist_types: {
      type_name: 'Immigration Documents',
      type_code: 'immigration',
      target_entity_type: 'employee',
    },
    item_count: 5,
  },
  {
    template_id: 'template-002',
    template_name: 'Client Onboarding Template',
    checklist_type_id: 'type-002',
    employee_type: null,
    description: 'Client onboarding checklist',
    is_active: true,
    created_at: '2025-01-20T00:00:00Z',
    hrms_checklist_types: {
      type_name: 'Client Onboarding',
      type_code: 'client_onboarding',
      target_entity_type: 'custom',
    },
    item_count: 8,
  },
]

const createQueryBuilder = () => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  }
  return builder
}

let callCount = 0

vi.mock('../../../../api/supabaseClient', () => {
  const mockFrom = vi.fn((table) => {
    const builder = createQueryBuilder()
    callCount++

    if (table === 'hrms_checklist_types') {
      builder.select.mockResolvedValue({
        data: mockChecklistTypes,
        error: null,
      })
    } else if (table === 'hrms_checklist_templates') {
      builder.select.mockResolvedValue({
        data: mockTemplates,
        error: null,
      })
    } else if (table === 'hrms_checklist_items') {
      builder.select.mockResolvedValue({
        data: null,
        error: null,
        count: 5,
      })
    }

    return builder
  })

  return {
    supabase: {
      from: mockFrom,
    },
  }
})

// Mock ChecklistTemplateBuilder
vi.mock('./ChecklistTemplateBuilder', () => ({
  default: ({ template, onClose, onSave }) => (
    <div data-testid="checklist-template-builder">
      <button onClick={onClose}>Close Builder</button>
      <button onClick={onSave}>Save Template</button>
      {template && <div data-testid="editing-template">{template.template_name}</div>}
    </div>
  ),
}))

import ChecklistTemplatesPage from './ChecklistTemplatesPage'

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <ChecklistTemplatesPage />
    </BrowserRouter>
  )
}

describe('ChecklistTemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    callCount = 0
  })

  it('should render loading state initially', async () => {
    renderComponent()
    expect(screen.getByText(/loading checklist templates/i)).toBeInTheDocument()
  })

  it('should render page header', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Checklist Templates Management')).toBeInTheDocument()
    })
  })

  it('should display checklist templates grouped by type', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Immigration Documents Checklists')).toBeInTheDocument()
      expect(screen.getByText('Client Onboarding Checklists')).toBeInTheDocument()
    })
  })

  it('should display template cards with correct information', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('H1B Visa Checklist')).toBeInTheDocument()
      expect(screen.getByText('Client Onboarding Template')).toBeInTheDocument()
      expect(screen.getByText(/items: 5/i)).toBeInTheDocument()
      expect(screen.getByText(/items: 8/i)).toBeInTheDocument()
    })
  })

  it('should open template builder when Create Template is clicked', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('+ Create Template')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+ Create Template'))

    await waitFor(() => {
      expect(screen.getByTestId('checklist-template-builder')).toBeInTheDocument()
    })
  })

  it('should open template builder with template data when Edit is clicked', async () => {
    renderComponent()
    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0])
    })

    await waitFor(() => {
      expect(screen.getByTestId('checklist-template-builder')).toBeInTheDocument()
      expect(screen.getByTestId('editing-template')).toHaveTextContent('H1B Visa Checklist')
    })
  })

  it('should filter templates by search term', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search templates/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search templates/i)
    fireEvent.change(searchInput, { target: { value: 'H1B' } })

    await waitFor(() => {
      expect(screen.getByText('H1B Visa Checklist')).toBeInTheDocument()
      expect(screen.queryByText('Client Onboarding Template')).not.toBeInTheDocument()
    })
  })

  it('should filter templates by checklist type', async () => {
    renderComponent()
    await waitFor(() => {
      const filterSelect = screen.getByDisplayValue('All Types')
      fireEvent.change(filterSelect, { target: { value: 'type-001' } })
    })

    await waitFor(() => {
      expect(screen.getByText('H1B Visa Checklist')).toBeInTheDocument()
      expect(screen.queryByText('Client Onboarding Template')).not.toBeInTheDocument()
    })
  })

  it('should show empty state when no templates match filters', async () => {
    renderComponent()
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search templates/i)
      fireEvent.change(searchInput, { target: { value: 'NonExistentTemplate' } })
    })

    await waitFor(() => {
      expect(screen.getByText(/no checklist templates found/i)).toBeInTheDocument()
    })
  })

  it('should handle duplicate template action', async () => {
    renderComponent()
    await waitFor(() => {
      const duplicateButtons = screen.getAllByText('Duplicate')
      fireEvent.click(duplicateButtons[0])
    })

    await waitFor(() => {
      expect(screen.getByTestId('checklist-template-builder')).toBeInTheDocument()
    })
  })

  it('should display error message when fetch fails', async () => {
    const { supabase } = await import('../../../../api/supabaseClient')
    vi.spyOn(supabase, 'from').mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockRejectedValue(new Error('Fetch failed')),
    })

    renderComponent()
    await waitFor(() => {
      expect(screen.getByText(/failed to load checklist templates/i)).toBeInTheDocument()
    })
  })

  it('should close builder and refresh data when saved', async () => {
    renderComponent()
    await waitFor(() => {
      fireEvent.click(screen.getByText('+ Create Template'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('checklist-template-builder')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Save Template'))

    await waitFor(() => {
      expect(screen.queryByTestId('checklist-template-builder')).not.toBeInTheDocument()
    })
  })
})
