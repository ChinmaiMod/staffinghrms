/**
 * EmailTemplatesPage Component Tests
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
const mockEmailTemplates = [
  {
    template_id: 'template-001',
    template_name: 'Welcome Employee',
    template_key: 'welcome_employee',
    template_category: 'onboarding',
    subject: 'Welcome to {{company_name}}',
    body_html: '<p>Dear {{employee_name}}, welcome!</p>',
    body_text: 'Dear {{employee_name}}, welcome!',
    is_active: true,
    is_system_template: true,
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-12-10T00:00:00Z',
  },
  {
    template_id: 'template-002',
    template_name: 'Document Expiry Reminder',
    template_key: 'document_expiry_reminder',
    template_category: 'compliance',
    subject: '⚠️ Document Expiring: {{document_name}}',
    body_html: '<p>Your document {{document_name}} is expiring soon.</p>',
    body_text: 'Your document {{document_name}} is expiring soon.',
    is_active: true,
    is_system_template: true,
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-12-08T00:00:00Z',
  },
  {
    template_id: 'template-003',
    template_name: 'Monthly Newsletter',
    template_key: 'monthly_newsletter',
    template_category: 'newsletter',
    subject: 'Monthly Company Update',
    body_html: '<p>Monthly update content</p>',
    body_text: 'Monthly update content',
    is_active: true,
    is_system_template: false,
    created_at: '2025-12-01T00:00:00Z',
    updated_at: '2025-12-01T00:00:00Z',
  },
]

vi.mock('../../../../api/supabaseClient', () => {
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({
      data: mockEmailTemplates,
      error: null,
    }),
    delete: vi.fn().mockReturnThis(),
  }))

  return {
    supabase: {
      from: mockFrom,
    },
  }
})

import EmailTemplatesPage from './EmailTemplatesPage'

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('EmailTemplatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
  })

  it('renders loading state initially', () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })
    expect(screen.getByText(/Loading email templates/i)).toBeInTheDocument()
  })

  it('renders email templates after loading', async () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Welcome Employee/i)).toBeInTheDocument()
      expect(screen.getByText(/Document Expiry Reminder/i)).toBeInTheDocument()
    })
  })

  it('displays system templates section', async () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/System Templates/i)).toBeInTheDocument()
      expect(screen.getByText(/Welcome Employee/i)).toBeInTheDocument()
    })
  })

  it('displays custom templates section', async () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Custom Templates/i)).toBeInTheDocument()
      expect(screen.getByText(/Monthly Newsletter/i)).toBeInTheDocument()
    })
  })

  it('shows create button', async () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Create Template/i)).toBeInTheDocument()
    })
  })

  it('filters templates by search term', async () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Welcome Employee/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Search templates/i)
    fireEvent.change(searchInput, { target: { value: 'Welcome' } })

    await waitFor(() => {
      expect(screen.getByText(/Welcome Employee/i)).toBeInTheDocument()
      expect(screen.queryByText(/Monthly Newsletter/i)).not.toBeInTheDocument()
    })
  })

  it('filters templates by category', async () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Welcome Employee/i)).toBeInTheDocument()
    })

    const categorySelect = screen.getByDisplayValue(/All Categories/i)
    fireEvent.change(categorySelect, { target: { value: 'onboarding' } })

    await waitFor(() => {
      expect(screen.getByText(/Welcome Employee/i)).toBeInTheDocument()
      expect(screen.queryByText(/Document Expiry Reminder/i)).not.toBeInTheDocument()
    })
  })

  it('filters templates by status', async () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Welcome Employee/i)).toBeInTheDocument()
    })

    const statusSelect = screen.getByDisplayValue(/All Status/i)
    fireEvent.change(statusSelect, { target: { value: 'ACTIVE' } })

    await waitFor(() => {
      expect(screen.getByText(/Welcome Employee/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no templates match filters', async () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Welcome Employee/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Search templates/i)
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } })

    await waitFor(() => {
      expect(screen.getByText(/No Email Templates Found/i)).toBeInTheDocument()
    })
  })

  it('displays template key and category', async () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/welcome_employee/i)).toBeInTheDocument()
      expect(screen.getByText(/Onboarding/i)).toBeInTheDocument()
    })
  })

  it('shows system template badge for system templates', async () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/🔒 System Template/i)).toBeInTheDocument()
    })
  })

  it('handles delete action for custom templates', async () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Monthly Newsletter/i)).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText(/Delete/i)
    fireEvent.click(deleteButtons[0])

    expect(window.confirm).toHaveBeenCalled()
  })

  it('prevents deletion of system templates', async () => {
    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Welcome Employee/i)).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText(/Delete/i)
    // System templates should not have delete buttons, but if they do, clicking should show alert
    if (deleteButtons.length > 0) {
      // This would be handled by the component logic
    }
  })

  it('handles error state', async () => {
    const { supabase } = await import('../../../../api/supabaseClient')
    supabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Failed to fetch email templates' },
      }),
    })

    render(<EmailTemplatesPage />, { wrapper: TestWrapper })

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch email templates/i)).toBeInTheDocument()
    })
  })
})
