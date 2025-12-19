import { useState, useEffect } from 'react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useNotifications } from '../../../hooks/useNotifications'
import NotificationCard from './NotificationCard'
import NotificationPreferences from './NotificationPreferences'
import LoadingSpinner from '../../Shared/LoadingSpinner'
import './NotificationsList.css'

/**
 * Filter tabs configuration
 */
const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread', filter: { read: false } },
  { id: 'compliance', label: 'Compliance', filter: { type: 'compliance_reminder' } },
  { id: 'timesheets', label: 'Timesheets', filter: { type: 'approval_required' } },
  { id: 'documents', label: 'Documents', filter: { type: 'document_expiry' } },
  { id: 'system', label: 'System', filter: { type: 'system_announcement' } },
]

/**
 * NotificationsList - Main notifications page
 * URL: /hrms/notifications
 * Based on UI_DESIGN_DOCS/13_NOTIFICATIONS.md
 */
function NotificationsList() {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

  const [activeFilter, setActiveFilter] = useState('all')
  const [showPreferences, setShowPreferences] = useState(false)

  // Fetch notifications when filter changes
  useEffect(() => {
    const filter = FILTER_TABS.find(tab => tab.id === activeFilter)
    fetchNotifications(filter?.filter || {})
  }, [activeFilter, fetchNotifications])

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = parseISO(notification.created_at)
    let groupKey

    if (isToday(date)) {
      groupKey = 'TODAY'
    } else if (isYesterday(date)) {
      groupKey = 'YESTERDAY'
    } else {
      groupKey = format(date, 'MMMM d, yyyy').toUpperCase()
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(notification)
    return groups
  }, {})

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.notification_id)
    }
    if (notification.action_url) {
      // Validate same-origin
      try {
        const url = new URL(notification.action_url, window.location.origin)
        if (url.origin === window.location.origin) {
          window.location.href = notification.action_url
        }
      } catch {
        // Invalid URL, ignore
      }
    }
  }

  const handleDismiss = async (notificationId, e) => {
    e.stopPropagation()
    await deleteNotification(notificationId)
  }

  return (
    <div className="notifications-page" data-testid="notifications-page">
      {/* Page Header */}
      <div className="notifications-header">
        <div>
          <h1 className="notifications-title">Notifications</h1>
          <p className="notifications-subtitle">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <button
          className="notifications-preferences-btn"
          onClick={() => setShowPreferences(true)}
          aria-label="Notification preferences"
        >
          <Cog6ToothIcon className="preferences-icon" aria-hidden="true" />
          Preferences
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="notifications-filters">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id
          const count = tab.id === 'unread' ? unreadCount : null

          return (
            <button
              key={tab.id}
              className={`notification-filter-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.id)}
              aria-pressed={isActive}
            >
              {tab.label}
              {count !== null && count > 0 && (
                <span className="filter-badge">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Actions Bar */}
      {notifications.length > 0 && (
        <div className="notifications-actions">
          {unreadCount > 0 && (
            <button
              className="notifications-mark-all-btn"
              onClick={markAllAsRead}
            >
              Mark All as Read
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="notifications-content">
        {loading ? (
          <LoadingSpinner message="Loading notifications..." data-testid="loading-spinner" />
        ) : error ? (
          <div className="notifications-error">
            <p>Error loading notifications: {error}</p>
            <button
              className="notifications-retry-btn"
              onClick={() => {
                const filter = FILTER_TABS.find(tab => tab.id === activeFilter)
                fetchNotifications(filter?.filter || {})
              }}
            >
              Retry
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">🔔</div>
            <h2>No notifications right now</h2>
            <p>You'll be notified when there's something new</p>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
            <div key={groupKey} className="notifications-group">
              <h2 className="notifications-group-header">{groupKey}</h2>
              <div className="notifications-group-content">
                {groupNotifications.map((notification) => (
                  <div key={notification.notification_id} className="notification-item-wrapper">
                    <NotificationCard
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                    <button
                      className="notification-dismiss-btn"
                      onClick={(e) => handleDismiss(notification.notification_id, e)}
                      aria-label="Dismiss notification"
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <NotificationPreferences
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  )
}

export default NotificationsList
