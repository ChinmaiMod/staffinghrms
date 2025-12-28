/**
 * EmployeeForm Component Tests
 * Tests for the employee form (multi-step wizard) with async loading
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { BrowserRouter, useParams } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

// Mock useParams to return no employeeId by default
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: vi.fn(() => ({})),
  }
})

vi.mock('../../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    loading: false,
    profile: { id: 'test-profile-id', tenant_id: 'test-tenant-id' },
  }),
  AuthProvider: ({ children }) => children,
}))

vi.mock('../../../contexts/TenantProvider', () => ({
  useTenant: () => ({
    tenant: { id: 'test-tenant-id', company_name: 'Test Company' },
    loading: false,
    selectedBusiness: { id: 'test-business-id', business_name: 'Test Business' },
  }),
  TenantProvider: ({ children }) => children,
}))

vi.mock('../../../api/supabaseClient', () => {
  const mockInsert = vi.fn().mockResolvedValue({ 
    data: { employee_id: 'test-emp-id', employee_code: 'TEST00001' }, 
    error: null 
  })
  const mockUpdate = vi.fn().mockResolvedValue({ data: { employee_id: 'test-emp-id' }, error: null })
  const mockSelect = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const mockRpc = vi.fn().mockResolvedValue({ data: 'TEST00001', error: null })

  return {
    supabase: {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
        update: mockUpdate,
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      }),
      rpc: mockRpc,
    },
    // Export mocks for use in tests
    __mocks: {
      mockInsert,
      mockUpdate,
      mockSelect,
      mockEq,
      mockSingle,
      mockRpc,
    },
  }
})

import EmployeeForm from './EmployeeForm'
import { supabase } from '../../../api/supabaseClient'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('EmployeeForm', () => {
  let mockInsert, mockUpdate, mockRpc

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Reset useParams mock
    vi.mocked(useParams).mockReturnValue({})
    
    // Get mock functions from supabase client
    const fromMock = supabase.from('hrms_employees')
    mockInsert = fromMock.insert
    mockUpdate = fromMock.update
    mockRpc = supabase.rpc

    // Reset mocks
    mockInsert.mockResolvedValue({ 
      data: { employee_id: 'test-emp-id', employee_code: 'TEST00001' }, 
      error: null 
    })
    mockUpdate.mockResolvedValue({ data: { employee_id: 'test-emp-id' }, error: null })
    mockRpc.mockResolvedValue({ data: 'TEST00001', error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows loading spinner while initializing with employeeId', () => {
    // Mock useParams to return an employeeId for this test
    vi.mocked(useParams).mockReturnValue({ employeeId: 'test-emp-id' })
    
    render(<EmployeeForm testMode={false} />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders form after loading', async () => {
    render(<EmployeeForm testMode={true} />, { wrapper: TestWrapper })
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
  })

  it('allows saving progress on basic information step', async () => {
    const user = userEvent.setup()
    render(<EmployeeForm testMode={true} />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })

    // Fill required fields
    const firstName = screen.getByLabelText(/first name/i)
    const lastName = screen.getByLabelText(/last name/i)
    const email = screen.getByLabelText(/email/i)
    
    await user.type(firstName, 'John')
    await user.type(lastName, 'Doe')
    await user.type(email, 'john.doe@example.com')

    // Find and click Save Progress button
    const saveProgressBtn = screen.getByRole('button', { name: /save progress/i })
    expect(saveProgressBtn).toBeInTheDocument()
    
    await user.click(saveProgressBtn)

    // Wait for save to complete
    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalled()
    }, { timeout: 3000 })

    // Should call insert to create employee
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('validates required fields before saving progress on basic info step', async () => {
    const user = userEvent.setup()
    render(<EmployeeForm testMode={true} />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })

    // Try to save without required fields
    const saveProgressBtn = screen.getByRole('button', { name: /save progress/i })
    await user.click(saveProgressBtn)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/first name, last name, and email are required/i)).toBeInTheDocument()
    })
  })

  it('allows saving progress on address step', async () => {
    const user = userEvent.setup()
    render(<EmployeeForm testMode={true} />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })

    // Fill basic info and go to address step
    const firstName = screen.getByLabelText(/first name/i)
    const lastName = screen.getByLabelText(/last name/i)
    const email = screen.getByLabelText(/email/i)
    
    await user.type(firstName, 'John')
    await user.type(lastName, 'Doe')
    await user.type(email, 'john.doe@example.com')

    // Save progress first to create employee
    const saveProgressBtn = screen.getByRole('button', { name: /save progress/i })
    await user.click(saveProgressBtn)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
    }, { timeout: 3000 })

    // Go to address step
    const continueBtn = screen.getByRole('button', { name: /continue/i })
    await user.click(continueBtn)

    // Fill address
    const streetAddress = screen.getByLabelText(/street address/i)
    await user.type(streetAddress, '123 Main St')

    // Save progress on address step
    const saveProgressBtn2 = screen.getByRole('button', { name: /save progress/i })
    await user.click(saveProgressBtn2)

    // Should update employee
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('allows saving progress on employment step', async () => {
    const user = userEvent.setup()
    render(<EmployeeForm testMode={true} />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })

    // Fill basic info and save
    const firstName = screen.getByLabelText(/first name/i)
    const lastName = screen.getByLabelText(/last name/i)
    const email = screen.getByLabelText(/email/i)
    
    await user.type(firstName, 'John')
    await user.type(lastName, 'Doe')
    await user.type(email, 'john.doe@example.com')

    const saveProgressBtn = screen.getByRole('button', { name: /save progress/i })
    await user.click(saveProgressBtn)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
    }, { timeout: 3000 })

    // Navigate to employment step
    const continueBtn = screen.getByRole('button', { name: /continue/i })
    await user.click(continueBtn)
    await user.click(continueBtn)

    // Select employee type
    const itUsaOption = screen.getByLabelText(/it usa/i)
    await user.click(itUsaOption)

    // Save progress on employment step
    const saveProgressBtn2 = screen.getByRole('button', { name: /save progress/i })
    await user.click(saveProgressBtn2)

    // Should update employee
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled()
    }, { timeout: 3000 })
  })

  it('does not show save progress button on review step', async () => {
    const user = userEvent.setup()
    render(<EmployeeForm testMode={true} />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })

    // Navigate to review step
    const continueBtn = screen.getByRole('button', { name: /continue/i })
    await user.click(continueBtn)
    await user.click(continueBtn)
    await user.click(continueBtn)

    // Save progress button should not be visible
    const saveProgressBtn = screen.queryByRole('button', { name: /save progress/i })
    expect(saveProgressBtn).not.toBeInTheDocument()
  })

  it('submits complete form successfully', async () => {
    const user = userEvent.setup()
    const { container } = render(<EmployeeForm testMode={true} />, { wrapper: TestWrapper })
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })

    // Fill all required fields and navigate through steps
    const firstName = screen.getByLabelText(/first name/i)
    const lastName = screen.getByLabelText(/last name/i)
    const email = screen.getByLabelText(/email/i)
    
    await user.type(firstName, 'John')
    await user.type(lastName, 'Doe')
    await user.type(email, 'john.doe@example.com')

    // Navigate through all steps
    const continueBtn = screen.getByRole('button', { name: /continue/i })
    await user.click(continueBtn)
    await user.click(continueBtn)
    await user.click(continueBtn)

    // Submit form
    const form = container.querySelector('form')
    const submitBtn = screen.getByRole('button', { name: /create employee|update employee/i })
    
    fireEvent.submit(form)

    // Should call insert or update
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled() || expect(mockUpdate).toHaveBeenCalled()
    }, { timeout: 3000 })
  })
})
