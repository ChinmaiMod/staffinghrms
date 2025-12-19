import { formatDistanceToNow } from 'date-fns'
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  BellIcon,
} from '@heroicons/react/24/outline'
import './NotificationCard.css'

/**
 * Priority configuration
 */
const PRIORITY_CONFIG = {
  urgent: {
    color: '#EF4444',
    icon: ExclamationCircleIcon,
    label: 'Critical',
  },
  high: {
    color: '#EF4444',
    icon: ExclamationCircleIcon,
    label: 'High',
  },
  normal: {
    color: '#F59E0B',
    icon: ExclamationTriangleIcon,
    label: 'Warning',
  },
  low: {
    color: '#3B82F6',
    icon: InformationCircleIcon,
    label: 'Info',
  },
}

/**
 * NotificationCard - Individual notification card component
 * @param {Object} notification - Notification object
 * @param {Function} onClick - Click handler
 * @param {Boolean} compact - Compact mode for dropdown
 */
function NotificationCard({ notification, onClick, compact = false }) {
  const priorityConfig = PRIORITY_CONFIG[notification.priority] || PRIORITY_CONFIG.normal
  const PriorityIcon = priorityConfig.icon
  const isUnread = !notification.is_read

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} min ago`
      if (diffMins < 1440) {
        const hours = Math.floor(diffMins / 60)
        return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`
      }

      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return 'Recently'
    }
  }

  return (
    <article
      className={`notification-card ${isUnread ? 'notification-card-unread' : 'notification-card-read'} ${compact ? 'notification-card-compact' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-labelledby={`notification-title-${notification.notification_id}`}
      aria-describedby={`notification-message-${notification.notification_id}`}
    >
      <div
        className="notification-priority-indicator"
        style={{ borderLeftColor: priorityConfig.color }}
      >
        <div
          className={`notification-priority-dot notification-priority-${notification.priority}`}
          style={{ backgroundColor: isUnread ? priorityConfig.color : 'transparent' }}
          data-testid="notification-priority-dot"
        >
          {isUnread ? (
            <PriorityIcon className="priority-icon" style={{ color: '#ffffff' }} />
          ) : (
            <div className="priority-icon-outline" style={{ borderColor: priorityConfig.color }} />
          )}
        </div>
      </div>

      <div className="notification-content">
        <div className="notification-header">
          <h3
            id={`notification-title-${notification.notification_id}`}
            className="notification-title"
          >
            {notification.title}
          </h3>
          <time className="notification-time" dateTime={notification.created_at}>
            {formatTime(notification.created_at)}
          </time>
        </div>

        <p
          id={`notification-message-${notification.notification_id}`}
          className="notification-message"
        >
          {notification.message}
        </p>

        {!compact && notification.action_url && (
          <div className="notification-actions">
            <a
              href={notification.action_url}
              className="notification-action-btn"
              onClick={(e) => {
                e.stopPropagation()
                // Validate same-origin
                try {
                  const url = new URL(notification.action_url, window.location.origin)
                  if (url.origin === window.location.origin) {
                    window.location.href = notification.action_url
                  }
                } catch {
                  // Invalid URL, ignore
                }
              }}
            >
              View Details
            </a>
          </div>
        )}
      </div>
    </article>
  )
}

export default NotificationCard
