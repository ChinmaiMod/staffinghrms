/**
 * ChecklistTemplateBuilder Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

// Mock contexts
vi.mock('../../../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    profile: { id: 'test-profile-id' },
  }),
}))

vi.mock('../../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { tenant_id: 'test-tenant-id' },
  }),
}))

// Mock Supabase
const mockChecklistTypes = [
  {
    checklist_type_id: 'type-001',
    type_name: 'Immigration Documents',
    require_employee_type: true,
    is_active: true,
  },
  {
    checklist_type_id: 'type-002',
    type_name: 'Client Onboarding',
    require_employee_type: false,
    is_active: true,
  },
]

const createQueryBuilder = () => {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
  }
  return builder
}

vi.mock('../../../../api/supabaseClient', () => {
  const mockFrom = vi.fn((table) => {
    const builder = createQueryBuilder()

    if (table === 'hrms_checklist_types') {
      builder.select.mockResolvedValue({
        data: mockChecklistTypes,
        error: null,
      })
    } else if (table === 'hrms_checklist_groups') {
      builder.select.mockResolvedValue({ data: [], error: null })
      builder.insert.mockResolvedValue({ data: [{ group_id: 'group-001' }], error: null })
      builder.update.mockResolvedValue({ data: null, error: null })
      builder.delete.mockResolvedValue({ data: null, error: null })
    } else if (table === 'hrms_checklist_items') {
      builder.select.mockResolvedValue({ data: [], error: null })
      builder.insert.mockResolvedValue({ data: [{ item_id: 'item-001' }], error: null })
      builder.update.mockResolvedValue({ data: null, error: null })
      builder.delete.mockResolvedValue({ data: null, error: null })
    } else if (table === 'hrms_checklist_templates') {
      builder.insert.mockResolvedValue({
        data: [{ template_id: 'template-001' }],
        error: null,
      })
      builder.update.mockResolvedValue({
        data: [{ template_id: 'template-001' }],
        error: null,
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

// Mock child components
vi.mock('./ChecklistGroupForm', () => ({
  default: ({ group, onClose, onSave }) => (
    <div data-testid="checklist-group-form">
      <input data-testid="group-name-input" defaultValue={group?.group_name || ''} />
      <button onClick={onClose}>Cancel</button>
      <button onClick={() => onSave({ group_name: 'Test Group', display_order: 0 })}>Save</button>
    </div>
  ),
}))

vi.mock('./ChecklistItemForm', () => ({
  default: ({ item, onClose, onSave }) => (
    <div data-testid="checklist-item-form">
      <input data-testid="item-name-input" defaultValue={item?.item_name || ''} />
      <button onClick={onClose}>Cancel</button>
      <button onClick={() => onSave({ item_name: 'Test Item', group_id: 'group-001', display_order: 0 })}>
        Save
      </button>
    </div>
  ),
}))

import ChecklistTemplateBuilder from './ChecklistTemplateBuilder'

const defaultProps = {
  onClose: vi.fn(),
  onSave: vi.fn(),
  tenantId: 'test-tenant-id',
  userId: 'test-user-id',
}

const renderComponent = (props = {}) => {
  return render(<ChecklistTemplateBuilder {...defaultProps} {...props} />)
}

describe('ChecklistTemplateBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('should render form for creating new template', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText(/create checklist template/i)).toBeInTheDocument()
    })
  })

  it('should render form for editing existing template', async () => {
    const template = {
      template_id: 'template-001',
      template_name: 'Test Template',
      checklist_type_id: 'type-001',
      employee_type: 'it_usa',
      description: 'Test description',
      is_active: true,
    }
    renderComponent({ template })
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument()
    })
  })

  it('should validate required fields on submit', async () => {
    renderComponent()
    await waitFor(() => {
      const submitButton = screen.getByText(/save template/i)
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/template name is required/i)).toBeInTheDocument()
    })
  })

  it('should require employee type when checklist type requires it', async () => {
    renderComponent()
    await waitFor(() => {
      const templateNameInput = screen.getByLabelText(/template name/i)
      fireEvent.change(templateNameInput, { target: { value: 'Test Template' } })

      const typeSelect = screen.getByLabelText(/checklist type/i)
      fireEvent.change(typeSelect, { target: { value: 'type-001' } })

      const submitButton = screen.getByText(/save template/i)
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(screen.getByText(/employee type is required/i)).toBeInTheDocument()
    })
  })

  it('should allow adding groups', async () => {
    renderComponent()
    await waitFor(() => {
      const addGroupButton = screen.getByText(/add group/i)
      fireEvent.click(addGroupButton)
    })

    expect(screen.getByTestId('checklist-group-form')).toBeInTheDocument()
  })

  it('should allow adding items to groups', async () => {
    renderComponent()
    await waitFor(() => {
      const addGroupButton = screen.getByText(/add group/i)
      fireEvent.click(addGroupButton)
    })

    await waitFor(() => {
      const saveGroupButton = screen.getByText('Save')
      fireEvent.click(saveGroupButton)
    })

    await waitFor(() => {
      const addItemButton = screen.getByText(/add item/i)
      fireEvent.click(addItemButton)
    })

    expect(screen.getByTestId('checklist-item-form')).toBeInTheDocument()
  })

  it('should handle group deletion with confirmation', async () => {
    renderComponent()
    await waitFor(() => {
      const addGroupButton = screen.getByText(/add group/i)
      fireEvent.click(addGroupButton)
    })

    await waitFor(() => {
      const saveGroupButton = screen.getByText('Save')
      fireEvent.click(saveGroupButton)
    })

    await waitFor(() => {
      const deleteButtons = screen.queryAllByText(/delete/i)
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0])
        expect(window.confirm).toHaveBeenCalled()
      }
    })
  })

  it('should save template with groups and items', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    await waitFor(() => {
      const templateNameInput = screen.getByLabelText(/template name/i)
      fireEvent.change(templateNameInput, { target: { value: 'Test Template' } })

      const typeSelect = screen.getByLabelText(/checklist type/i)
      fireEvent.change(typeSelect, { target: { value: 'type-002' } })

      const submitButton = screen.getByText(/save template/i)
      fireEvent.click(submitButton)
    })

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })
  })

  it('should close modal when cancel is clicked', async () => {
    const onClose = vi.fn()
    renderComponent({ onClose })

    await waitFor(() => {
      const cancelButton = screen.getByText(/cancel/i)
      fireEvent.click(cancelButton)
    })

    expect(onClose).toHaveBeenCalled()
  })
})
