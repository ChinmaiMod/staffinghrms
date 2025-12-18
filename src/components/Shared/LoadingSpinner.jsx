
import React from 'react'
import './LoadingSpinner.css'

/**
 * LoadingSpinner - Simple spinner for loading states
 * Accepts optional message and testId for testing
 */
export default function LoadingSpinner({ message = 'Loading...', fullScreen = false, testId = 'loading-spinner' }) {
  return (
    <div className={`loading-spinner${fullScreen ? ' full-screen' : ''}`} data-testid={testId}>
      <div className="spinner" />
      <span className="loading-message">{message}</span>
    </div>
  )
}
