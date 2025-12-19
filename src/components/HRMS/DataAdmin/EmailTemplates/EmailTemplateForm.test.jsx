/**
 * EmailTemplateForm Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Mock Supabase
vi.mock('../../../../api/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    })),
  },
}))

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

import EmailTemplateForm from './EmailTemplateForm'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

const defaultProps = {
  onClose: vi.fn(),
  onSave: vi.fn(),
  tenantId: 'test-tenant-id',
  userId: 'test-user-id',
  availableVariables: {
    employee: [
      { key: '{{employee_name}}', label: 'Employee Name' },
      { key: '{{employee_email}}', label: 'Employee Email' },
    ],
    document: [
      { key: '{{document_name}}', label: 'Document Name' },
    ],
  },
}

describe('EmailTemplateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create form when no template provided', () => {
    render(<EmailTemplateForm {...defaultProps} />, { wrapper: TestWrapper })

    expect(screen.getByText(/Create Email Template/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Template Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Template Key/i)).toBeInTheDocument()
  })

  it('renders edit form when template provided', () => {
    const template = {
      template_id: 'template-001',
      template_name: 'Test Template',
      template_key: 'test_template',
      template_category: 'general',
      subject: 'Test Subject',
      body_html: '<p>Test body</p>',
      body_text: 'Test body',
      is_active: true,
    }

    render(<EmailTemplateForm {...defaultProps} template={template} />, { wrapper: TestWrapper })

    expect(screen.getByText(/Edit Email Template/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Template')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test_template')).toBeInTheDocument()
  })

  it('validates required fields on submit', async () => {
    render(<EmailTemplateForm {...defaultProps} />, { wrapper: TestWrapper })

    const submitButton = screen.getByText(/Save Template/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Template Name is required/i)).toBeInTheDocument()
    })
  })

  it('validates template key format', async () => {
    render(<EmailTemplateForm {...defaultProps} />, { wrapper: TestWrapper })

    const templateKeyInput = screen.getByLabelText(/Template Key/i)
    fireEvent.change(templateKeyInput, { target: { value: 'Invalid Key!' } })

    // Template key should be auto-formatted to lowercase and remove invalid chars
    await waitFor(() => {
      expect(templateKeyInput.value).toBe('invalidkey')
    })
  })

  it('disables template key for system templates', () => {
    const systemTemplate = {
      template_id: 'template-001',
      template_name: 'System Template',
      template_key: 'system_template',
      is_system_template: true,
      template_category: 'general',
      subject: 'Test',
      body_html: '<p>Test</p>',
      is_active: true,
    }

    render(<EmailTemplateForm {...defaultProps} template={systemTemplate} />, { wrapper: TestWrapper })

    const templateKeyInput = screen.getByLabelText(/Template Key/i)
    expect(templateKeyInput).toBeDisabled()
  })

  it('shows variables panel when toggle is clicked', async () => {
    render(<EmailTemplateForm {...defaultProps} />, { wrapper: TestWrapper })

    const showVariablesButton = screen.getByText(/Show Variables/i)
    fireEvent.click(showVariablesButton)

    await waitFor(() => {
      expect(screen.getByText(/Available Variables/i)).toBeInTheDocument()
      expect(screen.getByText(/{{employee_name}}/i)).toBeInTheDocument()
    })
  })

  it('inserts variable when clicked', async () => {
    render(<EmailTemplateForm {...defaultProps} />, { wrapper: TestWrapper })

    const showVariablesButton = screen.getByText(/Show Variables/i)
    fireEvent.click(showVariablesButton)

    await waitFor(() => {
      const variableButton = screen.getByText(/{{employee_name}}/i)
      fireEvent.click(variableButton)
    })

    const bodyTextarea = screen.getByLabelText(/Email Body \(HTML\)/i)
    expect(bodyTextarea.value).toContain('{{employee_name}}')
  })

  it('toggles preview mode', async () => {
    render(<EmailTemplateForm {...defaultProps} />, { wrapper: TestWrapper })

    const bodyTextarea = screen.getByLabelText(/Email Body \(HTML\)/i)
    fireEvent.change(bodyTextarea, {
      target: { value: '<p>Dear {{employee_name}}, welcome!</p>' },
    })

    const previewButton = screen.getByText(/Preview/i)
    fireEvent.click(previewButton)

    await waitFor(() => {
      expect(screen.getByText(/Dear John Smith, welcome!/i)).toBeInTheDocument()
    })
  })

  it('calls onClose when cancel is clicked', () => {
    render(<EmailTemplateForm {...defaultProps} />, { wrapper: TestWrapper })

    const cancelButton = screen.getByText(/Cancel/i)
    fireEvent.click(cancelButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('validates email body is not empty', async () => {
    render(<EmailTemplateForm {...defaultProps} />, { wrapper: TestWrapper })

    const templateNameInput = screen.getByLabelText(/Template Name/i)
    const templateKeyInput = screen.getByLabelText(/Template Key/i)
    const subjectInput = screen.getByLabelText(/Email Subject/i)

    fireEvent.change(templateNameInput, { target: { value: 'Test Template' } })
    fireEvent.change(templateKeyInput, { target: { value: 'test_template' } })
    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } })

    const submitButton = screen.getByText(/Save Template/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Email body is required/i)).toBeInTheDocument()
    })
  })
})
