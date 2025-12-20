# Supabase Resend API Keys Configuration

This document explains how Resend API keys are stored and retrieved from Supabase database.

## Database Table: `business_resend_api_keys`

### Table Schema

```sql
CREATE TABLE business_resend_api_keys (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  resend_api_key TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_business_resend_config UNIQUE (tenant_id, business_id)
);
```

### Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `config_id` | UUID | Primary key, auto-generated |
| `tenant_id` | UUID | References `tenants.tenant_id` |
| `business_id` | UUID | References `businesses.business_id` |
| `resend_api_key` | TEXT | The Resend API key (starts with `re_`) |
| `from_email` | TEXT | Verified sender email address |
| `from_name` | TEXT | Sender display name (nullable) |
| `is_active` | BOOLEAN | Whether this configuration is active |
| `created_by` | UUID | User who created the configuration |
| `updated_by` | UUID | User who last updated the configuration |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

## Querying Resend API Keys

### Get API Key for a Specific Business

```sql
SELECT 
  resend_api_key,
  from_email,
  from_name
FROM business_resend_api_keys
WHERE tenant_id = 'your-tenant-id'
  AND business_id = 'your-business-id'
  AND is_active = true
LIMIT 1;
```

### Get All Active Configurations for a Tenant

```sql
SELECT 
  br.config_id,
  br.business_id,
  b.business_name,
  br.resend_api_key,
  br.from_email,
  br.from_name,
  br.is_active,
  br.created_at,
  br.updated_at
FROM business_resend_api_keys br
JOIN businesses b ON br.business_id = b.business_id
WHERE br.tenant_id = 'your-tenant-id'
  AND br.is_active = true
ORDER BY br.created_at DESC;
```

### Get All Configurations (Including Inactive)

```sql
SELECT 
  br.*,
  b.business_name
FROM business_resend_api_keys br
LEFT JOIN businesses b ON br.business_id = b.business_id
WHERE br.tenant_id = 'your-tenant-id'
ORDER BY br.is_active DESC, br.created_at DESC;
```

## Application Code Retrieval

The application uses the `getResendConfig()` function in `src/api/resendConfig.js`:

```javascript
// Retrieves Resend config for a specific business
const config = await getResendConfig(businessId, tenantId);

// Returns:
// {
//   apiKey: 're_xxxxxxxxxxxxx',
//   fromEmail: 'noreply@businessdomain.com',
//   fromName: 'Business Name'
// }
```

### How It Works

1. **Business-Specific Lookup**: 
   - Queries `business_resend_api_keys` table
   - Filters by `tenant_id`, `business_id`, and `is_active = true`
   - Returns the matching configuration

2. **Fallback to System Defaults**:
   - If no business-specific config exists
   - Falls back to environment variables:
     - `VITE_RESEND_API_KEY`
     - `VITE_DEFAULT_FROM_EMAIL`
     - `VITE_DEFAULT_FROM_NAME`
   - If environment variables are not set, uses hardcoded defaults

3. **System Emails**:
   - Registration emails
   - Password reset emails
   - Other non-business emails
   - Always use system defaults (environment variables or hardcoded)

## Managing Resend API Keys

### Via HRMS UI (Recommended)

1. Log into the HRMS application
2. Navigate to **Data Administration** → **Resend API Keys**
3. View all existing configurations
4. Add new configuration:
   - Click **Add API Configuration**
   - Select business
   - Enter Resend API key
   - Enter verified sender email
   - Enter sender display name
   - Save

### Via Supabase SQL Editor

#### Insert New Configuration

```sql
INSERT INTO business_resend_api_keys (
  tenant_id,
  business_id,
  resend_api_key,
  from_email,
  from_name,
  is_active,
  created_by,
  updated_by
) VALUES (
  'tenant-uuid-here',
  'business-uuid-here',
  're_xxxxxxxxxxxxx',
  'noreply@yourdomain.com',
  'Your Business Name',
  true,
  'user-uuid-here',
  'user-uuid-here'
);
```

#### Update Existing Configuration

```sql
UPDATE business_resend_api_keys
SET 
  resend_api_key = 're_new_key_here',
  from_email = 'newemail@yourdomain.com',
  from_name = 'New Business Name',
  updated_by = 'user-uuid-here',
  updated_at = NOW()
WHERE config_id = 'config-uuid-here'
  AND tenant_id = 'tenant-uuid-here';
```

#### Deactivate Configuration

```sql
UPDATE business_resend_api_keys
SET 
  is_active = false,
  updated_by = 'user-uuid-here',
  updated_at = NOW()
WHERE config_id = 'config-uuid-here'
  AND tenant_id = 'tenant-uuid-here';
```

#### Delete Configuration

```sql
DELETE FROM business_resend_api_keys
WHERE config_id = 'config-uuid-here'
  AND tenant_id = 'tenant-uuid-here';
```

## Environment Variables vs Database Storage

### Environment Variables (Vercel)
- **Purpose**: System-wide fallback defaults
- **Scope**: Applies when no business-specific config exists
- **Use Cases**: 
  - System emails (registration, password reset)
  - Fallback for businesses without specific configuration
- **Set In**: Vercel Dashboard → Settings → Environment Variables

### Database Storage (Supabase)
- **Purpose**: Business-specific configurations
- **Scope**: Per business/domain
- **Use Cases**:
  - Business-specific email sending
  - Domain-based email configuration
  - Multi-tenant email management
- **Set In**: HRMS UI or Supabase SQL Editor

## Security Considerations

1. **API Key Storage**:
   - Keys are stored in Supabase database
   - Encrypted at rest by Supabase
   - Access controlled via Row Level Security (RLS) policies

2. **Access Control**:
   - Only authenticated users can view/manage configurations
   - RLS policies ensure users can only access their tenant's configurations
   - Admin users can manage configurations via UI

3. **Best Practices**:
   - Use different API keys for different businesses
   - Rotate API keys periodically
   - Deactivate unused configurations instead of deleting
   - Verify sender domains in Resend dashboard before use

## Troubleshooting

### No API Key Found for Business

**Check:**
```sql
SELECT * FROM business_resend_api_keys
WHERE tenant_id = 'your-tenant-id'
  AND business_id = 'your-business-id';
```

**Solution:**
- If no rows returned: Create a new configuration via UI or SQL
- If `is_active = false`: Activate the configuration
- If exists but not working: Verify the API key is valid in Resend dashboard

### Emails Using Wrong Sender

**Check:**
1. Verify business-specific configuration exists and is active
2. Check if the correct `business_id` is being passed to `getResendConfig()`
3. Verify the `from_email` domain is verified in Resend

**Solution:**
- Ensure business-specific config is active
- Verify domain in Resend dashboard
- Check application logs for which config is being used

### Fallback to System Defaults

**When this happens:**
- No business-specific configuration exists
- Configuration exists but `is_active = false`
- Error retrieving configuration from database

**Check:**
```sql
-- Check if any active config exists
SELECT COUNT(*) FROM business_resend_api_keys
WHERE tenant_id = 'your-tenant-id'
  AND business_id = 'your-business-id'
  AND is_active = true;
```

## Related Files

- **Frontend Code**: `src/api/resendConfig.js` - Retrieval logic
- **UI Component**: `src/components/HRMS/DataAdmin/ResendApiKeys/ResendApiKeysPage.jsx` - Management UI
- **Environment Config**: `VERCEL_ENV_VARIABLES.md` - Environment variables documentation
