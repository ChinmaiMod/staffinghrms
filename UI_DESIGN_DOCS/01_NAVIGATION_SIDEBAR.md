# Navigation & Sidebar - UI Design Specification

## 📋 Executive Summary

The navigation system provides the primary means of moving through the HRMS application. It consists of a fixed top header and a collapsible left sidebar menu, designed to maximize screen real estate while maintaining easy access to all features.

---

## 🗂️ 1. Information Architecture

### Complete Menu Structure

```
HRMS Application
│
├── 📊 Dashboard                    [/hrms/dashboard]
│
├── ⚠️ Compliance Dashboard         [/hrms/compliance]
│   ├── Overview                    [/hrms/compliance]
│   ├── Pending Items               [/hrms/compliance?status=pending]
│   ├── Overdue Items               [/hrms/compliance?status=overdue]
│   └── Calendar View               [/hrms/compliance/calendar]
│
├── 🎫 Employee Tickets             [/hrms/tickets]
│   ├── All Tickets                 [/hrms/tickets]
│   ├── HR Tickets                  [/hrms/tickets?team=hr]
│   └── Immigration Tickets         [/hrms/tickets?team=immigration]
│
├── 👥 Employee Management          [/hrms/employees]
│   ├── All Employees               [/hrms/employees]
│   ├── Add New Employee            [/hrms/employees/new]
│   └── Employee Types              [/hrms/employees?type=filter]
│       ├── Internal India
│       ├── Internal USA
│       ├── IT USA
│       └── Healthcare USA
│
├── 🏢 Client Management            [/hrms/clients]
│   ├── All Clients                 [/hrms/clients]
│   ├── Add New Client              [/hrms/clients/new]
│   └── Client Contacts             [/hrms/clients?view=contacts]
│
├── 🏭 Vendor Management            [/hrms/vendors]
│   ├── All Vendors                 [/hrms/vendors]
│   ├── Add New Vendor              [/hrms/vendors/new]
│   └── Vendor Contacts             [/hrms/vendors?view=contacts]
│
├── 💼 Employee Projects            [/hrms/projects]
│   ├── All Projects                [/hrms/projects]
│   ├── Active Projects             [/hrms/projects?status=active]
│   └── LCA Projects                [/hrms/projects?lca=true]
│
├── 📄 Document Management          [/hrms/documents]
│   ├── All Documents               [/hrms/documents]
│   ├── By Employee                 [/hrms/documents?view=employee]
│   ├── By Project                  [/hrms/documents?view=project]
│   └── Expiring Soon               [/hrms/documents?filter=expiring]
│
├── 🛂 Visa & Immigration           [/hrms/immigration]
│   ├── Overview                    [/hrms/immigration]
│   ├── H1B Employees               [/hrms/immigration?visa=h1b]
│   ├── GC Processing               [/hrms/immigration?status=gc]
│   └── Expiring Visas              [/hrms/immigration?filter=expiring]
│
├── ⏱️ Timesheet Management         [/hrms/timesheets]
│   ├── All Timesheets              [/hrms/timesheets]
│   ├── Pending Approval            [/hrms/timesheets?status=pending]
│   └── Submit Timesheet            [/hrms/timesheets/new]
│
├── ⚙️ Data Administration          [/hrms/admin]
│   ├── Checklist Type Management   [/hrms/admin/checklist-types]
│   ├── Checklist Templates         [/hrms/admin/checklist-templates]
│   ├── Email Templates             [/hrms/admin/email-templates]
│   ├── AI Prompts (Newsletter)     [/hrms/admin/ai-prompts]
│   ├── ─────────────────────       (Separator)
│   ├── Businesses                  [/hrms/admin/businesses]        (CRM Linked)
│   ├── Countries                   [/hrms/admin/countries]         (CRM Linked)
│   ├── States                      [/hrms/admin/states]            (CRM Linked)
│   ├── Cities                      [/hrms/admin/cities]            (CRM Linked)
│   ├── IT Job Titles               [/hrms/admin/job-titles]        (CRM Linked)
│   ├── LCA Job Titles              [/hrms/admin/lca-job-titles]    (HRMS Only)
│   ├── Visa Status                 [/hrms/admin/visa-status]       (CRM Linked)
│   ├── ─────────────────────       (Separator)
│   ├── Resend API Keys             [/hrms/admin/resend-api-keys]   (CRM Linked)
│   ├── Invite Users                [/hrms/admin/invite-users]      (CRM Linked)
│   ├── User Role Assignments       [/hrms/admin/user-roles]        (CRM Linked)
│   ├── Access Control              [/hrms/admin/access-control]    (CRM Linked)
│   └── System Settings             [/hrms/admin/settings]
│
├── 🔔 Notifications                [/hrms/notifications]
│
├── 📰 Newsletter                   [/hrms/newsletter]
│   ├── All Newsletters             [/hrms/newsletter]
│   ├── Create Newsletter           [/hrms/newsletter/new]
│   ├── AI Generate Newsletter      [/hrms/newsletter/ai-generate]
│   └── Drafts                      [/hrms/newsletter?status=draft]
│
├── 💡 Suggestions & Ideas          [/hrms/suggestions]
│
├── 🐛 Report an Issue              [/hrms/issues]
│
└── 👤 Profile & Settings           [/hrms/profile]
    ├── My Profile                  [/hrms/profile]
    ├── Change Password             [/hrms/profile/password]
    └── Preferences                 [/hrms/profile/preferences]
```

### Access Control & Protected Routes

- All routes under `/hrms/*` require an authenticated session.
- Role/permission-based navigation:
  - Sidebar items must be shown/hidden based on RBAC permissions.
  - **Direct URL access must still be blocked** if the user lacks permission (UI hiding is not authorization).
- Admin routes:
  - `/hrms/admin/*` is restricted to admin users and requires MFA enabled.
  - Sensitive admin operations require “recent authentication” (see [UI_DESIGN_DOCS/19_AUTHENTICATION_AUTHORIZATION_SECURITY.md](19_AUTHENTICATION_AUTHORIZATION_SECURITY.md)).
- Safe redirects:
  - Any `returnTo`/`redirect` parameter must be validated as a same-origin relative path to prevent open redirects.

---

## 🖼️ 2. Header Component

### Layout Specification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ☰ │ 📊 HRMS │ Dashboard > Employee    🔍   [🏢 Intuites LLC ▼] 🔔(3) 👤 Admin▼│
└─────────────────────────────────────────────────────────────────────────────┘
 ↑     ↑         ↑                       ↑           ↑            ↑       ↑
 │     │         │                       │           │            │       │
 │     │         └── Breadcrumb          │           │            │       │
 │     └── App Logo/Title                │           │            │       │
 └── Sidebar Toggle                      │           │            │       │
                                         │           │            │       │
                              Global Search ─────────┘            │       │
                              Business Selector ──────────────────┘       │
                              Notifications ──────────────────────────────┘
                              User Menu ──────────────────────────────────┘
```

### Header Specifications

| Property | Value |
|----------|-------|
| **Height** | 64px |
| **Position** | Fixed, top |
| **Background** | `#FFFFFF` |
| **Border Bottom** | 1px solid `#E5E7EB` |
| **Shadow** | `shadow-sm` |
| **Z-Index** | 1000 |
| **Padding** | 0 24px |

### Header Elements

#### Sidebar Toggle Button (Left)
```
Position: Left edge
Size: 40×40px
Icon: bars-3 (hamburger), 24px
Color: #374151
Hover Background: #F3F4F6
Border Radius: 6px
Margin Right: 16px
```

#### Logo/App Title
```
Logo Image: 32×32px
App Name: "HRMS"
Font: 20px, 600 weight, #374151
Letter Spacing: -0.01em
Gap between logo and text: 8px
```

#### Breadcrumb
```
Font: 14px, 400 weight
Color: #6B7280
Separator: ">" character, #9CA3AF
Current Page: #374151, 500 weight
Max Items: 3 (collapse middle if more)
Margin Left: 24px

Sample: Dashboard > Employee Management > John Doe
```

#### Global Search
```
Width: 320px
Height: 40px
Background: #F3F4F6
Border: 1px solid #E5E7EB
Border Radius: 8px
Icon: magnifying-glass, 20px, #9CA3AF
Placeholder: "Search employees, projects..." (#9CA3AF)
Focus: Border #3B82F6, Background #FFFFFF

Keyboard Shortcut: Cmd+K (Mac) / Ctrl+K (Windows)
Displays: ⌘K badge on right side
```

#### Business Selector (Global Filter)
```
Position: Right side, before notifications
Minimum Width: 180px
Maximum Width: 250px
Height: 40px
Background: #FFFFFF
Border: 1px solid #E5E7EB
Border Radius: 8px
Padding: 8px 12px

Icon: building-office, 20px, #6B7280
Text: 14px, 500 weight, #374151
Chevron: chevron-down, 16px, #6B7280

Hover: Border #3B82F6, Background #F9FAFB
Focus: Border #3B82F6, Ring 2px #DBEAFE

Dropdown:
  Width: 280px
  Max Height: 320px (scrollable)
  Shadow: shadow-lg
  Border Radius: 8px
  Margin Top: 4px

Data Source: businesses table
Filter Effect: All data on current page filtered by selected business
Persistence: Stored in localStorage/session, remembered across navigation
Default: "All Businesses" option (if user has multi-business access)
```

**Business Selector Dropdown:**
```
┌─────────────────────────────────────┐
│ 🔍 Search businesses...             │
├─────────────────────────────────────┤
│ 🏢 All Businesses                   │
├─────────────────────────────────────┤
│ ✓ Intuites LLC (IES)                │
│   Staffing Pro (SPR)                │
│   TechStaff Inc (TSI)               │
│   Healthcare Plus (HCP)             │
└─────────────────────────────────────┘

Dropdown Item:
  Padding: 10px 16px
  Hover Background: #F3F4F6
  Selected Background: #EFF6FF
  Selected Text: #3B82F6, 500 weight
  Checkmark: check icon, 16px, #3B82F6
  Business Code: 12px, #6B7280 (shown in parentheses)
```

#### Notification Bell
```
Size: 40×40px
Icon: bell, 24px, #374151
Badge (if notifications):
  Position: Top-right
  Size: 18px circle
  Background: #EF4444
  Text: #FFFFFF, 11px, 600 weight
  Max Display: "9+"

Hover: Background #F3F4F6
Dropdown on click (see Notification Panel spec)
```

#### User Menu
```
Trigger:
  Avatar: 32×32px, rounded-full
  Name: 14px, 500 weight, #374151
  Chevron: chevron-down, 16px, #6B7280
  Gap: 8px
  Padding: 8px 12px
  Hover Background: #F3F4F6
  Border Radius: 8px

Dropdown Menu:
  Width: 240px
  Shadow: shadow-lg
  Border Radius: 8px
  Margin Top: 8px
```

### User Dropdown Menu Items

```
┌─────────────────────────────────┐
│ 👤 John Smith                   │
│    admin@company.com            │
│    Role: HRMS Admin             │
├─────────────────────────────────┤
│ 👤 My Profile                   │
│ ⚙️ Account Settings             │
│ 🏢 Switch Business              │
├─────────────────────────────────┤
│ 📄 Documentation                │
│ ❓ Help & Support               │
├─────────────────────────────────┤
│ 🚪 Sign Out                     │
└─────────────────────────────────┘
```

| Menu Item | Icon | Action | Color |
|-----------|------|--------|-------|
| User Info Section | - | Display only | #374151 (name), #6B7280 (email/role) |
| My Profile | `user` | Navigate to profile | #374151 |
| Account Settings | `cog-6-tooth` | Navigate to settings | #374151 |
| Switch Business | `building-office` | Open business selector modal | #374151 |
| Documentation | `document-text` | Open docs (external) | #374151 |
| Help & Support | `question-mark-circle` | Open help center | #374151 |
| Sign Out | `arrow-right-on-rectangle` | Logout action | #EF4444 |

---

## 🏢 3. Business Selector Component (Global Data Filter)

### Overview

The Business Selector is a **global data filter** that appears in the header and controls which business's data is displayed across all applicable pages. This is essential for multi-tenant organizations with multiple business entities.

### Data Source

```sql
-- Query to populate business selector dropdown
SELECT 
  business_id,
  business_name,
  short_name,
  is_active
FROM businesses 
WHERE tenant_id = :current_tenant_id
  AND is_active = true
ORDER BY business_name ASC;
```

### Affected Pages

The following pages filter data based on the selected business:

| Page | Filter Behavior |
|------|-----------------|
| **HRMS Dashboard** | All stats, charts, and lists show data for selected business |
| **Employee Management** | Employee list filtered by `business_id` |
| **Employee Projects** | Projects filtered by employee's `business_id` |
| **Compliance Dashboard** | Compliance items filtered by `business_id` |
| **Timesheet Management** | Timesheets filtered by employee's `business_id` |
| **Document Management** | Documents filtered by entity's `business_id` |
| **Data Administration** | Templates filtered by `business_id` (or show all if null) |
| **Visa & Immigration** | Employees filtered by `business_id` |
| **Newsletter** | Recipients filtered by `business_id` |
| **Employee Tickets** | Tickets filtered by employee's `business_id` |

### Pages NOT Affected

| Page | Reason |
|------|--------|
| **Settings & Profile** | User-specific, not business-specific |
| **Notifications** | User-specific notifications |
| **Suggestions & Ideas** | System-wide or user-specific |
| **Report an Issue** | System-wide issues |

### Behavior Specifications

#### Selection Persistence
```javascript
// Business selection stored in localStorage
localStorage.setItem('selectedBusinessId', businessId);

// Also stored in React context for real-time access
const { selectedBusiness, setSelectedBusiness } = useBusinessContext();

// URL parameter support (optional)
/hrms/employees?business_id=uuid-here
```

#### All Businesses Option
```
When "All Businesses" is selected:
- Shows aggregated data across all accessible businesses
- Employee counts, compliance totals, etc. are summed
- List views show data from all businesses with business indicator
- Charts show combined data or breakdown by business

Availability:
- Only shown if user has access to multiple businesses
- Hidden for single-business users (auto-selected)
```

#### API Integration
```javascript
// All API calls include business_id filter
const fetchEmployees = async () => {
  const { selectedBusinessId } = useBusinessContext();
  
  let query = supabase
    .from('hrms_employees')
    .select('*')
    .eq('tenant_id', tenantId);
  
  // Apply business filter if specific business selected
  if (selectedBusinessId && selectedBusinessId !== 'all') {
    query = query.eq('business_id', selectedBusinessId);
  }
  
  return query;
};
```

### Visual States

#### Default State (Collapsed)
```
┌────────────────────────────────────┐
│ 🏢 Intuites LLC                 ▼ │
└────────────────────────────────────┘

Background: #FFFFFF
Border: 1px solid #E5E7EB
Border Radius: 8px
Text: #374151, 14px, 500 weight
Icon Color: #6B7280
```

#### Hover State
```
┌────────────────────────────────────┐
│ 🏢 Intuites LLC                 ▼ │
└────────────────────────────────────┘

Background: #F9FAFB
Border: 1px solid #3B82F6
Cursor: pointer
```

#### Open State (Dropdown Visible)
```
┌────────────────────────────────────┐
│ 🏢 Intuites LLC                 ▲ │
├────────────────────────────────────┤
│ 🔍 Search businesses...            │
├────────────────────────────────────┤
│ 🏢 All Businesses                  │
├────────────────────────────────────┤
│ ✓ Intuites LLC (IES)               │
│   Staffing Pro (SPR)               │
│   TechStaff Inc (TSI)              │
│   Healthcare Plus (HCP)            │
└────────────────────────────────────┘

Selected Item:
  Background: #EFF6FF
  Text: #3B82F6
  Checkmark: visible
```

### Sample Data

| Business Name | Short Name | Business ID |
|---------------|------------|-------------|
| Intuites LLC | IES | `550e8400-e29b-41d4-a716-446655440001` |
| Staffing Pro | SPR | `550e8400-e29b-41d4-a716-446655440002` |
| TechStaff Inc | TSI | `550e8400-e29b-41d4-a716-446655440003` |
| Healthcare Plus | HCP | `550e8400-e29b-41d4-a716-446655440004` |

### Accessibility

```html
<div role="combobox" aria-haspopup="listbox" aria-expanded="false">
  <button 
    aria-label="Select business: Intuites LLC"
    aria-controls="business-dropdown"
  >
    <span>🏢 Intuites LLC</span>
    <span aria-hidden="true">▼</span>
  </button>
</div>

<ul id="business-dropdown" role="listbox" aria-label="Available businesses">
  <li role="option" aria-selected="false">All Businesses</li>
  <li role="option" aria-selected="true">Intuites LLC (IES)</li>
  <li role="option" aria-selected="false">Staffing Pro (SPR)</li>
</ul>
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open/close dropdown |
| `Arrow Down` | Move to next option |
| `Arrow Up` | Move to previous option |
| `Enter` | Select highlighted option |
| `Escape` | Close dropdown |
| `Tab` | Close dropdown, move focus |
| Type characters | Filter businesses by name |

---

## 📚 4. Sidebar Component

### Sidebar States

#### Expanded State (Default on Desktop)
```
Width: 256px
Background: #FFFFFF
Border Right: 1px solid #E5E7EB
Position: Fixed, left
Top: 64px (below header)
Height: calc(100vh - 64px)
Overflow Y: auto (with custom scrollbar)
Z-Index: 900
```

#### Collapsed State
```
Width: 64px
Icons only (no text)
Tooltips on hover showing menu item name
```

#### Mobile State (< 768px)
```
Width: 280px
Position: Fixed overlay
Background Overlay: rgba(0, 0, 0, 0.5)
Slide in from left (300ms ease-out)
Close button: top-right corner
Swipe to close gesture supported
```

### Sidebar Layout

```
┌────────────────────────────┐
│                            │
│  MAIN NAVIGATION           │
│  ───────────────           │
│  📊 Dashboard              │  ← Active state
│  👥 Employee Management  ▶│  ← Has submenu
│  💼 Employee Projects      │
│  ⚠️ Compliance Dashboard   │
│  📋 Compliance Manager     │
│  🎫 Employee Tickets     ▶│  ← Has submenu (HR, Immigration)
│                            │
│  ADMINISTRATION            │
│  ───────────────           │
│  ⚙️ Data Administration  ▶│
│                            │
│  COMMUNICATION             │
│  ───────────────           │
│  🔔 Notifications      (5) │  ← Badge count
│  📰 Newsletter             │
│                            │
│  FEEDBACK                  │
│  ───────────────           │
│  💡 Suggestions & Ideas    │
│  🐛 Report an Issue        │
│                            │
│  ──────────────────────    │
│                            │
│  ◀ Collapse Sidebar        │  ← Toggle button
│                            │
└────────────────────────────┘
```

### Menu Item Specifications

#### Section Header
```
Text: "MAIN NAVIGATION", "ADMINISTRATION", etc.
Font: 11px, 600 weight
Color: #9CA3AF
Letter Spacing: 0.05em
Text Transform: uppercase
Padding: 16px 16px 8px 16px
```

#### Standard Menu Item
```
Height: 44px
Padding: 0 16px
Display: flex, align-items: center
Gap: 12px
Font: 14px, 500 weight
Color: #4B5563
Border Radius: 6px
Margin: 2px 8px

Icon:
  Size: 20px
  Color: #6B7280

Hover:
  Background: #F3F4F6
  Color: #374151
  Icon Color: #374151

Active/Current:
  Background: #DBEAFE
  Color: #1E40AF
  Icon Color: #3B82F6
  Font Weight: 600
```

#### Menu Item with Submenu
```
Same as standard, plus:
Chevron Icon: chevron-right, 16px, #9CA3AF
Chevron rotates 90° when expanded

Submenu Container:
  Background: #F9FAFB
  Border Radius: 6px
  Margin: 4px 8px
  Padding: 4px 0
```

#### Submenu Item
```
Height: 36px
Padding: 0 16px 0 44px (indent)
Font: 13px, 400 weight
Color: #6B7280

Hover:
  Color: #374151

Active:
  Color: #1E40AF
  Font Weight: 500
```

#### Badge Count
```
Position: Right side of menu item
Min Width: 20px
Height: 20px
Background: #EF4444
Color: #FFFFFF
Font: 11px, 600 weight
Border Radius: 9999px
Padding: 0 6px
```

### Collapse Toggle Button

```
Position: Bottom of sidebar
Height: 48px
Border Top: 1px solid #E5E7EB
Display: flex, align-items: center, justify-content: center
Font: 13px, 500 weight
Color: #6B7280
Icon: chevron-double-left (expanded), chevron-double-right (collapsed)

Hover:
  Background: #F3F4F6
  Color: #374151
```

---

## 🎭 4. Interactive States & Animations

### Sidebar Expand/Collapse Animation

```css
.sidebar {
  transition: width 300ms ease-in-out;
}

.sidebar-text {
  transition: opacity 200ms ease-in-out;
  opacity: 1;
}

.sidebar.collapsed .sidebar-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}
```

### Submenu Expand Animation

```css
.submenu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 200ms ease-out;
}

.submenu.expanded {
  max-height: 500px; /* Sufficient for content */
}
```

### Mobile Sidebar Slide-in

```css
.sidebar-overlay {
  opacity: 0;
  transition: opacity 300ms ease-out;
}

.sidebar-overlay.visible {
  opacity: 1;
}

.sidebar-mobile {
  transform: translateX(-100%);
  transition: transform 300ms ease-out;
}

.sidebar-mobile.open {
  transform: translateX(0);
}
```

### Tooltip (Collapsed State)

```
Delay: 300ms
Position: Right of icon
Background: #1F2937
Color: #FFFFFF
Font: 12px, 500 weight
Padding: 6px 10px
Border Radius: 4px
Shadow: shadow-lg
Arrow: 6px triangle pointing left
```

---

## 📱 5. Responsive Behavior

### Desktop (≥ 1024px)
- Sidebar expanded by default
- Collapse toggle visible
- User can toggle between expanded/collapsed
- State persisted in localStorage

### Tablet (768px - 1023px)
- Sidebar collapsed by default
- Expand on hover with delay (500ms)
- Full expand on hamburger click
- Overlay when expanded

### Mobile (< 768px)
- Sidebar hidden by default
- Full-width overlay on hamburger click
- Swipe right from left edge to open
- Swipe left to close
- Close on outside tap
- Close on navigation

---

## ♿ 6. Accessibility Requirements

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus between menu items |
| `Enter` / `Space` | Activate menu item or toggle submenu |
| `Arrow Up/Down` | Navigate within menu |
| `Arrow Right` | Expand submenu |
| `Arrow Left` | Collapse submenu |
| `Escape` | Close mobile sidebar |
| `Ctrl+K` / `Cmd+K` | Open global search |

### ARIA Attributes

```html
<!-- Sidebar -->
<nav role="navigation" aria-label="Main Navigation">

<!-- Menu item -->
<a role="menuitem" aria-current="page"> <!-- for active item -->

<!-- Expandable item -->
<button aria-expanded="false" aria-controls="submenu-id">

<!-- Submenu -->
<ul id="submenu-id" role="menu" aria-hidden="true">

<!-- Badge -->
<span aria-label="5 unread notifications">
```

### Focus Management

- Skip link: "Skip to main content" at top
- Focus trap in mobile sidebar
- Return focus to trigger on close
- Visible focus indicators on all items

---

## 🎨 7. Sample Visual Reference

### Expanded Sidebar (Active: Employee Management)

```
┌────────────────────────────────────────┐
│                                        │
│  MAIN NAVIGATION                       │
│  ───────────────                       │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 📊  Dashboard                     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 👥  Employee Management        ▼ │ │  ← Active parent
│  └──────────────────────────────────┘ │     (Blue bg)
│  ┌──────────────────────────────────┐ │
│  │    ├─ All Employees        ●     │ │  ← Active child
│  │    ├─ Add New Employee           │ │     (Blue dot)
│  │    └─ Employee Types          ▶ │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 💼  Employee Projects             │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ ⚠️  Compliance Dashboard          │ │
│  └──────────────────────────────────┘ │
│                                        │
```

### Color Reference for Sidebar States

| State | Background | Text | Icon |
|-------|------------|------|------|
| Default | Transparent | `#4B5563` | `#6B7280` |
| Hover | `#F3F4F6` | `#374151` | `#374151` |
| Active | `#DBEAFE` | `#1E40AF` | `#3B82F6` |
| Submenu Active | Transparent | `#1E40AF` | - |

---

## 📐 8. CSS Token Summary

```css
/* Sidebar */
--sidebar-width-expanded: 256px;
--sidebar-width-collapsed: 64px;
--sidebar-bg: #FFFFFF;
--sidebar-border: #E5E7EB;

/* Header */
--header-height: 64px;
--header-bg: #FFFFFF;
--header-border: #E5E7EB;

/* Menu Items */
--menu-item-height: 44px;
--menu-item-padding: 0 16px;
--menu-item-gap: 12px;
--menu-item-radius: 6px;

--menu-text-default: #4B5563;
--menu-text-hover: #374151;
--menu-text-active: #1E40AF;

--menu-icon-default: #6B7280;
--menu-icon-hover: #374151;
--menu-icon-active: #3B82F6;

--menu-bg-hover: #F3F4F6;
--menu-bg-active: #DBEAFE;

/* Section Header */
--section-header-color: #9CA3AF;
--section-header-size: 11px;
--section-header-weight: 600;
--section-header-spacing: 0.05em;
```

---

**Document Version:** 1.0  
**Last Updated:** December 13, 2025  
**Component:** Navigation System  
**Status:** Ready for Implementation

