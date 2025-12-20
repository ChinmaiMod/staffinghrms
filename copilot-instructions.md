# GitHub Copilot Instructions for Staffing CRM

## Project Overview
Multi-tenant SaaS CRM built with React (Vite) + Supabase (PostgreSQL + Edge Functions) + Stripe billing. Supports FREE/CRM/SUITE tiers with RLS-based tenant isolation.

## Architecture Patterns
- **Frontend**: React SPA with context providers (`AuthProvider`, `TenantProvider`) for state management
- **Backend**: Supabase Edge Functions (Deno) handle business logic; direct DB queries for simple reads
- **Multi-tenancy**: All tables include `tenant_id`; RLS policies enforce isolation
- **Authentication**: Supabase Auth with email verification; JWT tokens passed to edge functions

## API Communication
- Use `callEdgeFunction()` from `src/api/edgeFunctions.js` for backend calls
- Include user JWT token: `callEdgeFunction('functionName', data, userToken)`
- Handle errors consistently: check `response.ok`, parse error body, throw descriptive messages
- Example: `const contacts = await listContacts(userToken)`

## Database Patterns
- **RLS Policies**: Every table has tenant-scoped policies; queries auto-filter by `auth.jwt() ->> 'sub'`
- **Audit Fields**: Include `created_at`, `updated_at`, `created_by`, `updated_by` on all entities
- **Reference Tables**: Use lookup tables (visa_statuses, job_titles, etc.) with foreign keys
- **Migrations**: Sequential SQL files in `supabase/migrations/`; apply with `supabase db push`

## Component Structure
- **Contexts**: `AuthProvider` manages user session; `TenantProvider` handles subscription/business context
- **Protected Routes**: Use `ProtectedRoute` component with role-based access
- **Forms**: Implement validation, loading states, error handling
- **CRM Module**: Located in `src/components/CRM/` with dashboard, contacts, data-admin sections

## Development Workflows
- **Local Setup**: `npm run dev` (Vite) + `supabase start` (local DB/functions)
- **Testing**: `npm run test` with Vitest + MSW for API mocking
- **Database**: `supabase db reset` to reset; `supabase db push` to apply migrations
- **Edge Functions**: `supabase functions deploy functionName` to deploy
- **Build**: `npm run build` (Vite) outputs to `dist/`

## Security & RBAC
- **Hierarchical Roles**: 5-level system (Read-only → CEO) with subordinate access
- **Business Scoping**: Leads/Managers scoped to specific businesses
- **Permission Checks**: Use `user_role_assignments` and `role_menu_permissions` tables
- **Super Admin**: Role level 5 has unrestricted access across tenants

## Environment Variables
- **Frontend**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FUNCTIONS_URL`
- **Edge Functions**: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, service role for admin operations
- **Local**: Use `.env.local` for development overrides

## Common Patterns
- **Error Handling**: Try/catch with user-friendly messages; log technical details
- **Loading States**: Use `useState` for loading flags; show spinners during async operations
- **Data Fetching**: React Query for caching; manual fetch for edge functions
- **File Uploads**: Supabase Storage buckets with tenant-scoped paths
- **Email Integration**: Resend API via edge functions for notifications/invites

## Deployment
- **Database**: Apply migrations first, then deploy edge functions
- **Frontend**: Vercel auto-deploys from main branch
- **Environment**: Set all `VITE_*` vars in Vercel; service keys in Supabase function secrets
- **Post-deploy**: Update webhook URLs, verify tenant isolation

## Key Files
- `src/api/edgeFunctions.js`: All backend API calls
- `src/contexts/AuthProvider.jsx`: Authentication state
- `supabase/migrations/`: Database schema evolution
- `src/components/CRM/`: CRM feature implementation
- `README.md`: Complete setup and deployment guide</content>
<parameter name="filePath">.github/copilot-instructions.md