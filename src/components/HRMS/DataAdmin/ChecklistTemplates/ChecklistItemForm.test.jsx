/**
 * ChecklistItemForm Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../../../../utils/validators', () => ({
  validateTextField: (value, fieldName, options) => {
    if (options.required && (!value || value.trim().length === 0)) {
      return { valid: false, error: `${fieldName} is required` }
    }
    if (options.minLength && value.length < options.minLength) {
      return { valid: false, error: `${fieldName} must be at least ${options.minLength} characters` }
    }
    return { valid: true }
  },
}))

import ChecklistItemForm from './ChecklistItemForm'

const defaultProps = {
  groups: [
    { group_id: 'group-001', group_name: 'Group 1' },
    { group_id: 'group-002', group_name: 'Group 2' },
  ],
  onClose: vi.fn(),
  onSave: vi.fn(),
}

const renderComponent = (props = {}) => {
  return render(<ChecklistItemForm {...defaultProps} {...props} />)
}

describe('ChecklistItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form for adding new item', () => {
    renderComponent()
    expect(screen.getByText(/add checklist item/i)).toBeInTheDocument()
  })

  it('should render form for editing existing item', () => {
    const item = {
      item_name: 'Test Item',
      item_description: 'Test description',
      group_id: 'group-001',
      display_order: 1,
      is_required: true,
      compliance_tracking_flag: true,
      visible_to_employee_flag: true,
      enable_ai_parsing: true,
    }
    renderComponent({ item })
    expect(screen.getByText(/edit checklist item/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument()
  })

  it('should validate required item name', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const submitButton = screen.getByText(/add item/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/item name is required/i)).toBeInTheDocument()
      expect(onSave).not.toHaveBeenCalled()
    })
  })

  it('should validate required group selection', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const nameInput = screen.getByPlaceholderText(/i-9 form/i)
    fireEvent.change(nameInput, { target: { value: 'Test Item' } })

    const submitButton = screen.getByText(/add item/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/group is required/i)).toBeInTheDocument()
      expect(onSave).not.toHaveBeenCalled()
    })
  })

  it('should call onSave with form data when valid', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const nameInput = screen.getByPlaceholderText(/i-9 form/i)
    fireEvent.change(nameInput, { target: { value: 'Test Item' } })

    const groupSelect = screen.getByDisplayValue(/select group/i)
    fireEvent.change(groupSelect, { target: { value: 'group-001' } })

    const submitButton = screen.getByText(/add item/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          item_name: 'Test Item',
          group_id: 'group-001',
        })
      )
    })
  })

  it('should handle checkbox flags', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const nameInput = screen.getByLabelText(/item name/i)
    fireEvent.change(nameInput, { target: { value: 'Test Item' } })

    const groupSelect = screen.getByLabelText(/group/i)
    fireEvent.change(groupSelect, { target: { value: 'group-001' } })

    const requiredCheckbox = screen.getByLabelText(/required item/i)
    fireEvent.click(requiredCheckbox)

    const submitButton = screen.getByText(/add item/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          is_required: true,
        })
      )
    })
  })

  it('should use default group when provided', () => {
    renderComponent({ defaultGroupId: 'group-002' })
    const groupSelect = screen.getByDisplayValue(/select group/i)
    expect(groupSelect.value).toBe('group-002')
  })

  it('should call onClose when cancel is clicked', () => {
    const onClose = vi.fn()
    renderComponent({ onClose })

    const cancelButton = screen.getByText(/cancel/i)
    fireEvent.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })
})
