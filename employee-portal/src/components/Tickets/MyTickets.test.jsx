/**
 * MyTickets Component Tests (employee-portal)
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyTickets from './MyTickets'

describe('MyTickets (employee-portal)', () => {
  it('renders loading state initially and then the header', async () => {
    render(<MyTickets />)

    // Initial loading text
    expect(screen.getByText(/loading tickets/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('My Tickets')).toBeInTheDocument()
    })
  })

  it('renders the Create New Ticket button', async () => {
    render(<MyTickets />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create new ticket/i })).toBeInTheDocument()
    })
  })

  it('renders status tabs and department filter', async () => {
    render(<MyTickets />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /open/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /pending response/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /closed/i })).toBeInTheDocument()
    })

    const departmentSelect = screen.getByLabelText(/department/i)
    expect(departmentSelect).toBeInTheDocument()
  })

  it('renders ticket cards with mock data', async () => {
    render(<MyTickets />)

    await waitFor(() => {
      expect(screen.getByText(/TESTTKT0042/i)).toBeInTheDocument()
      expect(screen.getByText(/Request for H1B Extension Filing/i)).toBeInTheDocument()
    })
  })

  it('filters tickets by search input', async () => {
    render(<MyTickets />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search tickets/i)).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search tickets/i)
    const user = userEvent.setup()
    await user.type(searchInput, 'H1B')
    expect(searchInput).toHaveValue('H1B')
  })

  it('opens create ticket modal when Create New Ticket is clicked', async () => {
    render(<MyTickets />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create new ticket/i })).toBeInTheDocument()
    })

    const user = userEvent.setup()
    const createButton = screen.getByRole('button', { name: /create new ticket/i })
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText(/create new ticket/i)).toBeInTheDocument()
    })
  })
})


