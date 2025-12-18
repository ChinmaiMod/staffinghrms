# Authentication & Authorization Security - Standards (Supabase)

## 📋 Executive Summary

This document defines **production-ready Authentication & Authorization security standards** for Staffing HRMS (React 18 + Vite + Supabase Auth + Postgres RLS + Edge Functions). It focuses on:
- Secure session handling and account protections
- Authorization (RBAC + tenant isolation) enforced server-side
- Admin hardening and safe redirect handling

**Scope:** Authentication & Authorization only (no general network, infra, or app security beyond what is required to enforce Auth/AuthZ).

---

## 1. Core Principles (Non-Negotiable)

1. **Never trust the client for identity or authorization.**
   - Edge Functions derive identity from `Authorization: Bearer <jwt>`.
   - Postgres RLS enforces tenant isolation on every table.

2. **No tenant_id or user_id from client is trusted.**
   - Tenant context comes from JWT claim: `auth.jwt() ->> 'tenant_id'`.

3. **Authorization is enforced in 3 layers:**
   - **UI (UX gating):** hide/disable restricted navigation and actions.
   - **Edge Functions (server enforcement):** validate permissions for sensitive operations.
   - **Database (RLS):** always-on isolation and row ownership/tenant checks.

---

## 2. Session & Token Handling

### 2.1 Preferred Production Pattern: Cookie-Based Session (httpOnly)

**Goal:** No long-lived auth tokens accessible to JavaScript.

**Recommendation:** Use a **BFF (Backend-for-Frontend)** on the *same origin as the web app* to:
- Handle Supabase auth token exchange and refresh.
- Store session in **`httpOnly`, `Secure`, `SameSite=Lax`** cookies.

**Important constraint:** A pure SPA cannot set `httpOnly` cookies from JavaScript. If HRMS is deployed as SPA-only, use the fallback mode below.

### 2.2 Fallback Mode (SPA-only): Minimize Token Exposure

If running as a pure Vite SPA without a same-origin backend:
- **Do not store access tokens in `localStorage`.**
- Prefer **in-memory** session storage.
- If persistence is required, document and review the tradeoff (risk acceptance) and apply compensating controls:
  - Short session TTL
  - Mandatory 2FA for privileged users
  - Aggressive inactivity logout
  - Re-auth for sensitive actions

### 2.3 Refresh Rotation
- Refresh token rotation must be enabled (Supabase default behavior) and handled securely.
- If refresh token theft is suspected, require user to **re-authenticate** and revoke sessions.

---

## 3. Authentication Requirements

### 3.1 Password Policy
- Minimum length: **12 characters**.
- Require a mix of at least **3 of 4**:
  - uppercase
  - lowercase
  - number
  - symbol
- Disallow commonly breached passwords (use a denylist / breached password check if available).

### 3.2 Multi-Factor Authentication (MFA/2FA)
- Support MFA enrollment via the **Settings → Security** UI.
- **Admins must have MFA enabled** to access `/hrms/admin/*`.

### 3.3 Failed Login Protection / Lockout
- After repeated failed attempts, enforce **progressive backoff** and/or temporary lockout.
- Record failed attempts in login history.
- Avoid revealing whether an account exists (generic failure messages).

### 3.4 Logout
- Logout must:
  - clear client state
  - revoke the current session (and optionally all sessions via “Sign out all other devices”)
  - prevent reuse of tokens

---

## 4. Inactivity Timeout & Re-Authentication

### 4.1 Inactivity Timeout
- Enforce auto sign-out after **15–30 minutes** of inactivity (configurable).
- Reset the timer on user activity (mouse/keyboard/navigation/API activity).

### 4.2 Re-authentication for Sensitive Actions
Require a “recent authentication” check before:
- changing password
- changing MFA settings
- viewing/exporting sensitive data (PII)
- managing users/roles/access control
- editing email provider keys / integration secrets

Implementation guidance:
- Prefer server-side enforcement (Edge Function) using a “recent auth” threshold.
- UI prompts for password/MFA confirmation are allowed as part of existing Settings/Admin flows.

---

## 5. Authorization (RBAC + Tenant Isolation)

### 5.1 Tenant Isolation (RLS)
- Every `hrms_*` table includes `tenant_id UUID NOT NULL`.
- RLS policy baseline:
  - `USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)`
  - `WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)`

### 5.2 RBAC
- RBAC determines:
  - which sidebar items are visible
  - which pages/actions are accessible
  - which API routes/Edge Functions can be invoked

**Rule:** UI visibility is not authorization.

### 5.3 Admin Route Protection
- `/hrms/admin/*` requires:
  - admin role/permission
  - MFA enabled
  - recent authentication for sensitive admin operations

---

## 6. Edge Function AuthN/AuthZ Standards

For every protected Edge Function:
- Require `Authorization: Bearer <jwt>`.
- Validate JWT via Supabase Auth (`getUser`) before doing anything.
- Do not accept `user_id`, `tenant_id`, or role flags from request body.
- Apply permission checks server-side for admin/sensitive operations.
- Log security-relevant events (access denied, role changes, session revocations) without leaking secrets.

---

## 7. Safe Redirect Handling (Open Redirect Prevention)

When accepting a `returnTo`/`redirect` parameter:
- Allow only **same-origin relative paths** that start with `/`.
- Reject/ignore:
  - absolute URLs (`https://...`)
  - protocol-relative URLs (`//...`)
  - javascript/data URLs
- If invalid, fall back to a safe default (e.g., dashboard).

---

## 8. Documentation Links

- Error format and handling: see [UI_DESIGN_DOCS/18_ERROR_HANDLING_STANDARDS.md](18_ERROR_HANDLING_STANDARDS.md)
