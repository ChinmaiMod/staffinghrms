# Error Handling & Testing Standards - UI Design Specification

## 📋 Executive Summary

This document defines comprehensive error handling standards for the Staffing HRMS application. It covers Edge Function error handling, React frontend error handling patterns, testing requirements with Vitest, and documentation standards. The goal is to provide detailed, actionable error messages throughout the entire stack with complete test coverage.

**Applies To:** All HRMS modules, Edge Functions, React components, and API integrations
**Testing Framework:** Vitest + React Testing Library
**Error Tracking:** Sentry-ready integration

---

## 🔴 1. Error Response Structure Standards

### 1.1 Standard Error Response Format

All errors across the application MUST use this consistent structure:

```typescript
interface ErrorResponse {
  // Required fields
  success: false;
  error: {
    message: string;           // User-friendly message
    code: ErrorCode;           // Standardized error code
    category: ErrorCategory;   // user_error | system_error | external_error
    timestamp: string;         // ISO 8601 format
    requestId: string;         // UUID for tracking
    
    // Optional fields
    details?: string;          // Technical description
    hint?: string;             // Suggested fix/action
    field?: string;            // Field name for validation errors
    fields?: FieldError[];     // Multiple field errors
    originalError?: string;    // Original error (dev only)
    stack?: string;            // Stack trace (dev only)
    retryable?: boolean;       // Whether client should retry
    retryAfter?: number;       // Seconds to wait before retry
  };
}

interface FieldError {
  field: string;
  message: string;
  code: string;
  value?: any;                 // The invalid value (sanitized)
}

type ErrorCategory = 'user_error' | 'system_error' | 'external_error';

type ErrorCode = 
  | 'ERR_VALIDATION'
  | 'ERR_AUTH'
  | 'ERR_FORBIDDEN'
  | 'ERR_NOT_FOUND'
  | 'ERR_DATABASE'
  | 'ERR_NETWORK'
  | 'ERR_TIMEOUT'
  | 'ERR_RATE_LIMIT'
  | 'ERR_PARSE'
  | 'ERR_CONFLICT'
  | 'ERR_SERVICE_UNAVAILABLE'
  | 'ERR_INTERNAL';
```

### 1.2 HTTP Status Code Mapping

| Error Code | HTTP Status | Category | Retryable | Description |
|------------|-------------|----------|-----------|-------------|
| `ERR_VALIDATION` | 400 | user_error | No | Invalid input data |
| `ERR_PARSE` | 400 | user_error | No | JSON parsing failed |
| `ERR_AUTH` | 401 | user_error | No | Authentication required |
| `ERR_FORBIDDEN` | 403 | user_error | No | Permission denied |
| `ERR_NOT_FOUND` | 404 | user_error | No | Resource not found |
| `ERR_CONFLICT` | 409 | user_error | No | Duplicate/conflict |
| `ERR_RATE_LIMIT` | 429 | user_error | Yes | Too many requests |
| `ERR_INTERNAL` | 500 | system_error | Yes | Server error |
| `ERR_DATABASE` | 500 | system_error | Yes | Database error |
| `ERR_NETWORK` | 502 | external_error | Yes | External service failed |
| `ERR_TIMEOUT` | 504 | external_error | Yes | Request timeout |
| `ERR_SERVICE_UNAVAILABLE` | 503 | system_error | Yes | Service unavailable |

### 1.3 Example Error Responses

**Validation Error (Single Field):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid email address format",
    "code": "ERR_VALIDATION",
    "category": "user_error",
    "timestamp": "2025-12-17T10:30:45.123Z",
    "requestId": "req_abc123def456",
    "field": "email",
    "hint": "Please enter a valid email address (e.g., user@example.com)",
    "retryable": false
  }
}
```

**Validation Error (Multiple Fields):**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed for 3 fields",
    "code": "ERR_VALIDATION",
    "category": "user_error",
    "timestamp": "2025-12-17T10:30:45.123Z",
    "requestId": "req_abc123def456",
    "fields": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "INVALID_FORMAT"
      },
      {
        "field": "phone",
        "message": "Phone number is required",
        "code": "REQUIRED"
      },
      {
        "field": "start_date",
        "message": "Start date must be in the future",
        "code": "INVALID_DATE"
      }
    ],
    "hint": "Please correct the highlighted fields and try again",
    "retryable": false
  }
}
```

**Database Error:**
```json
{
  "success": false,
  "error": {
    "message": "Failed to save employee record",
    "code": "ERR_DATABASE",
    "category": "system_error",
    "timestamp": "2025-12-17T10:30:45.123Z",
    "requestId": "req_abc123def456",
    "details": "Unique constraint violation on employee_code",
    "hint": "An employee with this code already exists. Please use a different code.",
    "retryable": false,
    "originalError": "23505: duplicate key value violates unique constraint"
  }
}
```

**Rate Limit Error:**
```json
{
  "success": false,
  "error": {
    "message": "Too many requests. Please slow down.",
    "code": "ERR_RATE_LIMIT",
    "category": "user_error",
    "timestamp": "2025-12-17T10:30:45.123Z",
    "requestId": "req_abc123def456",
    "hint": "Please wait 60 seconds before trying again",
    "retryable": true,
    "retryAfter": 60
  }
}
```

---

## ⚡ 2. Edge Function Error Handling

### 2.1 Standard Edge Function Template

```typescript
// supabase/functions/example-function/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers - MUST be included in ALL responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Environment check
const isDev = Deno.env.get('ENVIRONMENT') !== 'production';

// Generate unique request ID
const generateRequestId = () => `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;

// Error response builder
const createErrorResponse = (
  message: string,
  code: string,
  category: 'user_error' | 'system_error' | 'external_error',
  status: number,
  requestId: string,
  options?: {
    details?: string;
    hint?: string;
    field?: string;
    fields?: Array<{ field: string; message: string; code: string }>;
    originalError?: Error;
    retryable?: boolean;
    retryAfter?: number;
  }
) => {
  const error: any = {
    message,
    code,
    category,
    timestamp: new Date().toISOString(),
    requestId,
    retryable: options?.retryable ?? false,
  };

  if (options?.details) error.details = options.details;
  if (options?.hint) error.hint = options.hint;
  if (options?.field) error.field = options.field;
  if (options?.fields) error.fields = options.fields;
  if (options?.retryAfter) error.retryAfter = options.retryAfter;
  
  // Only include sensitive info in development
  if (isDev && options?.originalError) {
    error.originalError = options.originalError.message;
    error.stack = options.originalError.stack;
  }

  // Log full error details for debugging
  console.error(`[${requestId}] Error:`, {
    code,
    message,
    category,
    status,
    details: options?.details,
    originalError: options?.originalError?.message,
    stack: options?.originalError?.stack,
  });

  return new Response(
    JSON.stringify({ success: false, error }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
};

// Success response builder
const createSuccessResponse = (data: any, requestId: string, status = 200) => {
  return new Response(
    JSON.stringify({ success: true, data, requestId }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
};

serve(async (req) => {
  const requestId = req.headers.get('x-request-id') || generateRequestId();
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authentication Check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse(
        'Authentication required',
        'ERR_AUTH',
        'user_error',
        401,
        requestId,
        { hint: 'Please include a valid Authorization header with your request' }
      );
    }

    // 2. Parse Request Body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return createErrorResponse(
        'Invalid JSON in request body',
        'ERR_PARSE',
        'user_error',
        400,
        requestId,
        {
          details: 'The request body could not be parsed as valid JSON',
          hint: 'Ensure your request body is valid JSON format',
          originalError: parseError,
        }
      );
    }

    // 3. Validation
    const validationErrors = validateInput(body);
    if (validationErrors.length > 0) {
      return createErrorResponse(
        `Validation failed for ${validationErrors.length} field(s)`,
        'ERR_VALIDATION',
        'user_error',
        400,
        requestId,
        {
          fields: validationErrors,
          hint: 'Please correct the highlighted fields and try again',
        }
      );
    }

    // 4. Initialize Supabase Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 5. Get User from Token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return createErrorResponse(
        'Invalid or expired authentication token',
        'ERR_AUTH',
        'user_error',
        401,
        requestId,
        {
          hint: 'Please sign in again to refresh your session',
          originalError: authError,
        }
      );
    }

    // 6. Authorization Check (example)
    const hasPermission = await checkUserPermission(supabase, user.id, 'required_permission');
    if (!hasPermission) {
      return createErrorResponse(
        'You do not have permission to perform this action',
        'ERR_FORBIDDEN',
        'user_error',
        403,
        requestId,
        {
          hint: 'Contact your administrator if you believe this is an error',
        }
      );
    }

    // 7. Database Operations (with specific error handling)
    try {
      const { data, error: dbError } = await supabase
        .from('table_name')
        .insert(body)
        .select()
        .single();

      if (dbError) {
        // Handle specific database errors
        if (dbError.code === '23505') {
          return createErrorResponse(
            'A record with this information already exists',
            'ERR_CONFLICT',
            'user_error',
            409,
            requestId,
            {
              details: dbError.message,
              hint: 'Please use different values or update the existing record',
              originalError: new Error(dbError.message),
            }
          );
        }

        if (dbError.code === '23503') {
          return createErrorResponse(
            'Referenced record does not exist',
            'ERR_NOT_FOUND',
            'user_error',
            400,
            requestId,
            {
              details: dbError.message,
              hint: 'Ensure all referenced records exist before creating this record',
              originalError: new Error(dbError.message),
            }
          );
        }

        // Generic database error
        return createErrorResponse(
          'Database operation failed',
          'ERR_DATABASE',
          'system_error',
          500,
          requestId,
          {
            details: dbError.message,
            hint: 'Please try again. If the problem persists, contact support.',
            originalError: new Error(dbError.message),
            retryable: true,
          }
        );
      }

      // 8. Success Response
      return createSuccessResponse(data, requestId, 201);

    } catch (dbException) {
      return createErrorResponse(
        'An unexpected database error occurred',
        'ERR_DATABASE',
        'system_error',
        500,
        requestId,
        {
          hint: 'Please try again. If the problem persists, contact support.',
          originalError: dbException,
          retryable: true,
        }
      );
    }

  } catch (error) {
    // Catch-all for unexpected errors
    console.error(`[${requestId}] Unhandled error:`, error);
    
    return createErrorResponse(
      'An unexpected error occurred',
      'ERR_INTERNAL',
      'system_error',
      500,
      requestId,
      {
        hint: 'Please try again. If the problem persists, contact support.',
        originalError: error,
        retryable: true,
      }
    );
  }
});

// Validation helper
function validateInput(body: any): Array<{ field: string; message: string; code: string }> {
  const errors: Array<{ field: string; message: string; code: string }> = [];
  
  if (!body.name || body.name.trim() === '') {
    errors.push({ field: 'name', message: 'Name is required', code: 'REQUIRED' });
  } else if (body.name.length > 255) {
    errors.push({ field: 'name', message: 'Name must be 255 characters or less', code: 'MAX_LENGTH' });
  }
  
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.push({ field: 'email', message: 'Invalid email format', code: 'INVALID_FORMAT' });
  }
  
  return errors;
}

// Permission check helper
async function checkUserPermission(supabase: any, userId: string, permission: string): Promise<boolean> {
  // Implementation depends on your RBAC system
  return true;
}
```

### 2.2 Error Type Handlers

```typescript
// Error type specific handlers
const ErrorHandlers = {
  // JSON Parsing Error
  handleParseError: (error: Error, requestId: string) => {
    return createErrorResponse(
      'Invalid JSON in request body',
      'ERR_PARSE',
      'user_error',
      400,
      requestId,
      {
        details: 'The request body could not be parsed as valid JSON',
        hint: 'Check for syntax errors: missing quotes, trailing commas, or invalid characters',
        originalError: error,
      }
    );
  },

  // Validation Error
  handleValidationError: (fields: FieldError[], requestId: string) => {
    const fieldCount = fields.length;
    return createErrorResponse(
      fieldCount === 1 
        ? `Validation failed: ${fields[0].message}`
        : `Validation failed for ${fieldCount} fields`,
      'ERR_VALIDATION',
      'user_error',
      400,
      requestId,
      {
        fields,
        hint: 'Please correct the highlighted fields and try again',
      }
    );
  },

  // Authentication Error
  handleAuthError: (error: Error | null, requestId: string) => {
    return createErrorResponse(
      'Authentication failed',
      'ERR_AUTH',
      'user_error',
      401,
      requestId,
      {
        hint: 'Please sign in again to continue',
        originalError: error || undefined,
      }
    );
  },

  // Authorization Error
  handleForbiddenError: (action: string, requestId: string) => {
    return createErrorResponse(
      `You do not have permission to ${action}`,
      'ERR_FORBIDDEN',
      'user_error',
      403,
      requestId,
      {
        hint: 'Contact your administrator if you need access to this feature',
      }
    );
  },

  // Not Found Error
  handleNotFoundError: (resource: string, id: string, requestId: string) => {
    return createErrorResponse(
      `${resource} not found`,
      'ERR_NOT_FOUND',
      'user_error',
      404,
      requestId,
      {
        details: `No ${resource.toLowerCase()} exists with ID: ${id}`,
        hint: 'Verify the ID is correct or the resource has not been deleted',
      }
    );
  },

  // Database Error
  handleDatabaseError: (error: any, requestId: string) => {
    const dbErrorMap: Record<string, { message: string; code: string; status: number }> = {
      '23505': { message: 'A record with this information already exists', code: 'ERR_CONFLICT', status: 409 },
      '23503': { message: 'Referenced record does not exist', code: 'ERR_NOT_FOUND', status: 400 },
      '23502': { message: 'Required field is missing', code: 'ERR_VALIDATION', status: 400 },
      '22P02': { message: 'Invalid data format', code: 'ERR_VALIDATION', status: 400 },
      '42501': { message: 'Permission denied', code: 'ERR_FORBIDDEN', status: 403 },
    };

    const errorInfo = dbErrorMap[error.code] || {
      message: 'Database operation failed',
      code: 'ERR_DATABASE',
      status: 500,
    };

    return createErrorResponse(
      errorInfo.message,
      errorInfo.code,
      errorInfo.status === 500 ? 'system_error' : 'user_error',
      errorInfo.status,
      requestId,
      {
        details: error.message,
        hint: 'Please try again or contact support if the problem persists',
        originalError: new Error(error.message),
        retryable: errorInfo.status === 500,
      }
    );
  },

  // Rate Limit Error
  handleRateLimitError: (retryAfter: number, requestId: string) => {
    return createErrorResponse(
      'Too many requests. Please slow down.',
      'ERR_RATE_LIMIT',
      'user_error',
      429,
      requestId,
      {
        hint: `Please wait ${retryAfter} seconds before trying again`,
        retryable: true,
        retryAfter,
      }
    );
  },

  // Timeout Error
  handleTimeoutError: (operation: string, requestId: string) => {
    return createErrorResponse(
      `Request timed out while ${operation}`,
      'ERR_TIMEOUT',
      'external_error',
      504,
      requestId,
      {
        hint: 'The operation is taking longer than expected. Please try again.',
        retryable: true,
      }
    );
  },

  // Network/External Service Error
  handleNetworkError: (service: string, error: Error, requestId: string) => {
    return createErrorResponse(
      `Unable to connect to ${service}`,
      'ERR_NETWORK',
      'external_error',
      502,
      requestId,
      {
        hint: 'The external service may be temporarily unavailable. Please try again later.',
        originalError: error,
        retryable: true,
      }
    );
  },

  // Service Unavailable
  handleServiceUnavailable: (reason: string, requestId: string) => {
    return createErrorResponse(
      'Service temporarily unavailable',
      'ERR_SERVICE_UNAVAILABLE',
      'system_error',
      503,
      requestId,
      {
        details: reason,
        hint: 'Please try again in a few minutes',
        retryable: true,
        retryAfter: 60,
      }
    );
  },
};
```

---

## 🖥️ 3. React Frontend Error Handling

### 3.1 Error Display Component

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ERROR TOAST NOTIFICATION (Top-Right Corner)                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ 🔴 Error                                                          [×]  │  │
│ │                                                                         │  │
│ │ Failed to save employee record                                         │  │
│ │                                                                         │  │
│ │ An employee with this code already exists.                             │  │
│ │ Please use a different employee code.                                   │  │
│ │                                                                         │  │
│ │ [▼ Show Details]                              [Retry] [Dismiss]        │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ Expanded Details:                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ Error Code: ERR_CONFLICT                                               │  │
│ │ Request ID: req_abc123def456                                           │  │
│ │ Timestamp: 2025-12-17T10:30:45.123Z                                    │  │
│ │                                                                         │  │
│ │ Technical Details:                                                      │  │
│ │ duplicate key value violates unique constraint "employees_code_key"    │  │
│ │                                                                         │  │
│ │ [Copy Error Details]                                                    │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Toast Severity Levels

| Severity | Color | Icon | Auto-Dismiss | Use Case |
|----------|-------|------|--------------|----------|
| **Info** | Blue (`#3B82F6`) | `ℹ️` | 5s | Informational messages |
| **Success** | Green (`#10B981`) | `✓` | 3s | Successful operations |
| **Warning** | Amber (`#F59E0B`) | `⚠️` | 10s | Non-blocking issues |
| **Error** | Red (`#EF4444`) | `✕` | No | Errors requiring attention |
| **Critical** | Red with pulse | `🔴` | No | System-wide issues |

### 3.3 Inline Form Validation Errors

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ FORM WITH VALIDATION ERRORS                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Email Address *                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ invalid.email                                                            ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│ 🔴 Invalid email format. Please enter a valid email (e.g., user@example.com) │
│                                                                              │
│ Phone Number *                                                               │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │                                                                          ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│ 🔴 Phone number is required                                                  │
│                                                                              │
│ Start Date *                                                                 │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ 01/01/2020                                                            📅 ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│ 🔴 Start date cannot be in the past                                          │
│                                                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ ⚠️ Please fix 3 errors before submitting                               │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│                                              [Cancel]  [Submit] (disabled)   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Error Boundary Fallback UI

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ERROR BOUNDARY - COMPONENT CRASH                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           ┌─────────────────┐                                │
│                           │       😵        │                                │
│                           │   Oops!         │                                │
│                           └─────────────────┘                                │
│                                                                              │
│                    Something went wrong loading this section                 │
│                                                                              │
│            This error has been automatically reported to our team.           │
│                                                                              │
│                      [🔄 Try Again]  [🏠 Go Home]                            │
│                                                                              │
│                                                                              │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ [▼ Technical Details (for developers)]                                       │
│                                                                              │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ Error: Cannot read property 'map' of undefined                          │  │
│ │                                                                         │  │
│ │ Component Stack:                                                        │  │
│ │   at EmployeeList (src/components/HRMS/Employees/EmployeeList.jsx:45)  │  │
│ │   at EmployeeManagement (src/pages/Employees.jsx:12)                   │  │
│ │   at App (src/App.jsx:8)                                               │  │
│ │                                                                         │  │
│ │ Error ID: err_789xyz                                                    │  │
│ │ Timestamp: 2025-12-17T10:30:45.123Z                                    │  │
│ │                                                                         │  │
│ │ [Copy Error Details]                                                    │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Network Status Indicator

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ NETWORK STATUS BAR (When Offline)                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ ⚠️ You're offline. Changes will be saved when you reconnect.  [Dismiss] ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                              │
│ NETWORK STATUS BAR (When Reconnected)                                        │
│ ┌──────────────────────────────────────────────────────────────────────────┐│
│ │ ✓ You're back online. Syncing 3 pending changes...        [View Queue]  ││
│ └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.6 Loading & Error States

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ COMPONENT STATES                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ LOADING STATE:                                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │                                                                         │  │
│ │                    ◠ ◡ ◠ (spinner animation)                           │  │
│ │                                                                         │  │
│ │                      Loading employees...                              │  │
│ │                                                                         │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ ERROR STATE:                                                                 │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │                                                                         │  │
│ │                           ⚠️                                           │  │
│ │                                                                         │  │
│ │               Failed to load employees                                 │  │
│ │                                                                         │  │
│ │     Unable to connect to the server. Please check your                │  │
│ │     internet connection and try again.                                 │  │
│ │                                                                         │  │
│ │                    [🔄 Retry]  [📋 Copy Error]                         │  │
│ │                                                                         │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│ EMPTY STATE (After successful load with no data):                            │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │                                                                         │  │
│ │                           📭                                           │  │
│ │                                                                         │  │
│ │                    No employees found                                  │  │
│ │                                                                         │  │
│ │     Get started by adding your first employee.                        │  │
│ │                                                                         │  │
│ │                     [+ Add Employee]                                   │  │
│ │                                                                         │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.7 useEdgeFunction Hook Interface

```typescript
// Custom hook for Edge Function calls with error handling

interface UseEdgeFunctionOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ErrorResponse['error']) => void;
  retryCount?: number;
  retryDelay?: number;
  showErrorToast?: boolean;
}

interface UseEdgeFunctionReturn<T> {
  // State
  data: T | null;
  error: ErrorResponse['error'] | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  
  // Actions
  execute: (body?: any) => Promise<T | null>;
  retry: () => Promise<T | null>;
  reset: () => void;
  
  // Metadata
  requestId: string | null;
  timestamp: string | null;
  retryAttempt: number;
}

// Usage Example:
const { data, error, isLoading, execute, retry } = useEdgeFunction<Employee[]>(
  'get-employees',
  {
    onSuccess: (employees) => console.log('Loaded', employees.length, 'employees'),
    onError: (err) => console.error('Failed:', err.message),
    retryCount: 3,
    showErrorToast: true,
  }
);
```

---

## 🧪 4. Vitest Testing Requirements

### 4.1 Test File Structure

```
src/
├── __tests__/
│   ├── hooks/
│   │   ├── useEdgeFunction.test.ts
│   │   └── useErrorHandler.test.ts
│   ├── components/
│   │   ├── ErrorBoundary.test.tsx
│   │   ├── ErrorToast.test.tsx
│   │   └── FormValidation.test.tsx
│   ├── utils/
│   │   └── errorUtils.test.ts
│   └── integration/
│       └── errorFlow.test.ts
├── supabase/functions/
│   └── __tests__/
│       ├── errorHandlers.test.ts
│       └── validation.test.ts
```

### 4.2 Error Handler Tests Template

```typescript
// __tests__/utils/errorUtils.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  parseErrorResponse, 
  createErrorMessage, 
  isRetryableError,
  getErrorSeverity 
} from '@/utils/errorUtils';

describe('Error Utilities', () => {
  describe('parseErrorResponse', () => {
    it('should parse a standard error response', () => {
      const response = {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'ERR_VALIDATION',
          category: 'user_error',
          timestamp: '2025-12-17T10:30:45.123Z',
          requestId: 'req_abc123',
        }
      };

      const parsed = parseErrorResponse(response);
      
      expect(parsed.message).toBe('Validation failed');
      expect(parsed.code).toBe('ERR_VALIDATION');
      expect(parsed.isUserError).toBe(true);
    });

    it('should handle field-level validation errors', () => {
      const response = {
        success: false,
        error: {
          message: 'Validation failed for 2 fields',
          code: 'ERR_VALIDATION',
          category: 'user_error',
          timestamp: '2025-12-17T10:30:45.123Z',
          requestId: 'req_abc123',
          fields: [
            { field: 'email', message: 'Invalid format', code: 'INVALID_FORMAT' },
            { field: 'phone', message: 'Required', code: 'REQUIRED' },
          ]
        }
      };

      const parsed = parseErrorResponse(response);
      
      expect(parsed.fieldErrors).toHaveLength(2);
      expect(parsed.fieldErrors[0].field).toBe('email');
    });

    it('should handle malformed error responses', () => {
      const response = { invalid: 'response' };
      
      const parsed = parseErrorResponse(response);
      
      expect(parsed.message).toBe('An unexpected error occurred');
      expect(parsed.code).toBe('ERR_INTERNAL');
    });
  });

  describe('isRetryableError', () => {
    it.each([
      ['ERR_TIMEOUT', true],
      ['ERR_NETWORK', true],
      ['ERR_DATABASE', true],
      ['ERR_RATE_LIMIT', true],
      ['ERR_VALIDATION', false],
      ['ERR_AUTH', false],
      ['ERR_FORBIDDEN', false],
    ])('should return %s for error code %s', (code, expected) => {
      expect(isRetryableError(code)).toBe(expected);
    });
  });

  describe('getErrorSeverity', () => {
    it.each([
      ['ERR_VALIDATION', 'warning'],
      ['ERR_AUTH', 'error'],
      ['ERR_DATABASE', 'critical'],
      ['ERR_NETWORK', 'error'],
    ])('should return %s severity for %s', (code, expected) => {
      expect(getErrorSeverity(code)).toBe(expected);
    });
  });
});
```

### 4.3 Edge Function Tests Template

```typescript
// supabase/functions/__tests__/errorHandlers.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Deno environment
vi.stubGlobal('Deno', {
  env: {
    get: vi.fn((key: string) => {
      const env: Record<string, string> = {
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'test-key',
        ENVIRONMENT: 'development',
      };
      return env[key];
    }),
  },
});

describe('Edge Function Error Handlers', () => {
  describe('createErrorResponse', () => {
    it('should create error response with all required fields', () => {
      const response = createErrorResponse(
        'Test error',
        'ERR_VALIDATION',
        'user_error',
        400,
        'req_123'
      );

      const body = JSON.parse(response.body);
      
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Test error');
      expect(body.error.code).toBe('ERR_VALIDATION');
      expect(body.error.category).toBe('user_error');
      expect(body.error.requestId).toBe('req_123');
      expect(body.error.timestamp).toBeDefined();
      expect(response.status).toBe(400);
    });

    it('should include CORS headers in error responses', () => {
      const response = createErrorResponse(
        'Test error',
        'ERR_INTERNAL',
        'system_error',
        500,
        'req_123'
      );

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should include stack trace only in development', () => {
      const error = new Error('Test error');
      
      const devResponse = createErrorResponse(
        'Test error',
        'ERR_INTERNAL',
        'system_error',
        500,
        'req_123',
        { originalError: error }
      );
      
      const devBody = JSON.parse(devResponse.body);
      expect(devBody.error.stack).toBeDefined();
    });

    it('should include field errors for validation', () => {
      const response = createErrorResponse(
        'Validation failed',
        'ERR_VALIDATION',
        'user_error',
        400,
        'req_123',
        {
          fields: [
            { field: 'email', message: 'Invalid', code: 'INVALID_FORMAT' }
          ]
        }
      );

      const body = JSON.parse(response.body);
      expect(body.error.fields).toHaveLength(1);
      expect(body.error.fields[0].field).toBe('email');
    });
  });

  describe('HTTP Status Codes', () => {
    it.each([
      ['ERR_VALIDATION', 400],
      ['ERR_AUTH', 401],
      ['ERR_FORBIDDEN', 403],
      ['ERR_NOT_FOUND', 404],
      ['ERR_CONFLICT', 409],
      ['ERR_RATE_LIMIT', 429],
      ['ERR_INTERNAL', 500],
      ['ERR_NETWORK', 502],
      ['ERR_SERVICE_UNAVAILABLE', 503],
      ['ERR_TIMEOUT', 504],
    ])('should return status %i for error code %s', (code, expectedStatus) => {
      const response = createErrorResponse('Test', code, 'user_error', expectedStatus, 'req_123');
      expect(response.status).toBe(expectedStatus);
    });
  });
});
```

### 4.4 React Hook Tests Template

```typescript
// __tests__/hooks/useEdgeFunction.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useEdgeFunction } from '@/hooks/useEdgeFunction';

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useEdgeFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Successful Requests', () => {
    it('should handle successful response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 1, name: 'Test' } }),
      });

      const { result } = renderHook(() => useEdgeFunction('test-function'));

      await act(async () => {
        await result.current.execute({ name: 'Test' });
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual({ id: 1, name: 'Test' });
      expect(result.current.error).toBeNull();
    });

    it('should set loading state during request', async () => {
      mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const { result } = renderHook(() => useEdgeFunction('test-function'));

      act(() => {
        result.current.execute();
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'ERR_VALIDATION',
            category: 'user_error',
            timestamp: '2025-12-17T10:30:45.123Z',
            requestId: 'req_123',
            fields: [{ field: 'email', message: 'Invalid', code: 'INVALID_FORMAT' }],
          },
        }),
      });

      const { result } = renderHook(() => useEdgeFunction('test-function'));

      await act(async () => {
        await result.current.execute({ email: 'invalid' });
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.code).toBe('ERR_VALIDATION');
      expect(result.current.error?.fields).toHaveLength(1);
    });

    it('should handle network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useEdgeFunction('test-function'));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error?.code).toBe('ERR_NETWORK');
    });

    it('should handle authentication error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: {
            message: 'Authentication required',
            code: 'ERR_AUTH',
            category: 'user_error',
            timestamp: '2025-12-17T10:30:45.123Z',
            requestId: 'req_123',
          },
        }),
      });

      const { result } = renderHook(() => useEdgeFunction('test-function'));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error?.code).toBe('ERR_AUTH');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests with retryable errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            success: false,
            error: {
              message: 'Server error',
              code: 'ERR_INTERNAL',
              category: 'system_error',
              retryable: true,
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { id: 1 } }),
        });

      const { result } = renderHook(() => 
        useEdgeFunction('test-function', { retryCount: 2 })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.current.isSuccess).toBe(true);
    });

    it('should not retry non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'ERR_VALIDATION',
            category: 'user_error',
            retryable: false,
          },
        }),
      });

      const { result } = renderHook(() => 
        useEdgeFunction('test-function', { retryCount: 3 })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.current.isError).toBe(true);
    });

    it('should apply exponential backoff between retries', async () => {
      vi.useFakeTimers();
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { code: 'ERR_INTERNAL', retryable: true },
        }),
      });

      const { result } = renderHook(() => 
        useEdgeFunction('test-function', { retryCount: 3, retryDelay: 1000 })
      );

      act(() => {
        result.current.execute();
      });

      // First attempt
      await vi.advanceTimersByTimeAsync(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Wait for first retry (1000ms)
      await vi.advanceTimersByTimeAsync(1000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Wait for second retry (2000ms - exponential)
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockFetch).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });
  });

  describe('Callbacks', () => {
    it('should call onSuccess callback on success', async () => {
      const onSuccess = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 1 } }),
      });

      const { result } = renderHook(() => 
        useEdgeFunction('test-function', { onSuccess })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onSuccess).toHaveBeenCalledWith({ id: 1 });
    });

    it('should call onError callback on error', async () => {
      const onError = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { message: 'Failed', code: 'ERR_VALIDATION' },
        }),
      });

      const { result } = renderHook(() => 
        useEdgeFunction('test-function', { onError })
      );

      await act(async () => {
        await result.current.execute();
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'ERR_VALIDATION' })
      );
    });
  });
});
```

### 4.5 Error Boundary Tests Template

```typescript
// __tests__/components/ErrorBoundary.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should display error details in development', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText(/technical details/i));
    
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('should call error reporting service', () => {
    const reportError = vi.fn();
    
    render(
      <ErrorBoundary onError={reportError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(reportError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('should recover when clicking retry button', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // Rerender with non-throwing component
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
```

### 4.6 Test Coverage Requirements

| Category | Minimum Coverage | Target Coverage |
|----------|-----------------|-----------------|
| Edge Function Error Handlers | 90% | 95% |
| React Error Hooks | 90% | 95% |
| Error Boundary Component | 85% | 90% |
| Error Utility Functions | 95% | 100% |
| Validation Functions | 95% | 100% |
| Integration Tests | 80% | 90% |

---

## 🔧 5. Development vs Production

### 5.1 Environment-Based Error Verbosity

```typescript
// Error sanitization for production
const sanitizeError = (error: ErrorResponse['error'], env: string) => {
  if (env === 'production') {
    // Remove sensitive information
    const { stack, originalError, ...safeError } = error;
    
    // Sanitize details if contains sensitive patterns
    if (safeError.details) {
      safeError.details = safeError.details
        .replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]')
        .replace(/token[=:]\s*\S+/gi, 'token=[REDACTED]')
        .replace(/key[=:]\s*\S+/gi, 'key=[REDACTED]');
    }
    
    return safeError;
  }
  return error;
};
```

### 5.2 Feature Flags for Error Debugging

```typescript
// Feature flags for error handling
const ERROR_CONFIG = {
  // Show verbose errors in production (for debugging)
  SHOW_VERBOSE_ERRORS: process.env.VITE_SHOW_VERBOSE_ERRORS === 'true',
  
  // Enable error reporting to external service
  ENABLE_ERROR_REPORTING: process.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  
  // Show stack traces (dev only by default)
  SHOW_STACK_TRACES: process.env.NODE_ENV === 'development',
  
  // Log all errors to console
  LOG_ALL_ERRORS: process.env.NODE_ENV === 'development',
  
  // Retry configuration
  MAX_RETRY_ATTEMPTS: parseInt(process.env.VITE_MAX_RETRY_ATTEMPTS || '3'),
  RETRY_BASE_DELAY: parseInt(process.env.VITE_RETRY_BASE_DELAY || '1000'),
};
```

### 5.3 Error Logging Configuration

| Environment | Console Logging | External Reporting | Stack Traces | Original Errors |
|-------------|----------------|-------------------|--------------|-----------------|
| Development | Full details | Disabled | Yes | Yes |
| Staging | Full details | Enabled | Yes | Yes |
| Production | Errors only | Enabled | No | No |

---

## 📚 6. Error Code Reference

### 6.1 Complete Error Code Dictionary

| Code | HTTP | Message Template | User Action |
|------|------|-----------------|-------------|
| `ERR_VALIDATION` | 400 | "{field} is invalid" | Fix the highlighted field(s) |
| `ERR_PARSE` | 400 | "Invalid request format" | Check request syntax |
| `ERR_AUTH` | 401 | "Please sign in to continue" | Sign in again |
| `ERR_FORBIDDEN` | 403 | "Permission denied" | Contact administrator |
| `ERR_NOT_FOUND` | 404 | "{resource} not found" | Verify the {resource} exists |
| `ERR_CONFLICT` | 409 | "{resource} already exists" | Use different values |
| `ERR_RATE_LIMIT` | 429 | "Too many requests" | Wait and try again |
| `ERR_INTERNAL` | 500 | "Something went wrong" | Try again or contact support |
| `ERR_DATABASE` | 500 | "Database error" | Try again or contact support |
| `ERR_NETWORK` | 502 | "Connection failed" | Check internet connection |
| `ERR_TIMEOUT` | 504 | "Request timed out" | Try again |
| `ERR_SERVICE_UNAVAILABLE` | 503 | "Service unavailable" | Try again later |

### 6.2 Field Validation Error Codes

| Code | Description | Example Message |
|------|-------------|-----------------|
| `REQUIRED` | Field is required | "Email is required" |
| `INVALID_FORMAT` | Format is incorrect | "Invalid email format" |
| `MIN_LENGTH` | Below minimum length | "Must be at least 3 characters" |
| `MAX_LENGTH` | Exceeds maximum length | "Must be 255 characters or less" |
| `INVALID_DATE` | Invalid date value | "Date must be in the future" |
| `INVALID_RANGE` | Value out of range | "Must be between 0 and 100" |
| `DUPLICATE` | Value already exists | "This email is already registered" |
| `INVALID_REFERENCE` | Referenced item not found | "Selected department does not exist" |

---

## 🎯 7. Implementation Checklist

### Edge Functions
- [ ] All functions wrapped in try-catch
- [ ] CORS headers in all responses
- [ ] Request ID tracking implemented
- [ ] Specific error handlers for each type
- [ ] Validation errors include field details
- [ ] Database errors mapped to codes
- [ ] Rate limiting implemented
- [ ] Logging with full context

### React Frontend
- [ ] useEdgeFunction hook created
- [ ] Error boundaries at route level
- [ ] Toast notification system
- [ ] Inline form validation errors
- [ ] Network status indicator
- [ ] Retry logic with backoff
- [ ] Error context provider
- [ ] Loading/error/success states

### Testing
- [ ] 90%+ coverage on error paths
- [ ] All error codes tested
- [ ] Retry logic tested
- [ ] Error boundary tested
- [ ] Mock responses for all scenarios
- [ ] Integration tests for flows
- [ ] CORS headers verified
- [ ] HTTP status codes verified

---

**Document Version:** 1.0  
**Last Updated:** December 17, 2025  
**Author:** Development Team  
**Status:** Approved for Implementation
