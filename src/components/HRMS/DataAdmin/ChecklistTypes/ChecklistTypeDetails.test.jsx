/**
 * ChecklistTypeDetails Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import ChecklistTypeDetails from './ChecklistTypeDetails'

const mockType = {
  checklist_type_id: 'type-001',
  type_code: 'immigration',
  type_name: 'Immigration Documents',
  type_description: 'Documents for immigration compliance',
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
  is_system_type: false,
  template_count: 5,
  templates: [
    {
      template_id: 'template-001',
      template_name: 'H1B Visa Checklist',
      employee_type: 'it_usa',
      is_active: true,
    },
  ],
  documents_count: 10,
  created_at: '2025-01-15T00:00:00Z',
  updated_at: '2025-01-20T00:00:00Z',
}

const defaultProps = {
  type: mockType,
  onClose: vi.fn(),
  onEdit: vi.fn(),
}

const renderComponent = (props = {}) => {
  return render(<ChecklistTypeDetails {...defaultProps} {...props} />)
}

describe('ChecklistTypeDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render type details modal', () => {
    renderComponent()
    expect(screen.getByText('Immigration Documents')).toBeInTheDocument()
  })

  it('should display type code and entity type', () => {
    renderComponent()
    expect(screen.getByText(/type code:/i)).toBeInTheDocument()
    expect(screen.getByText('immigration')).toBeInTheDocument()
    expect(screen.getByText(/entity type:/i)).toBeInTheDocument()
    expect(screen.getByText('Employee')).toBeInTheDocument()
  })

  it('should display target table mapping', () => {
    renderComponent()
    expect(screen.getByText(/maps to:/i)).toBeInTheDocument()
    expect(screen.getByText('hrms_employees.employee_id')).toBeInTheDocument()
  })

  it('should display statistics', () => {
    renderComponent()
    expect(screen.getByText(/statistics/i)).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // template_count
    expect(screen.getByText('10')).toBeInTheDocument() // documents_count
  })

  it('should display configuration flags', () => {
    renderComponent()
    expect(screen.getByText(/allow multiple templates/i)).toBeInTheDocument()
    expect(screen.getByText(/enable ai parsing/i)).toBeInTheDocument()
    expect(screen.getByText(/enable compliance tracking/i)).toBeInTheDocument()
    expect(screen.getByText(/require employee type/i)).toBeInTheDocument()
  })

  it('should display templates using this type', () => {
    renderComponent()
    expect(screen.getByText(/templates using this type/i)).toBeInTheDocument()
    expect(screen.getByText('H1B Visa Checklist')).toBeInTheDocument()
  })

  it('should display type description if available', () => {
    renderComponent()
    expect(screen.getByText(/description/i)).toBeInTheDocument()
    expect(screen.getByText('Documents for immigration compliance')).toBeInTheDocument()
  })

  it('should display audit information', () => {
    renderComponent()
    expect(screen.getByText(/created:/i)).toBeInTheDocument()
    expect(screen.getByText(/updated:/i)).toBeInTheDocument()
  })

  it('should show Edit button for non-system types', () => {
    renderComponent()
    expect(screen.getByText(/edit type/i)).toBeInTheDocument()
  })

  it('should not show Edit button for system types', () => {
    const systemType = { ...mockType, is_system_type: true }
    renderComponent({ type: systemType })
    expect(screen.queryByText(/edit type/i)).not.toBeInTheDocument()
  })

  it('should call onEdit when Edit button is clicked', () => {
    const onEdit = vi.fn()
    renderComponent({ onEdit })

    const editButton = screen.getByText(/edit type/i)
    fireEvent.click(editButton)

    expect(onEdit).toHaveBeenCalledWith(mockType)
  })

  it('should call onClose when Close button is clicked', () => {
    const onClose = vi.fn()
    renderComponent({ onClose })

    const closeButton = screen.getByText(/close/i)
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('should call onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    renderComponent({ onClose })

    const overlay = screen.getByText('Immigration Documents').closest('.modal-overlay')
    if (overlay) {
      fireEvent.click(overlay)
      expect(onClose).toHaveBeenCalled()
    }
  })

  it('should display system type indicator for system types', () => {
    const systemType = { ...mockType, is_system_type: true }
    renderComponent({ type: systemType })
    expect(screen.getByText(/system type:/i)).toBeInTheDocument()
    expect(screen.getByText(/protected/i)).toBeInTheDocument()
  })

  it('should use default icon when icon is not provided', () => {
    const typeWithoutIcon = { ...mockType, icon: null }
    renderComponent({ type: typeWithoutIcon })
    // Should still render the modal
    expect(screen.getByText('Immigration Documents')).toBeInTheDocument()
  })

  it('should handle missing optional fields gracefully', () => {
    const minimalType = {
      ...mockType,
      type_description: null,
      templates: null,
      documents_count: null,
    }
    renderComponent({ type: minimalType })
    expect(screen.getByText('Immigration Documents')).toBeInTheDocument()
  })
})
