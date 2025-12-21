/**
 * ChecklistTypeForm Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock Supabase
vi.mock('../../../../api/supabaseClient', () => {
  const createQueryBuilder = (responseData = { data: null, error: null }) => {
    const builder = {
      select: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      update: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
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
  
  return {
    supabase: {
      from: vi.fn((table) => {
        // Return different data based on table
        if (table === 'hrms_checklist_types') {
          return createQueryBuilder({ data: [{ id: 'test-id' }], error: null })
        }
        return createQueryBuilder({ data: null, error: null })
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    },
  }
})

vi.mock('../../../../utils/validators', () => ({
  validateTextField: vi.fn((value, fieldName, options) => {
    if (!value || value.trim().length === 0) {
      return { valid: false, error: `${fieldName} is required` }
    }
    if (options?.pattern && !options.pattern.test(value)) {
      return { valid: false, error: options.patternMessage || 'Invalid format' }
    }
    return { valid: true, error: null }
  }),
}))

import ChecklistTypeForm from './ChecklistTypeForm'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

const defaultProps = {
  onClose: vi.fn(),
  onSave: vi.fn(),
  tenantId: 'test-tenant-id',
  userId: 'test-user-id',
}

describe('ChecklistTypeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form when no type provided', () => {
    render(<ChecklistTypeForm {...defaultProps} />, { wrapper: TestWrapper })

    expect(screen.getByText(/Create New Checklist Type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Type Code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Type Name/i)).toBeInTheDocument()
  })

  it('renders edit form when type provided', () => {
    const type = {
      checklist_type_id: 'type-001',
      type_code: 'test_type',
      type_name: 'Test Type',
      type_description: 'Test description',
      target_entity_type: 'employee',
      target_table_name: 'hrms_employees',
      target_id_column: 'employee_id',
      icon: '📋',
      color_code: '#3B82F6',
      display_order: 1,
      allow_multiple_templates: true,
      require_employee_type: false,
      enable_ai_parsing: true,
      enable_compliance_tracking: true,
      is_active: true,
    }

    render(<ChecklistTypeForm {...defaultProps} type={type} />, { wrapper: TestWrapper })

    expect(screen.getByText(/Edit Checklist Type/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('test_type')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Type')).toBeInTheDocument()
  })

  it('validates required fields on submit', async () => {
    render(<ChecklistTypeForm {...defaultProps} />, { wrapper: TestWrapper })

    const submitButton = screen.getByText(/Save Checklist Type/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Type Code is required/i)).toBeInTheDocument()
    })
  })

  it('validates type code format', async () => {
    render(<ChecklistTypeForm {...defaultProps} />, { wrapper: TestWrapper })

    const typeCodeInput = screen.getByLabelText(/Type Code/i)
    fireEvent.change(typeCodeInput, { target: { value: 'Invalid Code!' } })

    // Type code should be auto-formatted to lowercase and remove invalid chars
    await waitFor(() => {
      expect(typeCodeInput.value).toBe('invalidcode')
    })
  })

  it('calls onClose when cancel is clicked', () => {
    render(<ChecklistTypeForm {...defaultProps} />, { wrapper: TestWrapper })

    const cancelButton = screen.getByText(/Cancel/i)
    fireEvent.click(cancelButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('disables system type fields when editing system type', () => {
    const systemType = {
      checklist_type_id: 'type-001',
      type_code: 'immigration',
      type_name: 'Immigration',
      is_system_type: true,
      target_entity_type: 'employee',
      target_table_name: 'hrms_employees',
      target_id_column: 'employee_id',
    }

    render(<ChecklistTypeForm {...defaultProps} type={systemType} />, { wrapper: TestWrapper })

    const typeCodeInput = screen.getByLabelText(/Type Code/i)
    expect(typeCodeInput).toBeDisabled()
  })

  it('loads available tables and columns', async () => {
    render(<ChecklistTypeForm {...defaultProps} />, { wrapper: TestWrapper })

    await waitFor(() => {
      const tableSelect = screen.getByLabelText(/Target Table Name/i)
      expect(tableSelect).toBeInTheDocument()
    })
  })

  it('updates columns when table is selected', async () => {
    render(<ChecklistTypeForm {...defaultProps} />, { wrapper: TestWrapper })

    await waitFor(() => {
      const tableSelect = screen.getByLabelText(/Target Table Name/i)
      fireEvent.change(tableSelect, { target: { value: 'hrms_employees' } })
    })

    await waitFor(() => {
      const columnSelect = screen.getByLabelText(/Target ID Column/i)
      expect(columnSelect).toBeInTheDocument()
    })
  })
})
