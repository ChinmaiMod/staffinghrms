import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthProvider'
import { validateEmail, handleError } from '../../utils/validators'
import { logger } from '../../utils/logger'
import './Auth.css'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const validateForm = () => {
    const errors = {}
    
    // Validate email
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.valid) {
      errors.email = emailValidation.error
    }
    
    // Validate password
    if (!formData.password) {
      errors.password = 'Password is required'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent double submission
    if (isSubmitting) return
    
    setIsSubmitting(true)
    setError('')
    setFieldErrors({})
    
    // Validate form before submitting
    if (!validateForm()) {
      setError('Please fix the errors below')
      setIsSubmitting(false)
      return
    }
    
    setLoading(true)

    try {
      const { data, error: signInError } = await signIn(
        formData.email.trim(),
        formData.password
      )

      if (signInError) throw signInError

      if (!data.user) {
        throw new Error('Login failed. Please check your credentials.')
      }

      // Redirect will be handled by AuthProvider and route protection
      navigate('/dashboard')
    } catch (err) {
      logger.error('Login error:', err)
      
      // Handle specific error cases
      if (err.message.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in. Check your inbox for the verification link.')
      } else if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.')
      } else if (err.message.includes('Email link is invalid')) {
        setError('Your email verification link has expired. Please request a new one.')
      } else if (err.message.includes('User not found')) {
        setError('No account found with this email address. Please check your email or sign up.')
      } else {
        setError(handleError(err, 'login'))
      }
    } finally {
      setLoading(false)
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      })
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={fieldErrors.email ? 'error' : ''}
              placeholder="you@company.com"
              autoComplete="email"
            />
            {fieldErrors.email && (
              <small className="error-text">{fieldErrors.email}</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={fieldErrors.password ? 'error' : ''}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <small className="error-text">{fieldErrors.password}</small>
            )}
          </div>

          <div className="form-group">
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
