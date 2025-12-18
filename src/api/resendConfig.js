import { supabase } from './supabaseClient';

/**
 * Get Resend API configuration for a specific business
 * Falls back to system default if no business-specific config exists
 * 
 * @param {string} businessId - The business ID to get config for
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<{apiKey: string, fromEmail: string, fromName: string}>}
 */
export async function getResendConfig(businessId, tenantId) {
  try {
    // If no business ID provided, use system default
    if (!businessId || !tenantId) {
      return {
        apiKey: import.meta.env.VITE_RESEND_API_KEY || '',
        fromEmail: import.meta.env.VITE_DEFAULT_FROM_EMAIL || 'noreply@staffingcrm.com',
        fromName: import.meta.env.VITE_DEFAULT_FROM_NAME || 'Staffing CRM'
      };
    }

    // Query business-specific API key
    const { data, error } = await supabase
      .from('business_resend_api_keys')
      .select('resend_api_key, from_email, from_name')
      .eq('tenant_id', tenantId)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.log('No business-specific Resend config found, using system default');
      return {
        apiKey: import.meta.env.VITE_RESEND_API_KEY || '',
        fromEmail: import.meta.env.VITE_DEFAULT_FROM_EMAIL || 'noreply@staffingcrm.com',
        fromName: import.meta.env.VITE_DEFAULT_FROM_NAME || 'Staffing CRM'
      };
    }

    return {
      apiKey: data.resend_api_key,
      fromEmail: data.from_email,
      fromName: data.from_name || 'Staffing CRM'
    };
  } catch (err) {
    console.error('Error getting Resend config:', err);
    // Fall back to system default on error
    return {
      apiKey: import.meta.env.VITE_RESEND_API_KEY || '',
      fromEmail: import.meta.env.VITE_DEFAULT_FROM_EMAIL || 'noreply@staffingcrm.com',
      fromName: import.meta.env.VITE_DEFAULT_FROM_NAME || 'Staffing CRM'
    };
  }
}

/**
 * Get system default Resend configuration
 * Used for registration, password reset, and other non-business emails
 * 
 * @returns {{apiKey: string, fromEmail: string, fromName: string}}
 */
export function getSystemResendConfig() {
  return {
    apiKey: import.meta.env.VITE_RESEND_API_KEY || '',
    fromEmail: import.meta.env.VITE_DEFAULT_FROM_EMAIL || 'noreply@staffingcrm.com',
    fromName: import.meta.env.VITE_DEFAULT_FROM_NAME || 'Staffing CRM'
  };
}
