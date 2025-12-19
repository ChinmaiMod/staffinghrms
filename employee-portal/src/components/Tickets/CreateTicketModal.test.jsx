/**
 * CreateTicketModal Component Tests (employee-portal)
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateTicketModal from './CreateTicketModal'

describe('CreateTicketModal (employee-portal)', () => {
  const onClose = () => {}
  const onSuccess = () => {}

  it('renders the modal title and core fields', () => {
    render(<CreateTicketModal onClose={onClose} onSuccess={onSuccess} />)

    expect(screen.getByText(/create new ticket/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/department/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/request type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    render(<CreateTicketModal onClose={onClose} onSuccess={onSuccess} />)

    const user = userEvent.setup()
    const submitButton = screen.getByRole('button', { name: /submit ticket/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please select a department/i)).toBeInTheDocument()
    })
  })

  it('updates request types when department changes', async () => {
    render(<CreateTicketModal onClose={onClose} onSuccess={onSuccess} />)

    const user = userEvent.setup()
    const departmentSelect = screen.getByLabelText(/department/i)
    await user.selectOptions(departmentSelect, 'HR')

    await waitFor(() => {
      expect(screen.getByText(/payroll discrepancy/i)).toBeInTheDocument()
    })
  })

  it('accepts file uploads and shows file name', async () => {
    render(<CreateTicketModal onClose={onClose} onSuccess={onSuccess} />)

    const fileInput = screen.getByLabelText(/attach files/i)
    const user = userEvent.setup()
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/test.pdf/i)).toBeInTheDocument()
    })
  })
})


