/**
 * Comprehensive validation utilities for all forms in the application
 * Provides clear, user-friendly error messages
 */

// Email validation
export const validateEmail = (email) => {
  if (!email) {
    return { valid: false, error: 'Email address is required' }
  }

  // Improved email regex to reject:
  // - Consecutive dots (..)
  // - Leading/trailing dots in local part
  // - Leading/trailing dots in domain
  // - Invalid domain structure
  const emailRegex = /^[A-Za-z0-9][A-Za-z0-9._%+-]*[A-Za-z0-9]@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/
  
  // Additional check: no consecutive dots
  if (email.includes('..')) {
    return { valid: false, error: 'Email address cannot contain consecutive dots (..)' }
  }

  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address (e.g., user@example.com)' }
  }

  if (email.length > 255) {
    return { valid: false, error: 'Email address is too long (maximum 255 characters)' }
  }

  return { valid: true, error: null }
}

// Password validation
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = false,
    requireLowercase = false,
    requireNumbers = false,
    requireSpecialChars = false
  } = options

  if (!password) {
    return { valid: false, error: 'Password is required' }
  }

  if (password.length < minLength) {
    return { valid: false, error: `Password must be at least ${minLength} characters long` }
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (maximum 128 characters)' }
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' }
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' }
  }

  if (requireNumbers && !/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }

  if (requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' }
  }

  return { valid: true, error: null }
}

// Password confirmation validation
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { valid: false, error: 'Please confirm your password' }
  }

  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match. Please try again.' }
  }

  return { valid: true, error: null }
}

// Username validation
export const validateUsername = (username, required = false) => {
  if (!username) {
    if (required) {
      return { valid: false, error: 'Username is required' }
    }
    return { valid: true, error: null }
  }

  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long' }
  }

  if (username.length > 50) {
    return { valid: false, error: 'Username is too long (maximum 50 characters)' }
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' }
  }

  return { valid: true, error: null }
}

// Company name validation
export const validateCompanyName = (companyName) => {
  if (!companyName || !companyName.trim()) {
    return { valid: false, error: 'Company name is required' }
  }

  if (companyName.trim().length < 2) {
    return { valid: false, error: 'Company name must be at least 2 characters long' }
  }

  if (companyName.length > 100) {
    return { valid: false, error: 'Company name is too long (maximum 100 characters)' }
  }

  return { valid: true, error: null }
}

// Phone number validation
export const validatePhone = (phone, required = false) => {
  if (!phone) {
    if (required) {
      return { valid: false, error: 'Phone number is required' }
    }
    return { valid: true, error: null }
  }

  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-().]/g, '')

  if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
    return { valid: false, error: 'Please enter a valid phone number (10-15 digits)' }
  }

  return { valid: true, error: null }
}

// Name validation (first name, last name)
export const validateName = (name, fieldName = 'Name', required = true) => {
  if (!name || !name.trim()) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` }
    }
    return { valid: true, error: null }
  }

  if (name.trim().length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters long` }
  }

  if (name.length > 50) {
    return { valid: false, error: `${fieldName} is too long (maximum 50 characters)` }
  }

  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { valid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` }
  }

  return { valid: true, error: null }
}

// URL validation
export const validateURL = (url, required = false) => {
  if (!url) {
    if (required) {
      return { valid: false, error: 'URL is required' }
    }
    return { valid: true, error: null }
  }

  try {
    new URL(url)
    return { valid: true, error: null }
  } catch {
    return { valid: false, error: 'Please enter a valid URL (e.g., https://example.com)' }
  }
}

// Text field validation (generic)
export const validateTextField = (value, fieldName, options = {}) => {
  const {
    required = true,
    minLength = 0,
    maxLength = 255,
    pattern = null,
    patternMessage = 'Invalid format'
  } = options

  if (!value || !value.trim()) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` }
    }
    return { valid: true, error: null }
  }

  if (value.trim().length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters long` }
  }

  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName} is too long (maximum ${maxLength} characters)` }
  }

  if (pattern && !pattern.test(value)) {
    return { valid: false, error: patternMessage }
  }

  return { valid: true, error: null }
}

// File validation
export const validateFile = (file, options = {}) => {
  const {
    required = false,
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options

  if (!file) {
    if (required) {
      return { valid: false, error: 'Please select a file' }
    }
    return { valid: true, error: null }
  }

  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(1)
    return { valid: false, error: `File size must be less than ${sizeMB}MB` }
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    const types = allowedExtensions.join(', ')
    return { valid: false, error: `Please upload a valid file type (${types})` }
  }

  return { valid: true, error: null }
}

// Date validation
export const validateDate = (date, fieldName = 'Date', options = {}) => {
  const {
    required = true,
    minDate = null,
    maxDate = null
  } = options

  if (!date) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` }
    }
    return { valid: true, error: null }
  }

  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: `Please enter a valid ${fieldName.toLowerCase()}` }
  }

  if (minDate && dateObj < new Date(minDate)) {
    return { valid: false, error: `${fieldName} cannot be before ${new Date(minDate).toLocaleDateString()}` }
  }

  if (maxDate && dateObj > new Date(maxDate)) {
    return { valid: false, error: `${fieldName} cannot be after ${new Date(maxDate).toLocaleDateString()}` }
  }

  return { valid: true, error: null }
}

// Number validation
export const validateNumber = (value, fieldName = 'Value', options = {}) => {
  const {
    required = true,
    min = null,
    max = null,
    integer = false
  } = options

  if (value === '' || value === null || value === undefined) {
    if (required) {
      return { valid: false, error: `${fieldName} is required` }
    }
    return { valid: true, error: null }
  }

  const num = Number(value)
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` }
  }

  if (integer && !Number.isInteger(num)) {
    return { valid: false, error: `${fieldName} must be a whole number` }
  }

  if (min !== null && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` }
  }

  if (max !== null && num > max) {
    return { valid: false, error: `${fieldName} cannot exceed ${max}` }
  }

  return { valid: true, error: null }
}

// Select/dropdown validation
export const validateSelect = (value, fieldName = 'Selection', required = true) => {
  if (!value || value === '' || value === null) {
    if (required) {
      return { valid: false, error: `Please select a ${fieldName.toLowerCase()}` }
    }
    return { valid: true, error: null }
  }

  return { valid: true, error: null }
}

// Multi-select validation
export const validateMultiSelect = (values, fieldName = 'Items', options = {}) => {
  const {
    required = true,
    minItems = 0,
    maxItems = null
  } = options

  if (!values || values.length === 0) {
    if (required) {
      return { valid: false, error: `Please select at least one ${fieldName.toLowerCase()}` }
    }
    return { valid: true, error: null }
  }

  if (minItems > 0 && values.length < minItems) {
    return { valid: false, error: `Please select at least ${minItems} ${fieldName.toLowerCase()}` }
  }

  if (maxItems !== null && values.length > maxItems) {
    return { valid: false, error: `You can only select up to ${maxItems} ${fieldName.toLowerCase()}` }
  }

  return { valid: true, error: null }
}

// Validate entire form
export const validateForm = (fields) => {
  const errors = {}
  let isValid = true

  for (const [fieldName, validation] of Object.entries(fields)) {
    if (!validation.valid) {
      errors[fieldName] = validation.error
      isValid = false
    }
  }

  return { isValid, errors }
}

// Format error message for display
export const formatErrorMessage = (error) => {
  if (!error) return ''

  if (typeof error === 'string') {
    return error
  }

  if (error.message) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

// Supabase error handler
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error)

  // Handle null/undefined errors
  if (!error) {
    return 'An error occurred while processing your request. Please try again.'
  }

  // Common Supabase error codes
  const errorMap = {
    '23505': 'This record already exists. Please use a different value.',
    '23503': 'Cannot delete this record because it is referenced by other data.',
    '23502': 'Required field is missing.',
    '42501': 'You do not have permission to perform this action.',
    'PGRST116': 'No data found.',
    '22P02': 'Invalid data format. Please check your input.',
    '23514': 'Data validation failed. Please check your input values.'
  }

  if (error.code && errorMap[error.code]) {
    return errorMap[error.code]
  }

  if (error.message) {
    // Handle specific message patterns
    if (error.message.includes('duplicate key')) {
      return 'This record already exists. Please use a different value.'
    }
    if (error.message.includes('violates foreign key')) {
      return 'Cannot complete this action due to related data dependencies.'
    }
    if (error.message.includes('permission denied')) {
      return 'You do not have permission to perform this action.'
    }
    if (error.message.includes('already exists')) {
      return error.message
    }
    if (error.message.includes('already registered')) {
      return error.message
    }

    return error.message
  }

  return 'An error occurred while processing your request. Please try again.'
}

// Network error handler
export const handleNetworkError = (error) => {
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network and try again.'
  }

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.'
  }

  return 'Network error occurred. Please try again.'
}

// Generic error handler
export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error)

  // Check for network errors
  if (!navigator.onLine || (error.name === 'TypeError' && error.message.includes('fetch'))) {
    return handleNetworkError(error)
  }

  // Check for Supabase errors
  if (error.code || (error.message && typeof error.message === 'string')) {
    return handleSupabaseError(error)
  }

  // Format generic errors
  return formatErrorMessage(error)
}
