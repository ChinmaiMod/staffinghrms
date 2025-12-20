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

### Email Configuration (Optional but Recommended)
These are used for sending emails via Resend API:

```env
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx
VITE_DEFAULT_FROM_EMAIL=noreply@yourdomain.com
VITE_DEFAULT_FROM_NAME=Staffing HRMS
```

**How to get Resend API key:**
1. Sign up at [Resend.com](https://resend.com)
2. Go to **API Keys** section
3. Create a new API key
4. Copy the key (starts with `re_`)

**Note:** If not provided, the app will use default values:
- `fromEmail`: `noreply@staffingcrm.com`
- `fromName`: `Staffing CRM`

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
| `VITE_RESEND_API_KEY` | ⚪ Optional | Resend API key for emails | `re_xxxxxxxxxxxxx` |
| `VITE_DEFAULT_FROM_EMAIL` | ⚪ Optional | Default sender email | `noreply@yourdomain.com` |
| `VITE_DEFAULT_FROM_NAME` | ⚪ Optional | Default sender name | `Staffing HRMS` |
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
- Check if `VITE_RESEND_API_KEY` is set correctly
- Verify the API key is active in Resend dashboard
- Check Supabase Edge Functions logs for email-related errors

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
