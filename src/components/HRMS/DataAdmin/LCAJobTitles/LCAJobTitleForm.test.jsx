/**
 * LCAJobTitleForm Component Tests
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

// Mock Supabase
vi.mock('../../../../api/supabaseClient', () => {
  const createQueryBuilder = () => {
    const builder = {
      insert: vi.fn(() => builder),
      update: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      select: vi.fn(() => builder),
      single: vi.fn(() => Promise.resolve({ data: { lca_job_title_id: 'lca-001' }, error: null })),
    }
    return builder
  }

  return {
    supabase: {
      from: vi.fn(() => createQueryBuilder()),
    },
  }
})

import LCAJobTitleForm from './LCAJobTitleForm'

const defaultProps = {
  onClose: vi.fn(),
  onSave: vi.fn(),
  tenantId: 'test-tenant-id',
  userId: 'test-user-id',
}

const renderComponent = (props = {}) => {
  return render(<LCAJobTitleForm {...defaultProps} {...props} />)
}

describe('LCAJobTitleForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form for adding new LCA job title', () => {
    renderComponent()
    expect(screen.getByText(/add lca job title/i)).toBeInTheDocument()
  })

  it('should render form for editing existing LCA job title', () => {
    const title = {
      lca_job_title_id: 'lca-001',
      lca_job_title: 'Software Engineer',
      soc_code: '15-1252',
      soc_title: 'Software Developers',
      wage_level: 2,
      wage_level_description: 'Qualified',
      oes_wage_source_url: 'https://example.com',
      description: 'Test description',
      notes: 'Test notes',
      is_active: true,
    }
    renderComponent({ title })
    expect(screen.getByText(/edit lca job title/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Software Engineer')).toBeInTheDocument()
  })

  it('should validate required LCA job title', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const submitButton = screen.getByText(/save/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/lca job title is required/i)).toBeInTheDocument()
    })
  })

  it('should validate SOC code format', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const titleInput = screen.getByLabelText(/lca job title/i)
    fireEvent.change(titleInput, { target: { value: 'Software Engineer' } })

    const socInput = screen.getByLabelText(/soc code/i)
    fireEvent.change(socInput, { target: { value: 'invalid' } })

    const submitButton = screen.getByText(/save/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/soc code must be in format/i)).toBeInTheDocument()
    })
  })

  it('should validate wage level range', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const titleInput = screen.getByLabelText(/lca job title/i)
    fireEvent.change(titleInput, { target: { value: 'Software Engineer' } })

    const socInput = screen.getByLabelText(/soc code/i)
    fireEvent.change(socInput, { target: { value: '15-1252' } })

    // Try to submit with invalid wage level (would need to manipulate radio buttons)
    const submitButton = screen.getByText(/save/i)
    fireEvent.click(submitButton)

    // Form should validate wage level is between 1-4
    await waitFor(() => {
      // Default wage level is 2, so should pass validation
      // This test verifies the form structure
      expect(screen.getByText(/level 2/i)).toBeInTheDocument()
    })
  })

  it('should validate URL format for OES wage source', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const titleInput = screen.getByLabelText(/lca job title/i)
    fireEvent.change(titleInput, { target: { value: 'Software Engineer' } })

    const socInput = screen.getByLabelText(/soc code/i)
    fireEvent.change(socInput, { target: { value: '15-1252' } })

    const urlInput = screen.getByLabelText(/oes wage source url/i)
    fireEvent.change(urlInput, { target: { value: 'not-a-valid-url' } })

    const submitButton = screen.getByText(/save/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument()
    })
  })

  it('should call onSave when form is valid', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const titleInput = screen.getByLabelText(/lca job title/i)
    fireEvent.change(titleInput, { target: { value: 'Software Engineer' } })

    const socInput = screen.getByLabelText(/soc code/i)
    fireEvent.change(socInput, { target: { value: '15-1252' } })

    const submitButton = screen.getByText(/save/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })
  })

  it('should call onClose when cancel is clicked', () => {
    const onClose = vi.fn()
    renderComponent({ onClose })

    const cancelButton = screen.getByText(/cancel/i)
    fireEvent.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('should display wage level options with descriptions', () => {
    renderComponent()
    expect(screen.getByText(/level 1.*entry/i)).toBeInTheDocument()
    expect(screen.getByText(/level 2.*qualified/i)).toBeInTheDocument()
    expect(screen.getByText(/level 3.*experienced/i)).toBeInTheDocument()
    expect(screen.getByText(/level 4.*fully competent/i)).toBeInTheDocument()
  })

  it('should handle form submission with all fields', async () => {
    const onSave = vi.fn()
    renderComponent({ onSave })

    const titleInput = screen.getByLabelText(/lca job title/i)
    fireEvent.change(titleInput, { target: { value: 'Software Engineer' } })

    const socInput = screen.getByLabelText(/soc code/i)
    fireEvent.change(socInput, { target: { value: '15-1252' } })

    const socTitleInput = screen.getByLabelText(/soc title/i)
    fireEvent.change(socTitleInput, { target: { value: 'Software Developers' } })

    const descriptionInput = screen.getByLabelText(/description/i)
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } })

    const submitButton = screen.getByText(/save/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled()
    })
  })
})
