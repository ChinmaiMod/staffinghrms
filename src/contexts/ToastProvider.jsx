import { createContext, useContext, useState, useCallback } from 'react'

/**
 * Toast Notification Context
 * Implements UI_DESIGN_DOCS/00_DESIGN_SYSTEM.md and 18_ERROR_HANDLING_STANDARDS.md
 */

export const ToastContext = createContext(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

/**
 * Toast severity levels
 */
export const ToastSeverity = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
}

/**
 * Auto-dismiss durations (in milliseconds)
 */
const AUTO_DISMISS_DURATIONS = {
  [ToastSeverity.INFO]: 5000,
  [ToastSeverity.SUCCESS]: 3000,
  [ToastSeverity.WARNING]: 10000,
  [ToastSeverity.ERROR]: null, // No auto-dismiss
  [ToastSeverity.CRITICAL]: null, // No auto-dismiss
}

/**
 * Toast Provider Component
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  /**
   * Add a new toast
   */
  const addToast = useCallback((message, severity = ToastSeverity.INFO, options = {}) => {
    const {
      title = null,
      duration = null,
      action = null,
      onDismiss = null,
      persistent = false,
    } = options

    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const autoDismiss = duration !== null
      ? duration
      : persistent
        ? null
        : AUTO_DISMISS_DURATIONS[severity] || null

    const toast = {
      id,
      message,
      severity,
      title,
      action,
      onDismiss,
      persistent: persistent || autoDismiss === null,
      timestamp: new Date().toISOString(),
    }

    setToasts((prev) => [...prev, toast])

    // Auto-dismiss if configured
    if (autoDismiss !== null && autoDismiss > 0) {
      setTimeout(() => {
        removeToast(id)
      }, autoDismiss)
    }

    return id
  }, [])

  /**
   * Remove a toast by ID
   */
  const removeToast = useCallback((id) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id)
      if (toast?.onDismiss) {
        toast.onDismiss()
      }
      return prev.filter((t) => t.id !== id)
    })
  }, [])

  /**
   * Clear all toasts
   */
  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  /**
   * Convenience methods for each severity
   */
  const showInfo = useCallback((message, options = {}) => {
    return addToast(message, ToastSeverity.INFO, options)
  }, [addToast])

  const showSuccess = useCallback((message, options = {}) => {
    return addToast(message, ToastSeverity.SUCCESS, options)
  }, [addToast])

  const showWarning = useCallback((message, options = {}) => {
    return addToast(message, ToastSeverity.WARNING, options)
  }, [addToast])

  const showError = useCallback((message, options = {}) => {
    return addToast(message, ToastSeverity.ERROR, options)
  }, [addToast])

  const showCritical = useCallback((message, options = {}) => {
    return addToast(message, ToastSeverity.CRITICAL, options)
  }, [addToast])

  /**
   * Show error from standardized error response
   */
  const showErrorResponse = useCallback((errorResponse, options = {}) => {
    const message = errorResponse?.error?.message || 'An unexpected error occurred'
    const hint = errorResponse?.error?.hint
    const severity = errorResponse?.error?.category === 'user_error'
      ? ToastSeverity.WARNING
      : ToastSeverity.ERROR

    const fullMessage = hint ? `${message}\n${hint}` : message

    return addToast(fullMessage, severity, {
      ...options,
      title: options.title || 'Error',
    })
  }, [addToast])

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAll,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showCritical,
    showErrorResponse,
  }

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}
