# How to Retrieve Supabase Environment Variables for Vercel

This guide shows you exactly how to get the Supabase values needed for Vercel environment variables.

## Required Values

You need these three values from your Supabase project:

1. **VITE_SUPABASE_URL** - Your Supabase project URL
2. **VITE_SUPABASE_ANON_KEY** - Your Supabase anonymous/public key  
3. **VITE_FUNCTIONS_URL** - Your Supabase Edge Functions URL (derived from project URL)

## Step-by-Step Instructions

### Method 1: Via Supabase Dashboard (Recommended)

1. **Log into Supabase**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Sign in to your account

2. **Select Your Project**
   - Click on your project from the dashboard
   - If you don't have a project, create one first

3. **Navigate to API Settings**
   - Click on **Settings** (gear icon) in the left sidebar
   - Click on **API** in the settings menu

4. **Copy Project URL**
   - Find the **Project URL** section
   - Copy the URL (format: `https://xxxxxxxxxxxxx.supabase.co`)
   - This is your `VITE_SUPABASE_URL`

5. **Copy Anon/Public Key**
   - Find the **Project API keys** section
   - Look for the **anon** or **public** key
   - Click the **Copy** button next to it
   - This is your `VITE_SUPABASE_ANON_KEY`
   - ⚠️ **Important**: Use the **anon/public** key, NOT the **service_role** key

6. **Construct Functions URL**
   - Take your Project URL
   - Append `/functions/v1` to it
   - Example: If URL is `https://abc123.supabase.co`, Functions URL is `https://abc123.supabase.co/functions/v1`
   - This is your `VITE_FUNCTIONS_URL`

### Method 2: Via Supabase CLI

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Get project details
supabase status
```

The output will show your project URL and other details.

### Method 3: Check Existing Configuration

If you have the Supabase project reference ID, you can construct the URL:
- Format: `https://[PROJECT_REF].supabase.co`
- Example: If project ref is `abcdefghijklmnop`, URL is `https://abcdefghijklmnop.supabase.co`

## Example Values Format

Here's what your values should look like:

```env
# Example (DO NOT USE THESE - GET YOUR OWN VALUES)
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_FUNCTIONS_URL=https://abcdefghijklmnop.supabase.co/functions/v1
```

## Security Notes

⚠️ **Important Security Information:**

1. **Use Anon Key, Not Service Role Key**
   - The **anon/public** key is safe to expose in frontend code
   - The **service_role** key has admin privileges and should NEVER be exposed
   - Vercel environment variables with `VITE_` prefix are exposed to the client-side

2. **Key Characteristics**
   - Anon key: Starts with `eyJ...` (JWT format)
   - Service role key: Also starts with `eyJ...` but has different permissions
   - Always verify you're copying the **anon** key

3. **Where to Find Keys**
   - **Settings** → **API** → **Project API keys**
   - Look for the key labeled **anon** or **public**
   - The **service_role** key is below it - DO NOT use that one

## Quick Reference: What Goes Where

| Environment Variable | Value Source | Example |
|---------------------|--------------|---------|
| `VITE_SUPABASE_URL` | Settings → API → Project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Settings → API → anon/public key | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_FUNCTIONS_URL` | Project URL + `/functions/v1` | `https://abc123.supabase.co/functions/v1` |

## Setting in Vercel

Once you have these values:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Key: `VITE_SUPABASE_URL`
   - Value: Your project URL
   - Environment: Production, Preview, Development (select all)
5. Repeat for `VITE_SUPABASE_ANON_KEY` and `VITE_FUNCTIONS_URL`
6. Click **Save**
7. **Redeploy** your application for changes to take effect

## Verification

After setting the variables, verify they're working:

1. Check Vercel build logs - should not show "Missing Supabase environment variables" error
2. Test the application - login should work if Supabase is configured correctly
3. Check browser console - should not show Supabase connection errors

## Troubleshooting

### "Missing Supabase environment variables" error
- Verify all three variables are set in Vercel
- Check that variable names start with `VITE_`
- Ensure you've redeployed after adding variables

### Connection errors
- Verify the Project URL is correct (no trailing slash)
- Check that you're using the **anon** key, not service_role
- Verify your Supabase project is active and not paused

### Functions URL not working
- Ensure Edge Functions are deployed in Supabase
- Verify the URL format: `https://[project-ref].supabase.co/functions/v1`
- Check Supabase Edge Functions dashboard for deployment status

## Next Steps

After retrieving and setting these values:

1. ✅ Set all three variables in Vercel
2. ✅ Redeploy your application
3. ✅ Test the application functionality
4. ✅ Configure business-specific Resend API keys (if needed)
5. ✅ Set up other optional environment variables

## Related Documentation

- [VERCEL_ENV_VARIABLES.md](./VERCEL_ENV_VARIABLES.md) - Complete environment variables guide
- [SUPABASE_RESEND_API_KEYS.md](./SUPABASE_RESEND_API_KEYS.md) - Resend API keys configuration
