# Vercel Environment Variables Configuration

This document lists all environment variables required for deploying the Staffing HRMS application to Vercel with Supabase.

## Required Environment Variables

### Supabase Configuration (Required)
These are **mandatory** for the application to work:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_FUNCTIONS_URL=https://your-project-id.supabase.co/functions/v1
```

**How to get these values:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** → use as `VITE_SUPABASE_URL`
4. Copy the **anon/public** key → use as `VITE_SUPABASE_ANON_KEY`
5. For `VITE_FUNCTIONS_URL`, it's typically: `https://your-project-id.supabase.co/functions/v1`

### Frontend URL (Recommended)
```env
VITE_FRONTEND_URL=https://your-app.vercel.app
```

**Note:** This should be your Vercel deployment URL. If not set, the app will use `window.location.origin` as a fallback, but it's recommended to set it explicitly for email links and redirects.

## Optional Environment Variables

### Email Configuration (System Defaults - Fallback Only)
**Important:** Resend API keys are stored in the Supabase database table `business_resend_api_keys` and retrieved dynamically based on the selected business/domain. These environment variables are only used as **fallback defaults** when no business-specific configuration exists.

```env
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx
VITE_DEFAULT_FROM_EMAIL=noreply@yourdomain.com
VITE_DEFAULT_FROM_NAME=Staffing HRMS
```

**How Resend API Keys Work:**
1. **Primary Source**: Resend API keys are stored in the `business_resend_api_keys` table in Supabase
2. **Dynamic Retrieval**: The application retrieves the appropriate API key based on:
   - `business_id` - The selected business
   - `tenant_id` - The current tenant
   - `is_active = true` - Only active configurations are used
3. **Fallback**: If no business-specific configuration exists, the app falls back to these environment variables
4. **System Emails**: Non-business emails (registration, password reset) always use the system defaults

**Database Table Structure (`business_resend_api_keys`):**
```sql
- config_id (UUID, Primary Key)
- tenant_id (UUID, References tenants)
- business_id (UUID, References businesses)
- resend_api_key (TEXT) - The Resend API key
- from_email (TEXT) - Sender email address
- from_name (TEXT, nullable) - Sender display name
- is_active (BOOLEAN) - Whether this configuration is active
- created_by (UUID, References auth.users)
- updated_by (UUID, References auth.users)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**How to Configure Business-Specific Resend API Keys:**
1. Log into the HRMS application
2. Navigate to **Data Administration** → **Resend API Keys**
3. Click **Add API Configuration**
4. Select the business
5. Enter the Resend API key (starts with `re_`)
6. Enter the verified sender email address
7. Enter the sender display name
8. Save the configuration

**How to get Resend API key:**
1. Sign up at [Resend.com](https://resend.com)
2. Go to **API Keys** section
3. Create a new API key
4. Copy the key (starts with `re_`)
5. Verify your domain in Resend dashboard
6. Configure it in the HRMS application for each business

**Note:** If environment variables are not provided, the app will use these hardcoded defaults:
- `fromEmail`: `noreply@staffingcrm.com`
- `fromName`: `Staffing CRM`
- `apiKey`: Empty string (emails will fail if no database config exists)

### OpenRouter API Key (Optional)
```env
VITE_OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

**Note:** This is mentioned in the README but is primarily used in Supabase Edge Functions, not directly in the frontend. If you're using AI features that require OpenRouter, make sure it's configured in your Supabase Edge Functions environment variables as well.

## How to Set Environment Variables in Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: The variable name (e.g., `VITE_SUPABASE_URL`)
   - **Value**: The actual value
   - **Environment**: Select where it applies:
     - **Production**: For production deployments
     - **Preview**: For preview deployments (pull requests)
     - **Development**: For local development (if using Vercel CLI)
4. Click **Save**

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Add environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_FUNCTIONS_URL production
vercel env add VITE_FRONTEND_URL production

# Optional variables
vercel env add VITE_RESEND_API_KEY production
vercel env add VITE_DEFAULT_FROM_EMAIL production
vercel env add VITE_DEFAULT_FROM_NAME production
```

## Environment Variable Summary Table

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_SUPABASE_URL` | ✅ Yes | Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_FUNCTIONS_URL` | ✅ Yes | Supabase Edge Functions URL | `https://abc123.supabase.co/functions/v1` |
| `VITE_FRONTEND_URL` | ⚠️ Recommended | Your Vercel app URL | `https://staffing-hrms.vercel.app` |
| `VITE_RESEND_API_KEY` | ⚪ Optional (Fallback) | System default Resend API key (used only if no business-specific config exists) | `re_xxxxxxxxxxxxx` |
| `VITE_DEFAULT_FROM_EMAIL` | ⚪ Optional (Fallback) | System default sender email (used only if no business-specific config exists) | `noreply@yourdomain.com` |
| `VITE_DEFAULT_FROM_NAME` | ⚪ Optional (Fallback) | System default sender name (used only if no business-specific config exists) | `Staffing HRMS` |
| `VITE_OPENROUTER_API_KEY` | ⚪ Optional | OpenRouter API key (for AI features) | `sk-or-v1-xxxxxxxxxxxxx` |

## Important Notes

1. **Vite Prefix**: All environment variables must be prefixed with `VITE_` to be accessible in the frontend code. This is a Vite requirement.

2. **After Adding Variables**: 
   - You need to **redeploy** your application for the changes to take effect
   - Go to **Deployments** → Click **⋯** on the latest deployment → **Redeploy**

3. **Security**: 
   - Never commit `.env` files to Git (they're in `.gitignore`)
   - The `VITE_` prefix means these variables are exposed to the client-side code
   - Only use public/anon keys in frontend variables
   - Keep service role keys and other secrets in Supabase Edge Functions only

4. **Supabase Edge Functions**: 
   - If you're using Edge Functions that need additional secrets (like `OPENROUTER_API_KEY`), set those in Supabase Dashboard:
     - Go to **Edge Functions** → **Settings** → **Secrets**
   - These are separate from Vercel environment variables

5. **Resend API Keys Storage**:
   - **Primary Storage**: Resend API keys are stored in the `business_resend_api_keys` table in Supabase
   - **Retrieval**: Keys are retrieved dynamically based on `business_id` and `tenant_id` when sending emails
   - **Environment Variables**: Only used as fallback defaults when no business-specific configuration exists
   - **Security**: API keys stored in the database are encrypted at rest by Supabase
   - **Management**: Configure business-specific keys through the HRMS UI (Data Administration → Resend API Keys)

## Verification

After setting up environment variables and deploying:

1. Check the build logs in Vercel to ensure no environment variable errors
2. Test the application:
   - Login functionality (requires Supabase)
   - Email sending (if Resend is configured)
   - Edge function calls (requires `VITE_FUNCTIONS_URL`)

## Troubleshooting

### "Missing Supabase environment variables" error
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Redeploy after adding variables

### Email not sending
- **Check business-specific configuration**: Verify that Resend API keys are configured in the database for the specific business
  - Navigate to **Data Administration** → **Resend API Keys** in the app
  - Ensure the business has an active configuration
  - Verify `is_active = true` in the `business_resend_api_keys` table
- **Check system defaults**: If no business-specific config exists, verify `VITE_RESEND_API_KEY` is set correctly
- **Verify API key**: Check that the Resend API key is active in Resend dashboard
- **Check domain verification**: Ensure the sender email domain is verified in Resend
- **Check Supabase Edge Functions logs**: Review Edge Functions logs for email-related errors
- **Query database**: Run this query to check configurations:
  ```sql
  SELECT business_id, resend_api_key, from_email, from_name, is_active 
  FROM business_resend_api_keys 
  WHERE tenant_id = 'your-tenant-id' AND is_active = true;
  ```

### Edge Functions not working
- Verify `VITE_FUNCTIONS_URL` matches your Supabase project URL
- Ensure Edge Functions are deployed in Supabase
- Check that the function names match what's called in the code

## Next Steps

1. ✅ Set all required environment variables in Vercel
2. ✅ Deploy your application (or redeploy if already deployed)
3. ✅ Test all functionality
4. ✅ Configure custom domain (optional)
5. ✅ Set up monitoring and error tracking (optional)
