/**
 * LCAJobTitlesPage Component Tests
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
const mockLCAJobTitles = [
  {
    lca_job_title_id: 'lca-001',
    lca_job_title: 'Software Engineer',
    soc_code: '15-1252',
    soc_title: 'Software Developers',
    wage_level: 2,
    wage_level_description: 'Qualified, some experience required',
    oes_wage_source_url: 'https://example.com/wage',
    description: 'Software development role',
    notes: 'Test notes',
    is_active: true,
    tenant_id: 'test-tenant-id',
  },
  {
    lca_job_title_id: 'lca-002',
    lca_job_title: 'Data Scientist',
    soc_code: '15-2051',
    soc_title: 'Data Scientists',
    wage_level: 3,
    wage_level_description: 'Experienced, substantial experience required',
    oes_wage_source_url: '',
    description: 'Data science role',
    notes: '',
    is_active: true,
    tenant_id: 'test-tenant-id',
  },
]

vi.mock('../../../../api/supabaseClient', () => {
  const createQueryBuilder = () => {
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      delete: vi.fn(() => builder),
      order: vi.fn(() => builder),
    }
    // Make order() resolve with data on final call
    builder.order.mockResolvedValue({
      data: mockLCAJobTitles,
      error: null,
    })
    builder.delete.mockResolvedValue({
      data: null,
      error: null,
    })
    return builder
  }

  return {
    supabase: {
      from: vi.fn(() => createQueryBuilder()),
    },
  }
})

// Mock LCAJobTitleForm
vi.mock('./LCAJobTitleForm', () => ({
  default: ({ title, onClose, onSave }) => (
    <div data-testid="lca-job-title-form">
      <button onClick={onClose}>Close Form</button>
      <button onClick={onSave}>Save</button>
      {title && <div data-testid="editing-title">{title.lca_job_title}</div>}
    </div>
  ),
}))

import LCAJobTitlesPage from './LCAJobTitlesPage'

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <LCAJobTitlesPage />
    </BrowserRouter>
  )
}

describe('LCAJobTitlesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('should render loading state initially', async () => {
    renderComponent()
    expect(screen.getByText(/loading lca job titles/i)).toBeInTheDocument()
  })

  it('should render page header', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('LCA Job Titles Management')).toBeInTheDocument()
    })
  })

  it('should display LCA job titles in table', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Data Scientist')).toBeInTheDocument()
      expect(screen.getByText('15-1252')).toBeInTheDocument()
      expect(screen.getByText('15-2051')).toBeInTheDocument()
    })
  })

  it('should open form when Add LCA Job Title is clicked', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('+ Add LCA Job Title')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('+ Add LCA Job Title'))

    await waitFor(() => {
      expect(screen.getByTestId('lca-job-title-form')).toBeInTheDocument()
    })
  })

  it('should open form with title data when Edit is clicked', async () => {
    renderComponent()
    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit')
      fireEvent.click(editButtons[0])
    })

    await waitFor(() => {
      expect(screen.getByTestId('lca-job-title-form')).toBeInTheDocument()
      expect(screen.getByTestId('editing-title')).toHaveTextContent('Software Engineer')
    })
  })

  it('should filter titles by search term', async () => {
    renderComponent()
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search job titles/i)
      fireEvent.change(searchInput, { target: { value: 'Software' } })
    })

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.queryByText('Data Scientist')).not.toBeInTheDocument()
    })
  })

  it('should filter titles by SOC code', async () => {
    renderComponent()
    await waitFor(() => {
      const socSelect = screen.getByDisplayValue('All SOC Codes')
      fireEvent.change(socSelect, { target: { value: '15-1252' } })
    })

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.queryByText('Data Scientist')).not.toBeInTheDocument()
    })
  })

  it('should filter titles by wage level', async () => {
    renderComponent()
    await waitFor(() => {
      const wageSelect = screen.getByDisplayValue('All Wage Levels')
      fireEvent.change(wageSelect, { target: { value: '3' } })
    })

    await waitFor(() => {
      expect(screen.getByText('Data Scientist')).toBeInTheDocument()
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument()
    })
  })

  it('should show empty state when no titles match filters', async () => {
    renderComponent()
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search job titles/i)
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } })
    })

    await waitFor(() => {
      expect(screen.getByText(/no lca job titles found/i)).toBeInTheDocument()
    })
  })

  it('should handle delete with confirmation', async () => {
    renderComponent()
    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])
    })

    expect(window.confirm).toHaveBeenCalled()
  })

  it('should display wage level badges correctly', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText(/level 2/i)).toBeInTheDocument()
      expect(screen.getByText(/level 3/i)).toBeInTheDocument()
    })
  })

  it('should display status badges correctly', async () => {
    renderComponent()
    await waitFor(() => {
      const activeBadges = screen.getAllByText(/🟢 active/i)
      expect(activeBadges.length).toBeGreaterThan(0)
    })
  })

  it('should refresh data after form save', async () => {
    renderComponent()
    await waitFor(() => {
      fireEvent.click(screen.getByText('+ Add LCA Job Title'))
    })

    await waitFor(() => {
      const saveButton = screen.getByText('Save')
      fireEvent.click(saveButton)
    })

    await waitFor(() => {
      expect(screen.queryByTestId('lca-job-title-form')).not.toBeInTheDocument()
    })
  })
})
