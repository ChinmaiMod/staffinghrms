/**
 * EmployeeTickets (admin) Component Tests
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import EmployeeTickets from './EmployeeTickets'

const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('EmployeeTickets (admin)', () => {
  it('shows loading spinner initially', () => {
    render(<EmployeeTickets />, { wrapper: Wrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('renders page header after loading', async () => {
    render(<EmployeeTickets />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText('Employee Tickets')).toBeInTheDocument()
      expect(screen.getByText(/manage employee requests/i)).toBeInTheDocument()
    })
  })

  it('renders HR and Immigration tabs with counts', async () => {
    render(<EmployeeTickets />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /HR/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Immigration/i })).toBeInTheDocument()
    })
  })

  it('renders quick stats cards', async () => {
    render(<EmployeeTickets />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(screen.getByText(/New Today/i)).toBeInTheDocument()
      expect(screen.getByText(/In Review/i)).toBeInTheDocument()
      expect(screen.getByText(/Pending Response/i)).toBeInTheDocument()
      expect(screen.getByText(/Avg Resolve/i)).toBeInTheDocument()
    })
  })

  it('renders tickets list with HR tickets by default', async () => {
    render(<EmployeeTickets />, { wrapper: Wrapper })

    await waitFor(() => {
      expect(
        screen.getByText(/Payroll Discrepancy - Missing December Bonus/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/Benefits Enrollment Question/i)).toBeInTheDocument()
    })
  })
})


