const FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Helper to get frontend URL consistently
function getFrontendUrl() {
  if (typeof window !== 'undefined') {
    return import.meta.env.VITE_FRONTEND_URL || window.location.origin
  }
  return import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'
}

export async function callEdgeFunction(functionName, data, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY,
  }

  const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    // Try to parse the error response body
    const errorBody = await response.json().catch(() => null)
    
    // Extract the actual error message from the response
    if (errorBody && errorBody.error) {
      throw new Error(errorBody.error)
    }
    
    // Fallback to generic message
    const errorMessage = errorBody?.message || `Request failed with status ${response.status}`
    throw new Error(errorMessage)
  }

  return response.json()
}

export async function createTenantAndProfile(userId, email, username, companyName) {
  return callEdgeFunction('createTenantAndProfile', {
    userId,
    email,
    username,
    companyName,
  })
}

export async function resendVerification(email) {
  return callEdgeFunction('resendVerification', { 
    email,
    frontendUrl: getFrontendUrl()
  })
}

export async function verifyToken(token) {
  return callEdgeFunction('verifyToken', { token })
}

export async function requestPasswordReset(email, redirectTo = null) {
  const payload = { email }
  if (redirectTo) {
    payload.redirectTo = redirectTo
  }
  return callEdgeFunction('requestPasswordReset', payload)
}

export async function createCheckoutSession(priceId, tenantId, profileId, billingCycle, promoCode = null) {
  return callEdgeFunction('createCheckoutSession', {
    priceId,
    tenantId,
    profileId,
    billingCycle,
    promoCode,
    frontendUrl: getFrontendUrl()
  })
}

// Bulk Email Function
export async function sendBulkEmail(recipients, subject, body, token, tenantId = null) {
  return callEdgeFunction('sendBulkEmail', {
    recipients,
    subject,
    body,
    tenantId,  // Required for domain-based Resend config lookup
  }, token)
}

export async function applyPromoCode(code, planName, billingCycle) {
  return callEdgeFunction('applyPromoCode', {
    code,
    planName,
    billingCycle,
  })
}

export async function getPostLoginRoute(userId, token) {
  return callEdgeFunction('getPostLoginRoute', { userId }, token)
}

export async function createInvite(data, token) {
  // Ensure frontendUrl is included in the data
  const inviteData = {
    ...data,
    frontendUrl: getFrontendUrl()
  }
  return callEdgeFunction('createInvite', inviteData, token)
}

export async function acceptInvite(tokenValue, userId) {
  return callEdgeFunction('acceptInvite', { token: tokenValue, userId }, null)
}

export async function updateTenantStatus(data, token) {
  return callEdgeFunction('updateTenantStatus', data, token)
}

// CRM: contacts CRUD via crm_contacts edge function
export async function listContacts(token) {
  // GET / -> list is performed by calling the function URL directly
  const headers = {
    'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY,
  }
  const res = await fetch(`${FUNCTIONS_URL}/crm_contacts`, { headers })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    const errorMessage = errorBody?.error || errorBody?.message || 'Failed to list contacts'
    throw new Error(errorMessage)
  }
  return res.json()
}

export async function getContact(id, token) {
  const headers = { 'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY }
  const res = await fetch(`${FUNCTIONS_URL}/crm_contacts/${id}`, { headers })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    const errorMessage = errorBody?.error || errorBody?.message || 'Failed to get contact'
    throw new Error(errorMessage)
  }
  return res.json()
}

export async function createContact(data, token) {
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY }
  const res = await fetch(`${FUNCTIONS_URL}/crm_contacts`, { method: 'POST', headers, body: JSON.stringify(data) })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    const errorMessage = errorBody?.error || errorBody?.message || 'Failed to create contact'
    throw new Error(errorMessage)
  }
  return res.json()
}

export async function updateContact(id, data, token) {
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY }
  const res = await fetch(`${FUNCTIONS_URL}/crm_contacts/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    const errorMessage = errorBody?.error || errorBody?.message || 'Failed to update contact'
    throw new Error(errorMessage)
  }
  return res.json()
}

export async function deleteContact(id, token) {
  const headers = { 'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY }
  const res = await fetch(`${FUNCTIONS_URL}/crm_contacts/${id}`, { method: 'DELETE', headers })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    const errorMessage = errorBody?.error || errorBody?.message || 'Failed to delete contact'
    throw new Error(errorMessage)
  }
  return res.json()
}

// Newsletter functions
export async function generateNewsletterContent(content, promptText, tenantId, token, model = null) {
  return callEdgeFunction('generateNewsletterContent', {
    content,
    promptText,
    tenantId,
    model
  }, token)
}

// Default model list (used as fallback)
const DEFAULT_AI_MODELS = [
  { id: 'anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5', description: 'Latest Claude model' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', description: 'Most capable Claude model' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced Claude model' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Latest GPT-4 model' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Fast GPT-4 model' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and economical' }
]

// Fetch available models from OpenRouter API
export async function fetchOpenRouterModels() {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return DEFAULT_AI_MODELS
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch models from OpenRouter')
    }
    
    const data = await response.json()
    // Filter and sort models - prioritize Claude models, then GPT, then others
    const models = (data.data || []).map(model => ({
      id: model.id,
      name: model.name || model.id,
      description: model.description || '',
      pricing: model.pricing,
      context_length: model.context_length
    }))
    
    // Sort: Claude first, then GPT, then others
    models.sort((a, b) => {
      const aId = a.id.toLowerCase()
      const bId = b.id.toLowerCase()
      if (aId.includes('claude') && !bId.includes('claude')) return -1
      if (!aId.includes('claude') && bId.includes('claude')) return 1
      if (aId.includes('gpt') && !bId.includes('gpt')) return -1
      if (!aId.includes('gpt') && bId.includes('gpt')) return 1
      return a.name.localeCompare(b.name)
    })
    
    return models
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error)
    // Return default models if API fails
    return DEFAULT_AI_MODELS
  }
}

export async function sendNewsletter(data, token) {
  return callEdgeFunction('sendNewsletter', data, token)
}

// Email templates / notifications wrappers (use edge functions or direct DB functions later)
export async function listEmailTemplates(token) {
  const headers = { 'Authorization': `Bearer ${token || SUPABASE_ANON_KEY}`, 'apikey': SUPABASE_ANON_KEY }
  const res = await fetch(`${FUNCTIONS_URL}/email_templates`, { headers })
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null)
    const errorMessage = errorBody?.error || errorBody?.message || 'Failed to list email templates'
    throw new Error(errorMessage)
  }
  return res.json()
}

