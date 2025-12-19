/**
 * TestEmailModal Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../../../../utils/validators', () => ({
  validateTextField: (value, fieldName, options) => {
    if (options.required && (!value || value.trim().length === 0)) {
      return { valid: false, error: `${fieldName} is required` }
    }
    if (options.pattern && !options.pattern.test(value)) {
      return { valid: false, error: options.patternMessage || `${fieldName} format is invalid` }
    }
    return { valid: true }
  },
}))

import TestEmailModal from './TestEmailModal'

const mockTemplate = {
  template_id: 'template-001',
  template_name: 'Document Expiry Reminder',
}

const mockAvailableVariables = {
  employee: [
    { key: '{{employee_name}}', label: 'Employee Name' },
    { key: '{{employee_email}}', label: 'Employee Email' },
  ],
  document: [
    { key: '{{document_name}}', label: 'Document Name' },
    { key: '{{expiry_date}}', label: 'Expiry Date' },
  ],
}

const defaultProps = {
  template: mockTemplate,
  availableVariables: mockAvailableVariables,
  onClose: vi.fn(),
  onSend: vi.fn(),
}

const renderComponent = (props = {}) => {
  return render(<TestEmailModal {...defaultProps} {...props} />)
}

describe('TestEmailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal with template name', () => {
    renderComponent()
    expect(screen.getByText('Send Test Email')).toBeInTheDocument()
    expect(screen.getByText('Document Expiry Reminder')).toBeInTheDocument()
  })

  it('should initialize variables with default values', () => {
    renderComponent()
    expect(screen.getByDisplayValue('John Smith')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john.smith@company.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('H1B Visa Copy')).toBeInTheDocument()
  })

  it('should validate required email field', async () => {
    const onSend = vi.fn()
    renderComponent({ onSend })

    const submitButton = screen.getByText(/send test email/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(onSend).not.toHaveBeenCalled()
    })
  })

  it('should validate email format', async () => {
    const onSend = vi.fn()
    renderComponent({ onSend })

    const emailInput = screen.getByPlaceholderText(/admin@company.com/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

    const submitButton = screen.getByText(/send test email/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      expect(onSend).not.toHaveBeenCalled()
    })
  })

  it('should call onSend with email and variables when valid', async () => {
    const onSend = vi.fn().mockResolvedValue({})
    renderComponent({ onSend })

    const emailInput = screen.getByPlaceholderText(/admin@company.com/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const submitButton = screen.getByText(/send test email/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          '{{employee_name}}': 'John Smith',
          '{{employee_email}}': 'john.smith@company.com',
        })
      )
    })
  })

  it('should allow customizing variables', async () => {
    const onSend = vi.fn().mockResolvedValue({})
    renderComponent({ onSend })

    const employeeNameInput = screen.getByLabelText(/employee name/i)
    fireEvent.change(employeeNameInput, { target: { value: 'Jane Doe' } })

    const emailInput = screen.getByPlaceholderText(/admin@company.com/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const submitButton = screen.getByText(/send test email/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          '{{employee_name}}': 'Jane Doe',
        })
      )
    })
  })

  it('should show sending state during submission', async () => {
    const onSend = vi.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 100)
        })
    )
    renderComponent({ onSend })

    const emailInput = screen.getByPlaceholderText(/admin@company.com/i)
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const submitButton = screen.getByText(/send test email/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/sending/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  it('should call onClose when cancel is clicked', () => {
    const onClose = vi.fn()
    renderComponent({ onClose })

    const cancelButton = screen.getByText(/cancel/i)
    fireEvent.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('should display all variable categories', () => {
    renderComponent()
    expect(screen.getByText(/test data.*customize variables/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/employee name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/document name/i)).toBeInTheDocument()
  })

  it('should update variables when availableVariables change', () => {
    const { rerender } = renderComponent()

    const newVariables = {
      employee: [{ key: '{{new_var}}', label: 'New Variable' }],
    }

    rerender(<TestEmailModal {...defaultProps} availableVariables={newVariables} />)

    expect(screen.getByLabelText(/new variable/i)).toBeInTheDocument()
  })
})
