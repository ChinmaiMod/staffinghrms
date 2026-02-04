# GitHub Copilot Instructions — Staffing HRMS

## Big picture
- React 19 + Vite SPA talking to Supabase (Postgres + Auth + Storage) plus Supabase Edge Functions (Deno) for server-side operations.
- Multi-tenancy is tenant-scoped in the DB (`tenant_id` + `business_id` columns + RLS); the frontend derives the current tenant from the logged-in user profile.
- Two React apps: main HRMS (`src/`) and employee self-service portal (`employee-portal/src/`).

## Where state comes from (read these first)
- Auth + profile: `src/contexts/AuthProvider.jsx` loads the Supabase session, then fetches `profiles` and caches `hrms::tenant_id` + `hrms::profile_cache` in `localStorage`.
- Tenant + subscription: `src/contexts/TenantProvider.jsx` loads `tenants`, `businesses`, and active `subscriptions`. Exposes `selectedBusiness` for business-scoped queries. Caches `hrms::tenant_data` + `hrms::tenant_subscription` + `hrms::selected_business`.
- RBAC/permissions: `src/contexts/PermissionsProvider.jsx` reads the `user_permissions` view for the current user and derives feature flags (e.g., client/job-order permissions).
- Route gating: `src/components/ProtectedRoute.jsx` enforces auth (and optional `requireRole`) with a 10s loading timeout.

## Frontend ↔ backend calling convention
- Preferred wrapper: `src/api/edgeFunctions.js` → `callEdgeFunction(functionName, data, userJwt?)`.
	- Uses `VITE_FUNCTIONS_URL` and sends `Authorization: Bearer <userJwt>` (or falls back to anon key).
	- Error contract: edge functions return `{ error: "..." }`; `callEdgeFunction` throws `Error(errorBody.error)`.
- CRM Contacts use a REST-ish edge function: `listContacts/getContact/createContact/...` fetch `${VITE_FUNCTIONS_URL}/crm_contacts[/id]`.
- Always include `tenantId` in payloads when calling edge functions that need tenant context (e.g., `sendBulkEmail`).

## Edge Functions (deployed to Supabase project `yvcsxadahzrxuptcgtkg`)
**20 active edge functions** managed via Supabase Dashboard (not local `supabase/functions/` folder):
- **Auth/Tenant:** `createTenantAndProfile`, `verifyToken`, `getPostLoginRoute`, `acceptInvitation`, `getInvitationDetails`
- **User Management:** `sendUserInvitation`, `resendUserInvitation`, `createInvite`, `adminResetPassword`, `requestPasswordReset`, `resendVerification`
- **Billing:** `createCheckoutSession`, `stripeWebhook`
- **Email:** `sendBulkEmail`, `sendFeedbackEmail`, `sendNewsletter`
- **Notifications:** `sendScheduledNotifications`, `scheduleNotificationCron`
- **AI:** `generateNewsletterContent`
- **Admin:** `updateTenantStatus`

Patterns:
- For admin operations use `SUPABASE_SERVICE_ROLE_KEY`
- For user-context operations forward `Authorization` header with `SUPABASE_ANON_KEY`

## External integrations you'll see
- Stripe billing: functions like `createCheckoutSession` + `stripeWebhook` (and UI in `src/components/Billing/`).
- Email: Resend for bulk email + tenant/business/domain-based sender config (see `supabase/functions/sendBulkEmail/index.ts` and shared resend config helpers).
- AI newsletter: OpenRouter (env `OPENROUTER_API_KEY`, optional) via `supabase/functions/generateNewsletterContent/index.ts`.

## Developer workflows (source of truth: `package.json`)
- Dev server: `npm run dev` (Vite on http://localhost:5173).
- Build: `npm run build` (uses `npx vite build`).
- Tests: `npm run test` (Vitest watch mode), `npm run test:ui` (Vitest UI), `npm run test:coverage` (coverage report).
- Lint: `npm run lint` (ESLint with zero warnings threshold).
- No local Supabase scripts in package.json—use `supabase start` and `supabase db push` directly if needed.

## Critical database patterns (multi-tenancy & HRMS-specific)
- **ALL tables** prefixed `hrms_*` MUST include `tenant_id UUID NOT NULL` + `business_id UUID` for multi-tenancy.
- **Migrations:** Sequential naming `YYYYMMDDNNNNNN_hrms_*.sql` in `supabase/migrations/`. 15 migrations define the schema.
- **Employee codes:** Auto-generated via `fn_generate_employee_code(business_id)` → format `<business_short_name><5-digit-seq>` (e.g., `IES00001`).
- **Ticket numbers:** Auto-generated via `fn_generate_ticket_number(business_id)` → format `<short_name>TKT<4-digit-seq>` (e.g., `IESTKT0042`).
- **Universal checklist system:** Never create new document tables. Use polymorphic `hrms_documents` with `entity_type`/`entity_id` (employee, project, timesheet, compliance). Admin-configurable via `hrms_checklist_types` mapping to any table. See [UNIVERSAL_CHECKLIST_ARCHITECTURE.md](../UNIVERSAL_CHECKLIST_ARCHITECTURE.md).
- **Project rates:** Never overwrite rates. Use `hrms_project_rate_history` with `effective_from_date`/`effective_to_date` + exclusion constraint. See [PROJECT_RATE_CHANGE_MANAGEMENT.md](../PROJECT_RATE_CHANGE_MANAGEMENT.md).
- **LCA compliance:** One active LCA project per visa holder. Adding another triggers amendment alert.
- **Vendor chains:** Up to 10 levels in `hrms_project_vendors` (`vendor_level` 1-10). Master data in `hrms_vendors`.
- Audit fields: `created_at`, `updated_at`, `created_by`, `updated_by` on all tables. Set `created_by`/`updated_by` from auth context (user ID).
- RLS policies: All tables enforce tenant isolation via `auth.jwt() ->> 'tenant_id'`.

## UI patterns & design system
- Component structure: `src/components/HRMS/[Feature]/` (18 feature folders: Employees, Projects, Tickets, Compliance, etc.).
- Config objects pattern: Define `EMPLOYEE_TYPES` and `STATUS_CONFIG` at top of list components for colors/labels:
  ```jsx
  const EMPLOYEE_TYPES = {
    internal_india: { label: 'Internal India', bg: '#EDE9FE', text: '#5B21B6', icon: '🇮🇳' },
    it_usa: { label: 'IT USA', bg: '#D1FAE5', text: '#065F46', icon: '💻' },
    // ...
  }
  const STATUS_CONFIG = {
    active: { label: 'Active', bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
    // ...
  }
  ```
- Design tokens in [UI_DESIGN_DOCS/00_DESIGN_SYSTEM.md](../UI_DESIGN_DOCS/00_DESIGN_SYSTEM.md).
- Search + filters pattern: Debounced search via `useDebounce` from `src/utils/debounce.js`, filter dropdowns, clear all button. See `EmployeeList.jsx` for reference.
- Icons: Use `@heroicons/react/24/outline` consistently. Import individual icons, not the entire package.
- Row selection: Checkbox for "select all" + individual row checkboxes → bulk actions.

## Testing & quality
- Test framework: Vitest + `@testing-library/react` + `jsdom`.
- Path aliases: `@/`, `@components/`, `@contexts/`, `@api/`, `@utils/`, `@styles/` (defined in `vitest.config.ts`).
- Test setup: `src/test/setup.js` configures testing-library and global mocks.
- Supabase mocking: Use chainable mock pattern in setup.js—mocks return `{ data, error }` and support `.eq().select()` chains.
- Coverage: `npm run test:coverage` generates HTML report.
- TDD guard: Uses `tdd-guard-vitest` reporter for test-driven development workflow.

## CRM integration bridge
- Shared tables: `tenants`, `businesses`, `profiles`, `countries`, `states`, `cities`, `job_titles`, `visa_statuses`.
- Contact→Employee conversion: `crm_hrms_contact_bridge` links CRM contacts to HRMS employees.
- Client data: HRMS references CRM `clients` table (single source of truth).
- Bridge docs: [STAFFING_CRM_TO_HRMS_BRIDGE_DOCUMENTATION.md](../STAFFING_CRM_TO_HRMS_BRIDGE_DOCUMENTATION.md).

## Key references (read when touching these areas)
- [HRMS_DATA_MODEL.md](../HRMS_DATA_MODEL.md) — Complete schema (36 tables), all relationships, RLS policies.
- [UNIVERSAL_CHECKLIST_ARCHITECTURE.md](../UNIVERSAL_CHECKLIST_ARCHITECTURE.md) — Why we use polymorphic documents, query patterns, admin config.
- [ADMIN_CONFIGURABLE_CHECKLIST_GUIDE.md](../ADMIN_CONFIGURABLE_CHECKLIST_GUIDE.md) — How to add new checklist types (zero code changes).
- [PROJECT_RATE_CHANGE_MANAGEMENT.md](../PROJECT_RATE_CHANGE_MANAGEMENT.md) — Temporal rate tracking, exclusion constraints, query examples.
- [UI_DESIGN_DOCS/00_DESIGN_SYSTEM.md](../UI_DESIGN_DOCS/00_DESIGN_SYSTEM.md) — Colors, typography, spacing, component specs.

## Employee Portal (`employee-portal/`)
Standalone self-service app for employees (separate from admin HRMS):
- Location: `employee-portal/src/components/`
- Currently implements: Tickets (`MyTickets.jsx`, `CreateTicketModal.jsx`)
- Uses same `STATUS_CONFIG` pattern as main HRMS for consistent styling
- **Not yet wired** to auth/tenant contexts—stubs exist for future integration
- Same design system tokens apply; shares Heroicons usage pattern
- Tests co-located: `*.test.jsx` alongside components

## Environment variables
Required in `.env` (Vite exposes via `import.meta.env`):
```bash
VITE_SUPABASE_URL=https://yvcsxadahzrxuptcgtkg.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_FUNCTIONS_URL=https://yvcsxadahzrxuptcgtkg.supabase.co/functions/v1
VITE_FRONTEND_URL=http://localhost:5173  # or production URL
# Optional:
VITE_RESEND_API_KEY=<resend-key>
VITE_DEFAULT_FROM_EMAIL=noreply@yourdomain.com
VITE_DEFAULT_FROM_NAME=Staffing HRMS
```
Test setup (`src/test/setup.js`) mocks `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Common pitfalls
- **Missing tenant_id/business_id:** All `hrms_*` table inserts MUST include both. RLS will silently filter rows without tenant_id match.
- **Overwriting rates:** Never update rates directly on `hrms_projects`. Insert new row in `hrms_project_rate_history` with effective dates.
- **Document tables:** Don't create specialized document tables. Use `hrms_documents` with `entity_type`/`entity_id`.
- **Edge function auth:** Always pass user JWT as third arg to `callEdgeFunction()` for user-context operations; anon key only for public endpoints.
- **LocalStorage keys:** Use `hrms::` prefix for all cached data (e.g., `hrms::tenant_id`, `hrms::profile_cache`).
- **Heroicons import:** Import individual icons, not `* from '@heroicons/react/24/outline'` to keep bundle size small.

## Performance patterns
- **Debounced search:** Use `useDebounce(value, 300)` from `src/utils/debounce.js` for search inputs.
- **Pagination:** Implement with Supabase `.range(from, to)` and track `page`/`pageSize` state.
- **Selective fetching:** Use `.select('id, name, ...')` instead of `*` when full row not needed.
- **Memoization:** Use `useMemo` for filtered/sorted lists derived from state.
- **Business-scoped queries:** Always filter by `selectedBusiness?.business_id` from TenantContext when applicable.
