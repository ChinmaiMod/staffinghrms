/**
 * Standardized Error Response Utility
 * Implements UI_DESIGN_DOCS/18_ERROR_HANDLING_STANDARDS.md
 * 
 * Provides consistent error response structure across the application
 */

/**
 * Error Categories
 */
export const ErrorCategory = {
  USER_ERROR: 'user_error',
  SYSTEM_ERROR: 'system_error',
  EXTERNAL_ERROR: 'external_error',
}

/**
 * Standard Error Codes
 */
export const ErrorCode = {
  VALIDATION: 'ERR_VALIDATION',
  PARSE: 'ERR_PARSE',
  AUTH: 'ERR_AUTH',
  FORBIDDEN: 'ERR_FORBIDDEN',
  NOT_FOUND: 'ERR_NOT_FOUND',
  CONFLICT: 'ERR_CONFLICT',
  RATE_LIMIT: 'ERR_RATE_LIMIT',
  INTERNAL: 'ERR_INTERNAL',
  DATABASE: 'ERR_DATABASE',
  NETWORK: 'ERR_NETWORK',
  TIMEOUT: 'ERR_TIMEOUT',
  SERVICE_UNAVAILABLE: 'ERR_SERVICE_UNAVAILABLE',
}

/**
 * Field Error Structure
 */
export class FieldError {
  constructor(field, message, code, value = null) {
    this.field = field
    this.message = message
    this.code = code
    this.value = value
  }
}

/**
 * Generate unique request ID
 */
export const generateRequestId = () => {
  return `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
}

/**
 * Create standardized error response
 * 
 * @param {string} message - User-friendly error message
 * @param {string} code - Error code (from ErrorCode)
 * @param {string} category - Error category (from ErrorCategory)
 * @param {number} status - HTTP status code
 * @param {string} requestId - Request ID for tracking
 * @param {Object} options - Additional error details
 * @returns {Object} Standardized error response
 */
export const createErrorResponse = (
  message,
  code = ErrorCode.INTERNAL,
  category = ErrorCategory.SYSTEM_ERROR,
  status = 500,
  requestId = null,
  options = {}
) => {
  const {
    details,
    hint,
    field,
    fields,
    originalError,
    stack,
    retryable = false,
    retryAfter = null,
  } = options

  return {
    success: false,
    error: {
      message,
      code,
      category,
      timestamp: new Date().toISOString(),
      requestId: requestId || generateRequestId(),
      ...(details && { details }),
      ...(hint && { hint }),
      ...(field && { field }),
      ...(fields && { fields }),
      ...(originalError && typeof originalError === 'string' && { originalError }),
      ...(stack && { stack }),
      retryable,
      ...(retryAfter !== null && { retryAfter }),
    },
    status,
  }
}

/**
 * Create validation error response (single field)
 */
export const createValidationError = (field, message, code = 'REQUIRED', value = null, requestId = null) => {
  return createErrorResponse(
    message,
    ErrorCode.VALIDATION,
    ErrorCategory.USER_ERROR,
    400,
    requestId,
    {
      field,
      fields: [new FieldError(field, message, code, value)],
      hint: `Please correct the ${field} field and try again`,
      retryable: false,
    }
  )
}

/**
 * Create validation error response (multiple fields)
 */
export const createMultiFieldValidationError = (fields, requestId = null) => {
  const fieldCount = fields.length
  const message = fieldCount === 1
    ? `Validation failed: ${fields[0].message}`
    : `Validation failed for ${fieldCount} fields`

  return createErrorResponse(
    message,
    ErrorCode.VALIDATION,
    ErrorCategory.USER_ERROR,
    400,
    requestId,
    {
      fields,
      hint: 'Please correct the highlighted fields and try again',
      retryable: false,
    }
  )
}

/**
 * Create authentication error response
 */
export const createAuthError = (message = 'Authentication failed', requestId = null) => {
  return createErrorResponse(
    message || 'Please sign in to continue',
    ErrorCode.AUTH,
    ErrorCategory.USER_ERROR,
    401,
    requestId,
    {
      hint: 'Please sign in again to continue',
      retryable: false,
    }
  )
}

/**
 * Create forbidden error response
 */
export const createForbiddenError = (action = 'perform this action', requestId = null) => {
  return createErrorResponse(
    `You do not have permission to ${action}`,
    ErrorCode.FORBIDDEN,
    ErrorCategory.USER_ERROR,
    403,
    requestId,
    {
      hint: 'Contact your administrator if you need access to this feature',
      retryable: false,
    }
  )
}

/**
 * Create not found error response
 */
export const createNotFoundError = (resource, id = null, requestId = null) => {
  const details = id ? `No ${resource.toLowerCase()} exists with ID: ${id}` : `${resource} not found`
  return createErrorResponse(
    `${resource} not found`,
    ErrorCode.NOT_FOUND,
    ErrorCategory.USER_ERROR,
    404,
    requestId,
    {
      details,
      hint: 'Verify the ID is correct or the resource has not been deleted',
      retryable: false,
    }
  )
}

/**
 * Create conflict error response
 */
export const createConflictError = (resource, message = null, requestId = null) => {
  return createErrorResponse(
    message || `${resource} already exists`,
    ErrorCode.CONFLICT,
    ErrorCategory.USER_ERROR,
    409,
    requestId,
    {
      hint: 'Use different values or update the existing record',
      retryable: false,
    }
  )
}

/**
 * Create database error response
 */
export const createDatabaseError = (error, requestId = null) => {
  // Map common Supabase/PostgreSQL error codes
  const dbErrorMap = {
    '23505': {
      message: 'This record already exists. Please use a different value.',
      code: ErrorCode.CONFLICT,
      status: 409,
      category: ErrorCategory.USER_ERROR,
      hint: 'A record with this information already exists. Please use different values.',
    },
    '23503': {
      message: 'Cannot complete this action due to related data dependencies.',
      code: ErrorCode.VALIDATION,
      status: 400,
      category: ErrorCategory.USER_ERROR,
      hint: 'This record is referenced by other data and cannot be modified or deleted.',
    },
    '23502': {
      message: 'Required field is missing.',
      code: ErrorCode.VALIDATION,
      status: 400,
      category: ErrorCategory.USER_ERROR,
      hint: 'Please check that all required fields are filled.',
    },
    '22P02': {
      message: 'Invalid data format. Please check your input.',
      code: ErrorCode.VALIDATION,
      status: 400,
      category: ErrorCategory.USER_ERROR,
      hint: 'One or more fields contain invalid data. Please check your input values.',
    },
    '23514': {
      message: 'Data validation failed. Please check your input values.',
      code: ErrorCode.VALIDATION,
      status: 400,
      category: ErrorCategory.USER_ERROR,
      hint: 'The data you entered does not meet validation requirements.',
    },
    '42501': {
      message: 'You do not have permission to perform this action.',
      code: ErrorCode.FORBIDDEN,
      status: 403,
      category: ErrorCategory.USER_ERROR,
      hint: 'Contact your administrator if you need access to this feature.',
    },
    'PGRST116': {
      message: 'No data found.',
      code: ErrorCode.NOT_FOUND,
      status: 404,
      category: ErrorCategory.USER_ERROR,
      hint: 'The requested resource does not exist.',
    },
  }

  const errorCode = error?.code || error?.error_code || ''
  const errorInfo = dbErrorMap[errorCode] || {
    message: 'Database operation failed',
    code: ErrorCode.DATABASE,
    status: 500,
    category: ErrorCategory.SYSTEM_ERROR,
    hint: 'Please try again. If the problem persists, contact support.',
  }

  return createErrorResponse(
    errorInfo.message,
    errorInfo.code,
    errorInfo.category,
    errorInfo.status,
    requestId,
    {
      details: error?.message || error?.details || 'Database operation failed',
      hint: errorInfo.hint,
      originalError: error?.message,
      retryable: errorInfo.status === 500,
    }
  )
}

/**
 * Create network error response
 */
export const createNetworkError = (requestId = null) => {
  return createErrorResponse(
    'Connection failed. Please check your internet connection.',
    ErrorCode.NETWORK,
    ErrorCategory.EXTERNAL_ERROR,
    502,
    requestId,
    {
      hint: 'Check your internet connection and try again',
      retryable: true,
    }
  )
}

/**
 * Create timeout error response
 */
export const createTimeoutError = (requestId = null) => {
  return createErrorResponse(
    'Request timed out. Please try again.',
    ErrorCode.TIMEOUT,
    ErrorCategory.EXTERNAL_ERROR,
    504,
    requestId,
    {
      hint: 'The request took too long. Please try again.',
      retryable: true,
    }
  )
}

/**
 * Create rate limit error response
 */
export const createRateLimitError = (retryAfter = 60, requestId = null) => {
  return createErrorResponse(
    'Too many requests. Please slow down.',
    ErrorCode.RATE_LIMIT,
    ErrorCategory.USER_ERROR,
    429,
    requestId,
    {
      hint: `Please wait ${retryAfter} seconds before trying again`,
      retryable: true,
      retryAfter,
    }
  )
}

/**
 * Create parse error response
 */
export const createParseError = (requestId = null) => {
  return createErrorResponse(
    'Invalid request format',
    ErrorCode.PARSE,
    ErrorCategory.USER_ERROR,
    400,
    requestId,
    {
      hint: 'Check request syntax for errors',
      retryable: false,
    }
  )
}

/**
 * Convert any error to standardized error response
 * 
 * @param {Error|Object|string} error - Error to convert
 * @param {string} context - Context where error occurred
 * @param {string} requestId - Optional request ID
 * @returns {Object} Standardized error response
 */
export const normalizeError = (error, context = '', requestId = null) => {
  // If already a standardized error response, return as-is
  if (error && typeof error === 'object' && error.error && error.error.code) {
    return error
  }

  // Handle network errors
  if (!navigator.onLine || (error?.name === 'TypeError' && error?.message?.includes('fetch'))) {
    return createNetworkError(requestId)
  }

  // Handle Supabase/database errors
  if (error?.code || error?.error_code) {
    return createDatabaseError(error, requestId)
  }

  // Handle validation errors (from validators.js)
  if (error?.field || error?.fields) {
    if (Array.isArray(error.fields)) {
      return createMultiFieldValidationError(error.fields, requestId)
    }
    return createValidationError(
      error.field,
      error.message || 'Validation failed',
      error.code || 'VALIDATION',
      error.value,
      requestId
    )
  }

  // Handle string errors
  if (typeof error === 'string') {
    return createErrorResponse(
      error,
      ErrorCode.INTERNAL,
      ErrorCategory.SYSTEM_ERROR,
      500,
      requestId,
      {
        hint: 'Please try again. If the problem persists, contact support.',
        retryable: true,
      }
    )
  }

  // Handle Error objects
  if (error instanceof Error) {
    return createErrorResponse(
      error.message || 'An unexpected error occurred',
      ErrorCode.INTERNAL,
      ErrorCategory.SYSTEM_ERROR,
      500,
      requestId,
      {
        details: context ? `Error in ${context}` : 'An unexpected error occurred',
        hint: 'Please try again. If the problem persists, contact support.',
        originalError: error.message,
        stack: error.stack,
        retryable: true,
      }
    )
  }

  // Fallback for unknown error types
  return createErrorResponse(
    'An unexpected error occurred',
    ErrorCode.INTERNAL,
    ErrorCategory.SYSTEM_ERROR,
    500,
    requestId,
    {
      details: context ? `Error in ${context}` : 'An unexpected error occurred',
      hint: 'Please try again. If the problem persists, contact support.',
      retryable: true,
    }
  )
}

/**
 * Extract user-friendly message from error response
 */
export const getErrorMessage = (errorResponse) => {
  if (!errorResponse) {
    return 'An unexpected error occurred'
  }

  // If it's a standardized error response
  if (errorResponse.error && errorResponse.error.message) {
    return errorResponse.error.message
  }

  // If it's a string
  if (typeof errorResponse === 'string') {
    return errorResponse
  }

  // If it's an Error object
  if (errorResponse instanceof Error) {
    return errorResponse.message
  }

  // If it has a message property
  if (errorResponse.message) {
    return errorResponse.message
  }

  return 'An unexpected error occurred'
}

/**
 * Extract hint from error response
 */
export const getErrorHint = (errorResponse) => {
  if (errorResponse?.error?.hint) {
    return errorResponse.error.hint
  }
  return null
}

/**
 * Check if error is retryable
 */
export const isRetryable = (errorResponse) => {
  return errorResponse?.error?.retryable === true
}

/**
 * Get retry after time in seconds
 */
export const getRetryAfter = (errorResponse) => {
  return errorResponse?.error?.retryAfter || null
}
