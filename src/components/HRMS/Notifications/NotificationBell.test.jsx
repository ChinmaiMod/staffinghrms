/**
 * NotificationBell Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import NotificationBell from './NotificationBell'

// Mock useNotifications hook
const mockNotifications = [
  {
    notification_id: '1',
    title: 'Document Expiry Alert',
    message: "John Smith's passport expires in 30 days",
    notification_type: 'document_expiry',
    priority: 'high',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    notification_id: '2',
    title: 'Timesheet Approval',
    message: 'Mary Chen submitted timesheet for review',
    notification_type: 'approval_required',
    priority: 'normal',
    is_read: false,
    created_at: new Date().toISOString(),
  },
]

const mockUseNotifications = {
  notifications: mockNotifications,
  loading: false,
  error: null,
  unreadCount: 2,
  fetchNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
}

vi.mock('../../../hooks/useNotifications', () => ({
  useNotifications: () => mockUseNotifications,
}))

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders notification bell icon', () => {
    render(<NotificationBell />, { wrapper: TestWrapper })
    expect(screen.getByTestId('notification-bell-btn')).toBeInTheDocument()
  })

  it('displays unread count badge when there are unread notifications', () => {
    render(<NotificationBell />, { wrapper: TestWrapper })
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('does not display badge when unread count is 0', () => {
    mockUseNotifications.unreadCount = 0
    render(<NotificationBell />, { wrapper: TestWrapper })
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('displays "9+" badge when unread count exceeds 9', () => {
    mockUseNotifications.unreadCount = 15
    render(<NotificationBell />, { wrapper: TestWrapper })
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('opens dropdown when bell is clicked', async () => {
    render(<NotificationBell />, { wrapper: TestWrapper })
    const bellBtn = screen.getByTestId('notification-bell-btn')
    fireEvent.click(bellBtn)

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /Notifications/i })).toBeInTheDocument()
    })
  })

  it('displays notifications in dropdown', async () => {
    render(<NotificationBell />, { wrapper: TestWrapper })
    const bellBtn = screen.getByTestId('notification-bell-btn')
    fireEvent.click(bellBtn)

    await waitFor(() => {
      expect(screen.getByText('Document Expiry Alert')).toBeInTheDocument()
      expect(screen.getByText('Timesheet Approval')).toBeInTheDocument()
    })
  })

  it('calls markAsRead when notification is clicked', async () => {
    render(<NotificationBell />, { wrapper: TestWrapper })
    const bellBtn = screen.getByTestId('notification-bell-btn')
    fireEvent.click(bellBtn)

    await waitFor(() => {
      const notification = screen.getByText('Document Expiry Alert')
      fireEvent.click(notification.closest('div'))
    })

    expect(mockUseNotifications.markAsRead).toHaveBeenCalledWith('1')
  })

  it('calls markAllAsRead when "Mark All" button is clicked', async () => {
    render(<NotificationBell />, { wrapper: TestWrapper })
    const bellBtn = screen.getByTestId('notification-bell-btn')
    fireEvent.click(bellBtn)

    await waitFor(() => {
      const markAllBtn = screen.getByText(/Mark All/i)
      fireEvent.click(markAllBtn)
    })

    expect(mockUseNotifications.markAllAsRead).toHaveBeenCalled()
  })

  it('displays "View All" link in dropdown', async () => {
    render(<NotificationBell />, { wrapper: TestWrapper })
    const bellBtn = screen.getByTestId('notification-bell-btn')
    fireEvent.click(bellBtn)

    await waitFor(() => {
      const viewAllLink = screen.getByText(/View All/i)
      expect(viewAllLink.closest('a')).toHaveAttribute('href', '/hrms/notifications')
    })
  })

  it('closes dropdown when clicking outside', async () => {
    render(<NotificationBell />, { wrapper: TestWrapper })
    const bellBtn = screen.getByTestId('notification-bell-btn')
    fireEvent.click(bellBtn)

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /Notifications/i })).toBeInTheDocument()
    })

    fireEvent.click(document.body)

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /Notifications/i })).not.toBeInTheDocument()
    })
  })

  it('shows loading state', () => {
    mockUseNotifications.loading = true
    render(<NotificationBell />, { wrapper: TestWrapper })
    // Should still render bell, but dropdown might show loading
    expect(screen.getByTestId('notification-bell-btn')).toBeInTheDocument()
  })

  it('shows empty state when no notifications', async () => {
    mockUseNotifications.notifications = []
    mockUseNotifications.unreadCount = 0
    render(<NotificationBell />, { wrapper: TestWrapper })
    const bellBtn = screen.getByTestId('notification-bell-btn')
    fireEvent.click(bellBtn)

    await waitFor(() => {
      expect(screen.getByText(/No notifications/i)).toBeInTheDocument()
    })
  })
})
