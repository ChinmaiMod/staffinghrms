import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useNotifications } from '../../../hooks/useNotifications'
import NotificationCard from './NotificationCard'
import './NotificationBell.css'

/**
 * NotificationBell - Header notification bell with dropdown
 * Displays unread count and shows recent notifications in dropdown
 */
function NotificationBell() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      fetchNotifications({ limit: 5 })
    }
  }, [showDropdown, fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.notification_id)
    }
    setShowDropdown(false)
    // Navigate to action URL if provided
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const displayCount = unreadCount > 9 ? '9+' : unreadCount > 0 ? unreadCount : null

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-haspopup="true"
        aria-expanded={showDropdown}
        data-testid="notification-bell-btn"
      >
        <BellIcon className="notification-bell-icon" aria-hidden="true" />
        {displayCount && (
          <span className="notification-bell-badge" aria-live="polite">
            {displayCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown" role="region" aria-label="Notifications">
          <div className="notification-dropdown-header">
            <h3 className="notification-dropdown-title">Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="notification-mark-all-btn"
                onClick={handleMarkAllAsRead}
                aria-label="Mark all as read"
              >
                <CheckIcon className="mark-all-icon" aria-hidden="true" />
                Mark All
              </button>
            )}
          </div>

          <div className="notification-dropdown-content">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <p>No notifications right now</p>
                <p className="notification-empty-subtext">You'll be notified when there's something new</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <NotificationCard
                  key={notification.notification_id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  compact
                />
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-dropdown-footer">
              <Link
                to="/hrms/notifications"
                className="notification-view-all-link"
                onClick={() => setShowDropdown(false)}
              >
                View All Notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
