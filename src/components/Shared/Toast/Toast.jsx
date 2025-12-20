import { useEffect } from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useToast, ToastSeverity } from '../../../contexts/ToastProvider'
import './Toast.css'

/**
 * Individual Toast Component
 * Implements UI_DESIGN_DOCS/00_DESIGN_SYSTEM.md Toast Notifications
 */
function Toast({ toast }) {
  const { removeToast } = useToast()

  const handleDismiss = () => {
    removeToast(toast.id)
  }

  // Get icon based on severity
  const getIcon = () => {
    switch (toast.severity) {
      case ToastSeverity.SUCCESS:
        return <CheckCircleIcon className="toast-icon" />
      case ToastSeverity.ERROR:
      case ToastSeverity.CRITICAL:
        return <ExclamationCircleIcon className="toast-icon" />
      case ToastSeverity.WARNING:
        return <ExclamationTriangleIcon className="toast-icon" />
      case ToastSeverity.INFO:
      default:
        return <InformationCircleIcon className="toast-icon" />
    }
  }

  // Get border color based on severity
  const getBorderColor = () => {
    switch (toast.severity) {
      case ToastSeverity.SUCCESS:
        return 'var(--color-success)'
      case ToastSeverity.ERROR:
      case ToastSeverity.CRITICAL:
        return 'var(--color-error)'
      case ToastSeverity.WARNING:
        return 'var(--color-warning)'
      case ToastSeverity.INFO:
      default:
        return 'var(--color-primary)'
    }
  }

  const borderColor = getBorderColor()
  const isCritical = toast.severity === ToastSeverity.CRITICAL

  return (
    <div
      className={`toast ${toast.severity} ${isCritical ? 'critical' : ''}`}
      style={{ borderLeftColor: borderColor }}
      role="alert"
      aria-live={toast.severity === ToastSeverity.ERROR || toast.severity === ToastSeverity.CRITICAL ? 'assertive' : 'polite'}
    >
      <div className="toast-content">
        <div className="toast-icon-wrapper" style={{ color: borderColor }}>
          {getIcon()}
        </div>
        <div className="toast-body">
          {toast.title && <div className="toast-title">{toast.title}</div>}
          <div className="toast-message">
            {toast.message.split('\n').map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
          {toast.action && (
            <div className="toast-action">
              {toast.action}
            </div>
          )}
        </div>
        <button
          className="toast-close"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          type="button"
        >
          <XMarkIcon className="toast-close-icon" />
        </button>
      </div>
    </div>
  )
}

/**
 * Toast Container Component
 * Renders all active toasts
 */
export function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

export default ToastContainer
