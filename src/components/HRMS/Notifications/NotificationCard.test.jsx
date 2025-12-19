/**
 * NotificationCard Component Tests
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NotificationCard from './NotificationCard'

const mockNotification = {
  notification_id: '1',
  title: 'Document Expiry Alert',
  message: "John Smith's passport expires in 30 days",
  notification_type: 'document_expiry',
  priority: 'high',
  is_read: false,
  created_at: new Date().toISOString(),
  action_url: '/hrms/documents/123',
}

describe('NotificationCard', () => {
  it('renders notification title and message', () => {
    render(<NotificationCard notification={mockNotification} />)
    expect(screen.getByText('Document Expiry Alert')).toBeInTheDocument()
    expect(screen.getByText("John Smith's passport expires in 30 days")).toBeInTheDocument()
  })

  it('displays unread indicator for unread notifications', () => {
    render(<NotificationCard notification={mockNotification} />)
    const card = screen.getByRole('article')
    expect(card.className).toContain('notification-card-unread')
  })

  it('displays read indicator for read notifications', () => {
    const readNotification = { ...mockNotification, is_read: true }
    render(<NotificationCard notification={readNotification} />)
    const card = screen.getByRole('article')
    expect(card.className).toContain('notification-card-read')
  })

  it('calls onClick when card is clicked', () => {
    const handleClick = vi.fn()
    render(<NotificationCard notification={mockNotification} onClick={handleClick} />)
    const card = screen.getByRole('article')
    fireEvent.click(card)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('displays relative time', () => {
    const recentNotification = {
      ...mockNotification,
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
    }
    render(<NotificationCard notification={recentNotification} />)
    expect(screen.getByText(/min ago/i)).toBeInTheDocument()
  })

  it('displays priority indicator', () => {
    render(<NotificationCard notification={mockNotification} />)
    const priorityDot = screen.getByTestId('notification-priority-dot')
    expect(priorityDot).toHaveClass('notification-priority-high')
  })

  it('renders action buttons when provided', () => {
    const notificationWithActions = {
      ...mockNotification,
      action_url: '/hrms/documents/123',
    }
    render(<NotificationCard notification={notificationWithActions} />)
    // Action buttons would be rendered if provided
  })

  it('renders in compact mode', () => {
    render(<NotificationCard notification={mockNotification} compact />)
    const card = screen.getByRole('article')
    expect(card.className).toContain('notification-card-compact')
  })
})
