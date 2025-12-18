import './LoadingSpinner.css'

/**
 * Loading spinner component with multiple sizes
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} message - Optional loading message to display
 * @param {boolean} fullScreen - Whether to show as full screen overlay
 */
function LoadingSpinner({ size = 'md', message = '', fullScreen = false }) {
  const spinner = (
    <div className={`loading-spinner-container ${fullScreen ? 'full-screen' : ''}`}>
      <div 
        className={`loading-spinner ${size}`} 
        data-testid="loading-spinner"
        role="status"
        aria-label={message || 'Loading'}
      >
        <div className="spinner-ring" />
        <div className="spinner-ring" />
        <div className="spinner-ring" />
        <div className="spinner-ring" />
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="loading-overlay" data-testid="loading-overlay">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default LoadingSpinner
