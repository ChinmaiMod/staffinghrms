# HRMS Dashboard - UI Design Specification

## 📋 Executive Summary

The HRMS Dashboard is the primary landing page after login, providing at-a-glance visibility into employee statistics, compliance status, upcoming expirations, and recent activities. It serves as the command center for HR administrators.

**Page URL:** `/hrms/dashboard`  
**Access Level:** All HRMS users  
**Primary Function:** Overview of key metrics and quick access to urgent items

---

## 🗺️ 1. Page Layout Structure

### Desktop Layout (≥ 1280px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                        [🏢 Intuites LLC ▼]          │
├────────────┬────────────────────────────────────────────────────────────────┤
│            │                                                                │
│  SIDEBAR   │  ┌──────────────────────────────────────────────────────────┐ │
│            │  │ Welcome Back, John! 👋                      Dec 13, 2025 │ │
│            │  │ Here's what's happening in your HRMS today.              │ │
│            │  └──────────────────────────────────────────────────────────┘ │
│            │                                                                │
│            │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│            │  │ TOTAL      │ │ ACTIVE     │ │ ON LEAVE   │ │ COMPLIANCE │  │
│            │  │ EMPLOYEES  │ │ PROJECTS   │ │            │ │ PENDING    │  │
│            │  │    156     │ │    89      │ │     12     │ │    23      │  │
│            │  │ +8 this mo │ │ +3 this wk │ │ 4 return   │ │ ⚠️ 5 overdue│  │
│            │  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │
│            │                                                                │
│            │  ┌──────────────────────────────┐ ┌──────────────────────────┐│
│            │  │                              │ │                          ││
│            │  │   EMPLOYEES BY TYPE          │ │   COMPLIANCE STATUS      ││
│            │  │   [Donut Chart]              │ │   [Bar Chart]            ││
│            │  │                              │ │                          ││
│            │  │   🟣 Internal India: 45      │ │   ⬛ Completed: 145      ││
│            │  │   🔵 Internal USA: 32        │ │   🟡 Pending: 18         ││
│            │  │   🟢 IT USA: 54              │ │   🔴 Overdue: 5          ││
│            │  │   🟠 Healthcare USA: 25      │ │                          ││
│            │  │                              │ │                          ││
│            │  └──────────────────────────────┘ └──────────────────────────┘│
│            │                                                                │
│            │  ┌──────────────────────────────────────────────────────────┐ │
│            │  │ ⚠️ EXPIRING DOCUMENTS (Next 30 Days)           View All > │ │
│            │  ├──────────────────────────────────────────────────────────┤ │
│            │  │ 🔴 H1B - John Smith (IES00012)      Expires: Dec 20, 2025│ │
│            │  │ 🟡 Passport - Mary Johnson (IES00034) Expires: Jan 5, 2026│ │
│            │  │ 🟡 BLS License - Robert Davis (IES00056) Exp: Jan 10, 2026│ │
│            │  │ ... 4 more items                                         │ │
│            │  └──────────────────────────────────────────────────────────┘ │
│            │                                                                │
│            │  ┌──────────────────────────────────────────────────────────┐ │
│            │  │ 📋 RECENT ACTIVITIES                           View All > │ │
│            │  ├──────────────────────────────────────────────────────────┤ │
│            │  │ 👤 New employee added: Sarah Wilson (IES00156) - 2h ago  │ │
│            │  │ 📄 Document uploaded: H1B for Mike Chen - 5h ago         │ │
│            │  │ ✅ Compliance resolved: I9 for Lisa Brown - Yesterday    │ │
│            │  │ 💼 Project started: John Doe @ Acme Corp - Yesterday     │ │
│            │  └──────────────────────────────────────────────────────────┘ │
│            │                                                                │
└────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 🧩 2. Component Specifications

### 2.1 Welcome Section

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Welcome Back, John! 👋                                       Dec 13, 2025   │
│ Here's what's happening in your HRMS today.                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Property | Value |
|----------|-------|
| **Background** | Gradient: `linear-gradient(135deg, #DBEAFE 0%, #EDE9FE 100%)` |
| **Border Radius** | 12px |
| **Padding** | 24px |
| **Margin Bottom** | 24px |

| Element | Specification |
|---------|---------------|
| **Greeting Text** | Font: 24px, 600 weight, `#1F2937` |
| **Wave Emoji** | 24px inline |
| **Date** | Font: 14px, 400 weight, `#6B7280`, right-aligned |
| **Subtext** | Font: 14px, 400 weight, `#4B5563` |

**Sample Data:**
- Greeting: "Welcome Back, John! 👋"
- Date: "Dec 13, 2025"
- Subtext: "Here's what's happening in your HRMS today."

---

### 2.2 Statistics Cards

```
┌────────────────────────────────────────────┐
│  👥                           ↗ +8 (5.4%)  │
│                                            │
│  156                                       │
│  Total Employees                           │
│                                            │
│  +8 added this month                       │
└────────────────────────────────────────────┘
```

**Card Grid Layout:**
- 4 cards in a row on desktop
- 2 cards per row on tablet
- 1 card per row on mobile
- Gap: 24px

**Card Specifications:**

| Property | Value |
|----------|-------|
| **Width** | Flexible (1/4 of container minus gaps) |
| **Min Width** | 200px |
| **Height** | Auto (min 140px) |
| **Background** | `#FFFFFF` |
| **Border** | 1px solid `#E5E7EB` |
| **Border Radius** | 12px |
| **Padding** | 20px |
| **Shadow** | `shadow-sm` |
| **Hover Shadow** | `shadow-md` |
| **Transition** | `box-shadow 200ms ease-in-out` |

**Card Elements:**

| Element | Specification |
|---------|---------------|
| **Icon Container** | 40×40px, rounded-lg, background varies by card |
| **Icon** | 20px, color varies |
| **Trend Indicator** | Top-right, Font: 12px, 500 weight, includes arrow |
| **Main Number** | Font: 36px, 700 weight, `#1F2937` |
| **Label** | Font: 14px, 500 weight, `#6B7280` |
| **Secondary Text** | Font: 13px, 400 weight, `#9CA3AF` |

**Card Configurations:**

| Card | Icon | Icon BG | Icon Color | Trend Color |
|------|------|---------|------------|-------------|
| Total Employees | `users` | `#DBEAFE` | `#3B82F6` | Green (+) / Red (-) |
| Active Projects | `briefcase` | `#D1FAE5` | `#10B981` | Green (+) / Red (-) |
| On Leave | `calendar` | `#FEF3C7` | `#F59E0B` | Neutral |
| Compliance Pending | `exclamation-triangle` | `#FEE2E2` | `#EF4444` | Red if overdue |

**Sample Data:**

| Card | Value | Trend | Secondary |
|------|-------|-------|-----------|
| Total Employees | 156 | ↗ +8 (5.4%) | +8 added this month |
| Active Projects | 89 | ↗ +3 (3.5%) | +3 this week |
| On Leave | 12 | - | 4 returning this week |
| Compliance Pending | 23 | ⚠️ | 5 overdue |

---

### 2.3 Charts Section

#### Employees by Type (Donut Chart)

```
┌──────────────────────────────────────────────────────┐
│  Employees by Type                           [···]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│         ┌─────────────────┐                          │
│         │    ╭───────╮    │    🟣 Internal India  45│
│         │   ╱  156   ╲   │    🔵 Internal USA   32 │
│         │  │  Total  │   │    🟢 IT USA         54 │
│         │   ╲       ╱    │    🟠 Healthcare USA 25 │
│         │    ╰─────╯     │                          │
│         └─────────────────┘                          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Chart Card:**

| Property | Value |
|----------|-------|
| **Width** | 50% minus gap (desktop), 100% (mobile) |
| **Min Height** | 320px |
| **Background** | `#FFFFFF` |
| **Border** | 1px solid `#E5E7EB` |
| **Border Radius** | 12px |
| **Padding** | 24px |

**Chart Configuration:**

| Property | Value |
|----------|-------|
| **Chart Type** | Donut |
| **Inner Radius** | 60% |
| **Outer Radius** | 90% |
| **Center Text** | "156 Total" - 24px, 600 weight |
| **Animation** | Ease-out, 500ms |

**Legend:**

| Type | Color | Sample Value |
|------|-------|--------------|
| Internal India | `#8B5CF6` | 45 (29%) |
| Internal USA | `#3B82F6` | 32 (21%) |
| IT USA | `#10B981` | 54 (35%) |
| Healthcare USA | `#F97316` | 25 (16%) |

**Legend Item Style:**
```
Display: flex, align-items: center
Gap: 8px
Color Dot: 12×12px, rounded-full
Label: 13px, 400 weight, #374151
Value: 13px, 600 weight, #374151
```

---

#### Compliance Status (Bar Chart)

```
┌──────────────────────────────────────────────────────┐
│  Compliance Status                           [···]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Completed  ████████████████████████████████  145    │
│  Pending    ██████                            18     │
│  Overdue    ██                                5      │
│                                                      │
│  Last 30 Days                                        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Chart Configuration:**

| Property | Value |
|----------|-------|
| **Chart Type** | Horizontal Bar |
| **Bar Height** | 32px |
| **Bar Gap** | 16px |
| **Bar Radius** | 6px |
| **Background** | `#F3F4F6` |
| **Max Width** | Based on highest value |

**Bar Colors:**

| Status | Color | Sample Value |
|--------|-------|--------------|
| Completed | `#10B981` | 145 |
| Pending | `#F59E0B` | 18 |
| Overdue | `#EF4444` | 5 |

**Bar Label:**
```
Position: Right of bar
Font: 14px, 600 weight, #374151
```

---

### 2.4 Expiring Documents Card

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚠️ Expiring Documents (Next 30 Days)                              View All > │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  🔴  H1B Visa                                                                │
│      John Smith (IES00012) • IT USA            Expires: Dec 20, 2025  ⚡7d   │
│                                                                              │
│  🟡  Passport                                                                │
│      Mary Johnson (IES00034) • Internal USA    Expires: Jan 5, 2026   23d   │
│                                                                              │
│  🟡  BLS License                                                             │
│      Robert Davis (IES00056) • Healthcare USA  Expires: Jan 10, 2026  28d   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    + 4 more items expiring soon                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Card Header:**

| Property | Value |
|----------|-------|
| **Icon** | `exclamation-triangle`, 20px, `#F59E0B` |
| **Title** | Font: 16px, 600 weight, `#1F2937` |
| **View All Link** | Font: 14px, 500 weight, `#3B82F6`, with arrow icon |
| **Border Bottom** | 1px solid `#E5E7EB` |
| **Padding** | 16px 20px |

**Item Row:**

| Property | Value |
|----------|-------|
| **Height** | Auto (min 72px) |
| **Padding** | 16px 20px |
| **Border Bottom** | 1px solid `#F3F4F6` |
| **Hover Background** | `#F9FAFB` |
| **Cursor** | pointer |

**Item Elements:**

| Element | Specification |
|---------|---------------|
| **Status Dot** | 10×10px circle, positioned left |
| **Document Type** | Font: 14px, 600 weight, `#1F2937` |
| **Employee Info** | Font: 13px, 400 weight, `#6B7280` |
| **Employee Code** | Font: 13px, 500 weight, `#374151`, monospace |
| **Employee Type Badge** | Font: 11px, 500 weight, pill badge |
| **Expiry Date** | Font: 13px, 400 weight, `#6B7280`, right-aligned |
| **Days Badge** | Font: 12px, 600 weight, pill style |

**Status Dot Colors:**

| Urgency | Color | Condition |
|---------|-------|-----------|
| Critical | `#EF4444` | ≤7 days |
| Warning | `#F59E0B` | 8-30 days |
| Info | `#3B82F6` | >30 days |

**Days Badge Colors:**

| Urgency | Background | Text |
|---------|------------|------|
| Critical (≤7d) | `#FEE2E2` | `#991B1B` |
| Warning (8-30d) | `#FEF3C7` | `#92400E` |

**"More Items" Row:**
```
Background: #F9FAFB
Text: 13px, 500 weight, #6B7280
Padding: 12px 20px
Text Align: center
Hover: Background #F3F4F6, cursor pointer
```

---

### 2.5 Recent Activities Card

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 📋 Recent Activities                                              View All > │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  👤  New employee added                                              2h ago │
│      Sarah Wilson (IES00156) - Healthcare USA                               │
│                                                                              │
│  📄  Document uploaded                                               5h ago │
│      H1B Visa for Mike Chen (IES00089)                                      │
│                                                                              │
│  ✅  Compliance item resolved                                    Yesterday  │
│      I9 Verification for Lisa Brown (IES00045)                              │
│                                                                              │
│  💼  Project started                                             Yesterday  │
│      John Doe (IES00023) @ Acme Corporation                                 │
│                                                                              │
│  📤  Timesheet submitted                                          2 days ago│
│      Weekly timesheet by Amy Lee (IES00067)                                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Activity Item:**

| Property | Value |
|----------|-------|
| **Height** | Auto (min 64px) |
| **Padding** | 14px 20px |
| **Border Bottom** | 1px solid `#F3F4F6` |
| **Display** | flex, align-items: flex-start |
| **Gap** | 12px |

**Item Elements:**

| Element | Specification |
|---------|---------------|
| **Icon Container** | 36×36px, rounded-lg, background by type |
| **Icon** | 18px, color by type |
| **Action Text** | Font: 14px, 500 weight, `#1F2937` |
| **Detail Text** | Font: 13px, 400 weight, `#6B7280` |
| **Timestamp** | Font: 12px, 400 weight, `#9CA3AF`, right-aligned |

**Activity Type Icons:**

| Type | Icon | Background | Icon Color |
|------|------|------------|------------|
| Employee Added | `user-plus` | `#D1FAE5` | `#10B981` |
| Document Uploaded | `document-arrow-up` | `#DBEAFE` | `#3B82F6` |
| Compliance Resolved | `check-circle` | `#D1FAE5` | `#10B981` |
| Project Started | `briefcase` | `#EDE9FE` | `#8B5CF6` |
| Timesheet Submitted | `clock` | `#FEF3C7` | `#F59E0B` |
| Employee Terminated | `user-minus` | `#FEE2E2` | `#EF4444` |

---

## 🎯 3. Quick Actions (FAB Menu)

**Floating Action Button** positioned bottom-right:

```
Position: Fixed
Bottom: 24px
Right: 24px
Z-Index: 800

Primary FAB:
  Size: 56×56px
  Background: #3B82F6
  Shadow: shadow-lg
  Icon: plus, 24px, #FFFFFF
  Border Radius: 9999px
  
  Hover: Background #2563EB, shadow-xl
  Active: Scale 0.95
```

**Expanded Menu (on click):**

```
┌─────────────────────────┐
│  👤 Add Employee        │
│  📄 Upload Document     │
│  💼 Add Project         │
│  📋 Create Compliance   │
└─────────────────────────┘
          ⊕  (FAB)
```

**Menu Item:**
```
Height: 44px
Padding: 0 16px
Background: #FFFFFF
Shadow: shadow-md
Border Radius: 8px
Gap between items: 8px
Animation: Staggered fade-in from bottom (100ms delay each)
```

---

## 📊 4. Data Requirements

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dashboard/stats` | GET | Fetch statistics cards data |
| `/api/dashboard/employee-distribution` | GET | Employee type chart data |
| `/api/dashboard/compliance-stats` | GET | Compliance status chart data |
| `/api/dashboard/expiring-documents` | GET | Documents expiring in 30 days |
| `/api/dashboard/recent-activities` | GET | Recent activity feed |

### Sample API Response (Stats)

```json
{
  "totalEmployees": {
    "count": 156,
    "change": 8,
    "changePercent": 5.4,
    "period": "month"
  },
  "activeProjects": {
    "count": 89,
    "change": 3,
    "changePercent": 3.5,
    "period": "week"
  },
  "onLeave": {
    "count": 12,
    "returning": 4,
    "returningThisWeek": true
  },
  "compliancePending": {
    "count": 23,
    "overdue": 5,
    "critical": 2
  }
}
```

### Sample API Response (Expiring Documents)

```json
{
  "documents": [
    {
      "documentId": "doc-uuid-123",
      "documentType": "H1B Visa",
      "employeeId": "emp-uuid-456",
      "employeeName": "John Smith",
      "employeeCode": "IES00012",
      "employeeType": "it_usa",
      "expiryDate": "2025-12-20",
      "daysUntilExpiry": 7,
      "urgency": "critical"
    }
  ],
  "totalCount": 7,
  "displayedCount": 3
}
```

---

## 🔄 5. Loading & Empty States

### Loading State

```
┌────────────────────────────────────────────┐
│  ┌──────────────────────────────────────┐ │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓                      │ │  ← Skeleton
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓            │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────┐ │
│  │ ▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓ │ │ ▓▓▓▓▓▓ │ │▓▓▓▓▓│ │  ← Stat cards skeleton
│  │ ▓▓▓    │ │ ▓▓▓    │ │ ▓▓▓    │ │▓▓▓  │ │
│  └────────┘ └────────┘ └────────┘ └─────┘ │
└────────────────────────────────────────────┘
```

**Skeleton Animation:**
```css
background: linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%);
background-size: 200% 100%;
animation: shimmer 1.5s infinite;

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Empty States

**No Expiring Documents:**
```
┌──────────────────────────────────────────────┐
│                                              │
│              ✅                              │
│                                              │
│      All documents are up to date!           │
│   No documents expiring in the next 30 days  │
│                                              │
└──────────────────────────────────────────────┘

Icon: check-badge, 48px, #10B981
Title: 20px, 600 weight, #1F2937
Subtitle: 14px, 400 weight, #6B7280
```

**No Recent Activities:**
```
┌──────────────────────────────────────────────┐
│                                              │
│              📋                              │
│                                              │
│        No recent activities                  │
│    Activities will appear here as you        │
│    make changes in the system                │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 📱 6. Responsive Behavior

### Tablet (768px - 1023px)

- Stats cards: 2 per row
- Charts: Stack vertically (full width each)
- Expiring documents: Show 3 items
- Activities: Show 4 items

### Mobile (< 768px)

- Stats cards: 2 per row (compact version)
- Charts: Full width, reduced height
- Expiring documents: Show 2 items
- Activities: Show 3 items
- FAB: Smaller (48×48px)

**Mobile Stats Card (Compact):**
```
Height: 100px
Main Number: 28px
Label: 12px
Hide secondary text
```

---

## ♿ 7. Accessibility

### Semantic HTML Structure

```html
<main role="main" aria-label="HRMS Dashboard">
  <section aria-label="Welcome message">...</section>
  <section aria-label="Key statistics">...</section>
  <section aria-label="Charts and analytics">...</section>
  <section aria-label="Expiring documents">...</section>
  <section aria-label="Recent activities">...</section>
</main>
```

### Screen Reader Announcements

- Stats cards: "Total employees: 156, increased by 8 this month"
- Expiring items: "H1B Visa for John Smith, employee code IES00012, expires December 20, 2025, 7 days remaining, critical urgency"
- Activities: "2 hours ago, new employee added, Sarah Wilson, employee code IES00156"

### Keyboard Navigation

- Tab through all interactive elements
- Enter to activate links and buttons
- FAB menu: Space to toggle, Arrow keys to navigate items, Escape to close

---

## 🔄 8. Real-time Updates

### Auto-refresh Configuration

| Data Type | Refresh Interval |
|-----------|------------------|
| Statistics | 5 minutes |
| Expiring Documents | 15 minutes |
| Recent Activities | 30 seconds |
| Compliance Status | 5 minutes |

### WebSocket Events

- `employee:created` - Update employee count
- `document:uploaded` - Add to activities
- `compliance:resolved` - Update compliance chart
- `compliance:overdue` - Update pending count

---

**Document Version:** 1.0  
**Last Updated:** December 13, 2025  
**Page:** HRMS Dashboard  
**Status:** Ready for Implementation

