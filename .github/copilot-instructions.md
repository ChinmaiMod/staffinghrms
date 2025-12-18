# Copilot instructions (Staffing HRMS)

## Big picture
- Multi-tenant HRMS for staffing agencies, built with **React 18 + Vite** and **Supabase** (Postgres + RLS + Storage + Edge Functions).
- **Core architecture:** Universal checklist + polymorphic document storage. Never create new document tables—extend the checklist system instead. See [UNIVERSAL_CHECKLIST_ARCHITECTURE.md](../UNIVERSAL_CHECKLIST_ARCHITECTURE.md).
- **Five employee types** with distinct document requirements: `internal_india`, `internal_usa`, `it_usa`, `nonit_usa`, `healthcare_usa`. Employee type determines which checklist templates apply.

## Data model (critical patterns)
- All tables prefixed `hrms_` and include `tenant_id UUID NOT NULL` + often `business_id UUID`. RLS enforces tenant isolation via `auth.jwt() ->> 'tenant_id'`.
- Audit fields: `created_at`, `updated_at`, `created_by`, `updated_by`. Soft deletes via `deleted_at`/`is_active`.
- **Employee codes:** `<business_short_name><5-digit-seq>` (e.g., `IES00001`). Auto-generated via `fn_generate_employee_code(business_id)` using `hrms_employee_sequences`.
- Schema: [HRMS_DATA_MODEL.md](../HRMS_DATA_MODEL.md) (36 tables).

## Universal checklist system (don't break this)
- **Checklist types** (`hrms_checklist_types`) are admin-configurable and map to any table via `target_table_name` + `target_id_column`.
- **Documents** (`hrms_documents`) use polymorphic attachment: `entity_type` + `entity_id` (values: `employee`, `project`, `timesheet`, `compliance`, `custom`).
- **Adding new document workflows:**
  1. Add checklist type row (or use existing)
  2. Create template → groups → items
  3. Store uploads with correct `entity_type/entity_id/checklist_item_id`
- See [ADMIN_CONFIGURABLE_CHECKLIST_GUIDE.md](../ADMIN_CONFIGURABLE_CHECKLIST_GUIDE.md).

## Domain-specific rules
- **Project rates are temporal:** Use `hrms_project_rate_history` with `effective_from_date`/`effective_to_date` and exclusion constraint preventing overlaps. Never overwrite rates. See [PROJECT_RATE_CHANGE_MANAGEMENT.md](../PROJECT_RATE_CHANGE_MANAGEMENT.md).
- **LCA tracking:** Projects can flag `is_lca_project = true` for H1B/L1 compliance. Only one LCA project per employee allowed—adding another triggers amendment alert.
- **Vendor chains:** Up to 10 levels via `hrms_project_vendors` with `vendor_level` (1-10). Master vendor data in `hrms_vendors`.
- **Clients/Vendors:** CRM `clients` table is single source of truth. HRMS references via `client_id`. `hrms_vendors` syncs with Accounting.

## UI patterns
- Design system in [UI_DESIGN_DOCS/00_DESIGN_SYSTEM.md](../UI_DESIGN_DOCS/00_DESIGN_SYSTEM.md). Key colors: Primary `#3B82F6`, Success `#10B981`, Warning `#F59E0B`, Error `#EF4444`.
- Employee type colors: Internal India `#8B5CF6`, Internal USA `#3B82F6`, IT USA `#10B981`, Non-IT USA `#F97316`, Healthcare USA `#EC4899`.
- **Client Management UI:** HRMS provides interface to create/update CRM clients and contacts. Client contacts use `contact_type = 'Client Empanelment'`. See [UI_DESIGN_DOCS/16_CLIENT_MANAGEMENT.md](../UI_DESIGN_DOCS/16_CLIENT_MANAGEMENT.md).
- Admin RPCs for dynamic schema discovery: `get_table_list`, `get_column_list`, `execute_dynamic_query` (always parameterize).

## Integrations
- **CRM bridge:** `crm_hrms_contact_bridge` table + Edge Functions for contact→employee sync. CRM contact becomes employee when status = "Placed into Job". See [STAFFING_CRM_TO_HRMS_BRIDGE_DOCUMENTATION.md](../STAFFING_CRM_TO_HRMS_BRIDGE_DOCUMENTATION.md).
- **External services:** AI parsing (OpenRouter/Claude), Email (Resend), Billing (Stripe, shared with CRM), Hosting (Vercel).

## Dev workflow
- `npm install` → `npm run dev` → `npm test` / `npm run test:e2e`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OPENROUTER_API_KEY`, `VITE_FUNCTIONS_URL`
- Frontend: `src/components/HRMS/*`. Supabase: `supabase/functions/` and `supabase/migrations/`.
