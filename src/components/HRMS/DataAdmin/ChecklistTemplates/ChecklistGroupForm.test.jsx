/**
 * ChecklistGroupForm Component Tests
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

import ChecklistGroupForm from './ChecklistGroupForm'

const defaultProps = {
  onClose: vi.fn(),
  onSave: vi.fn(),
}

const renderComponent = (props = {}) => {
  return render(<ChecklistGroupForm {...defaultProps} {...props} />)
}

describe('ChecklistGroupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form for adding new group', () => {
    renderComponent()
    expect(screen.getByText(/add group/i)).toBeInTheDocument()
  })

  it('should render form for editing existing group', () => {
    const group = {
      group_name: 'Test Group',
      group_description: 'Test description',
      display_order: 1,
    }
    renderComponent({ group })
    expect(screen.getByText(/edit group/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Group')).toBeInTheDocument()
  })

  it('should validate required group name', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const submitButton = screen.getByText(/add group/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/group name is required/i)).toBeInTheDocument()
      expect(onSave).not.toHaveBeenCalled()
    })
  })

  it('should call onSave with form data when valid', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const nameInput = screen.getByPlaceholderText(/immigration documents/i)
    fireEvent.change(nameInput, { target: { value: 'Test Group' } })

    const submitButton = screen.getByText(/add group/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        group_name: 'Test Group',
        group_description: '',
        display_order: 0,
      })
    })
  })

  it('should call onClose when cancel is clicked', () => {
    const onClose = vi.fn()
    renderComponent({ onClose })

    const cancelButton = screen.getByText(/cancel/i)
    fireEvent.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('should update display order', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const nameInput = screen.getByPlaceholderText(/immigration documents/i)
    fireEvent.change(nameInput, { target: { value: 'Test Group' } })

    const orderInputs = screen.getAllByRole('spinbutton')
    const orderInput = orderInputs.find((input) => input.min === '0')
    if (orderInput) {
      fireEvent.change(orderInput, { target: { value: '5' } })
    }

    const submitButton = screen.getByText(/add group/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          display_order: 5,
        })
      )
    })
  })
})
