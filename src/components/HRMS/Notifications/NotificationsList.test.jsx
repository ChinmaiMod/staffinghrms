/**
 * NotificationsList Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import NotificationsList from './NotificationsList'

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
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
]

const mockUseNotifications = {
  notifications: mockNotifications,
  loading: false,
  error: null,
  unreadCount: 1,
  fetchNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
}

vi.mock('../../../hooks/useNotifications', () => ({
  useNotifications: () => mockUseNotifications,
}))

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>

describe('NotificationsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders notifications page header', async () => {
    render(<NotificationsList />, { wrapper: TestWrapper })
    await waitFor(() => {
      expect(screen.getByText(/Notifications/i)).toBeInTheDocument()
    })
  })

  it('renders filter tabs', async () => {
    render(<NotificationsList />, { wrapper: TestWrapper })
    await waitFor(() => {
      expect(screen.getByText(/All/i)).toBeInTheDocument()
      expect(screen.getByText(/Unread/i)).toBeInTheDocument()
    })
  })

  it('displays notifications grouped by date', async () => {
    render(<NotificationsList />, { wrapper: TestWrapper })
    await waitFor(() => {
      expect(screen.getByText('Document Expiry Alert')).toBeInTheDocument()
      expect(screen.getByText('Timesheet Approval')).toBeInTheDocument()
    })
  })

  it('filters notifications by type when tab is clicked', async () => {
    render(<NotificationsList />, { wrapper: TestWrapper })
    await waitFor(() => {
      const complianceTab = screen.getByText(/Compliance/i)
      fireEvent.click(complianceTab)
    })
    expect(mockUseNotifications.fetchNotifications).toHaveBeenCalled()
  })

  it('calls markAllAsRead when "Mark All as Read" is clicked', async () => {
    render(<NotificationsList />, { wrapper: TestWrapper })
    await waitFor(() => {
      const markAllBtn = screen.getByText(/Mark All as Read/i)
      fireEvent.click(markAllBtn)
    })
    expect(mockUseNotifications.markAllAsRead).toHaveBeenCalled()
  })

  it('shows loading state initially', () => {
    mockUseNotifications.loading = true
    render(<NotificationsList />, { wrapper: TestWrapper })
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('shows empty state when no notifications', async () => {
    mockUseNotifications.notifications = []
    render(<NotificationsList />, { wrapper: TestWrapper })
    await waitFor(() => {
      expect(screen.getByText(/No notifications right now/i)).toBeInTheDocument()
    })
  })

  it('shows error state when error occurs', async () => {
    mockUseNotifications.error = 'Failed to load notifications'
    render(<NotificationsList />, { wrapper: TestWrapper })
    await waitFor(() => {
      expect(screen.getByText(/Error loading notifications/i)).toBeInTheDocument()
    })
  })

  it('calls deleteNotification when dismiss is clicked', async () => {
    render(<NotificationsList />, { wrapper: TestWrapper })
    await waitFor(() => {
      const dismissButtons = screen.getAllByRole('button', { name: /Dismiss/i })
      if (dismissButtons.length > 0) {
        fireEvent.click(dismissButtons[0])
        expect(mockUseNotifications.deleteNotification).toHaveBeenCalled()
      }
    })
  })
})
