import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthProvider'
import { validateEmail, handleError } from '../../utils/validators'
import './Auth.css'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldError, setFieldError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent double submission
    if (isSubmitting) return
    
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    setFieldError('')
    
    // Validate email
    const emailValidation = validateEmail(email)
    if (!emailValidation.valid) {
      setFieldError(emailValidation.error)
      setError('Please enter a valid email address')
      setIsSubmitting(false)
      return
    }
    
    setLoading(true)

    try {
      const { error: resetError } = await resetPassword(email.trim())

      if (resetError) throw resetError

      setSuccess('Password reset email sent! Please check your inbox and spam folder.')
      setEmail('')
    } catch (err) {
      console.error('Password reset error:', err)
      setError(handleError(err, 'password reset'))
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p className="auth-subtitle">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setFieldError('')
              }}
              className={fieldError ? 'error' : ''}
              placeholder="you@company.com"
              autoComplete="email"
            />
            {fieldError && (
              <small className="error-text">{fieldError}</small>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="auth-footer">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
