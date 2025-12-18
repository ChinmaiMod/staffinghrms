# Staffing HRMS - Design System & Style Guide

## 📋 Executive Summary

This document establishes the foundational design system for the Staffing HRMS application. It defines the visual language, design tokens, and component standards that ensure consistency across all pages and features.

**Product Goal:** Provide staffing agencies with an efficient, intuitive system to manage employees across IT and Healthcare divisions.

**Target Audience:** HR administrators, compliance officers, and staffing managers aged 30-55, moderately tech-savvy, who need to manage large volumes of employee data efficiently.

**Platform:** Web-first (desktop primary), responsive for tablet. Mobile view for quick reference only.

---

## 🎨 1. Color Palette

### Primary Colors

| Name | HEX | RGB | Usage |
|------|-----|-----|-------|
| **Primary Blue** | `#3B82F6` | rgb(59, 130, 246) | Primary buttons, links, active states, navigation highlights |
| **Primary Blue Dark** | `#2563EB` | rgb(37, 99, 235) | Button hover states, focus rings |
| **Primary Blue Light** | `#DBEAFE` | rgb(219, 234, 254) | Selected row backgrounds, info alerts |

### Secondary Colors

| Name | HEX | RGB | Usage |
|------|-----|-----|-------|
| **Secondary Gray** | `#6B7280` | rgb(107, 114, 128) | Secondary text, icons, borders |
| **Secondary Gray Dark** | `#374151` | rgb(55, 65, 81) | Primary text, headings |
| **Secondary Gray Light** | `#F3F4F6` | rgb(243, 244, 246) | Page backgrounds, disabled states |

### Semantic Colors

| Name | HEX | RGB | Usage |
|------|-----|-----|-------|
| **Success Green** | `#10B981` | rgb(16, 185, 129) | Success messages, active status, completed items |
| **Success Green Light** | `#D1FAE5` | rgb(209, 250, 229) | Success alert backgrounds |
| **Warning Amber** | `#F59E0B` | rgb(245, 158, 11) | Warning messages, pending status, expiring soon |
| **Warning Amber Light** | `#FEF3C7` | rgb(254, 243, 199) | Warning alert backgrounds |
| **Error Red** | `#EF4444` | rgb(239, 68, 68) | Error messages, overdue items, delete actions |
| **Error Red Light** | `#FEE2E2` | rgb(254, 226, 226) | Error alert backgrounds |
| **Info Purple** | `#8B5CF6` | rgb(139, 92, 246) | Informational highlights, special badges |

### Status Colors (Employee/Compliance)

| Status | Badge BG | Badge Text | Dot Color |
|--------|----------|------------|-----------|
| **Active** | `#D1FAE5` | `#065F46` | `#10B981` |
| **Inactive** | `#F3F4F6` | `#374151` | `#6B7280` |
| **On Leave** | `#FEF3C7` | `#92400E` | `#F59E0B` |
| **Terminated** | `#FEE2E2` | `#991B1B` | `#EF4444` |
| **Pending** | `#DBEAFE` | `#1E40AF` | `#3B82F6` |
| **Overdue** | `#FEE2E2` | `#991B1B` | `#EF4444` |
| **Completed** | `#D1FAE5` | `#065F46` | `#10B981` |
| **Critical** | `#FEE2E2` | `#991B1B` | `#EF4444` |

### Employee Type Colors

| Type | Primary Color | Light BG | Icon |
|------|---------------|----------|------|
| **Internal India** | `#8B5CF6` | `#EDE9FE` | 🇮🇳 |
| **Internal USA** | `#3B82F6` | `#DBEAFE` | 🇺🇸 |
| **IT USA** | `#10B981` | `#D1FAE5` | 💻 |
| **Non-IT USA** | `#F97316` | `#FFEDD5` | 🏢 |
| **Healthcare USA** | `#EC4899` | `#FCE7F3` | 🏥 |

---

## 🔤 2. Typography

### Font Family

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

### Type Scale

| Name | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|--------|-------------|----------------|-------|
| **Display** | 36px | 700 | 44px | -0.02em | Dashboard hero numbers |
| **H1** | 30px | 600 | 36px | -0.01em | Page titles |
| **H2** | 24px | 600 | 32px | -0.01em | Section headers |
| **H3** | 20px | 600 | 28px | 0 | Card titles |
| **H4** | 16px | 600 | 24px | 0 | Subsection headers |
| **Body Large** | 16px | 400 | 24px | 0 | Primary body text |
| **Body** | 14px | 400 | 20px | 0 | Default body text |
| **Body Small** | 13px | 400 | 18px | 0 | Secondary text, captions |
| **Caption** | 12px | 400 | 16px | 0.01em | Labels, timestamps |
| **Overline** | 11px | 600 | 16px | 0.05em | Section overlines, badges |
| **Code** | 13px | 400 | 20px | 0 | Code snippets, employee codes |

### Font Weights

```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

---

## 📐 3. Spacing & Grid System

### 8pt Grid System

All spacing uses multiples of 8px for consistency.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | 0px | None |
| `--space-1` | 4px | Tight spacing, icon gaps |
| `--space-2` | 8px | Small gaps, button padding Y |
| `--space-3` | 12px | Form field gaps |
| `--space-4` | 16px | Card padding, section gaps |
| `--space-5` | 20px | Standard padding |
| `--space-6` | 24px | Large section padding |
| `--space-8` | 32px | Major section separations |
| `--space-10` | 40px | Page section margins |
| `--space-12` | 48px | Large whitespace |
| `--space-16` | 64px | Hero sections |

### Layout Grid

```css
/* Desktop (≥1280px) */
--grid-columns: 12;
--grid-gutter: 24px;
--grid-margin: 32px;
--content-max-width: 1440px;

/* Tablet (768px - 1279px) */
--grid-columns: 8;
--grid-gutter: 20px;
--grid-margin: 24px;

/* Mobile (< 768px) */
--grid-columns: 4;
--grid-gutter: 16px;
--grid-margin: 16px;
```

### Sidebar Width

```css
--sidebar-width-collapsed: 64px;
--sidebar-width-expanded: 256px;
```

---

## 🔲 4. Border Radius & Shadows

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0px | Tables, sharp elements |
| `--radius-sm` | 4px | Small buttons, tags |
| `--radius-md` | 6px | Default buttons, inputs |
| `--radius-lg` | 8px | Cards, modals |
| `--radius-xl` | 12px | Large cards, dialogs |
| `--radius-2xl` | 16px | Hero cards |
| `--radius-full` | 9999px | Avatars, pills, badges |

### Shadows

```css
/* Elevation levels */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Focus ring */
--shadow-focus: 0 0 0 3px rgba(59, 130, 246, 0.4);
--shadow-focus-error: 0 0 0 3px rgba(239, 68, 68, 0.4);
```

---

## 🖼️ 5. Iconography

### Icon System
- **Library:** Heroicons (https://heroicons.com)
- **Style:** Outline (24px) for navigation, Solid (20px) for inline actions
- **Stroke Width:** 1.5px for outline icons

### Standard Icon Sizes

| Size | Dimensions | Usage |
|------|------------|-------|
| **XS** | 16×16px | Inline text icons, badges |
| **SM** | 20×20px | Button icons, table actions |
| **MD** | 24×24px | Navigation, cards |
| **LG** | 32×32px | Empty states, features |
| **XL** | 48×48px | Hero illustrations |

### Common Icons Mapping

| Action | Icon Name | Color |
|--------|-----------|-------|
| Add/Create | `plus` | Primary Blue |
| Edit | `pencil` | Secondary Gray |
| Delete | `trash` | Error Red |
| View | `eye` | Secondary Gray |
| Download | `arrow-down-tray` | Primary Blue |
| Upload | `arrow-up-tray` | Primary Blue |
| Search | `magnifying-glass` | Secondary Gray |
| Filter | `funnel` | Secondary Gray |
| Sort | `arrows-up-down` | Secondary Gray |
| Close | `x-mark` | Secondary Gray |
| Check/Success | `check-circle` | Success Green |
| Warning | `exclamation-triangle` | Warning Amber |
| Error | `exclamation-circle` | Error Red |
| Info | `information-circle` | Primary Blue |
| User | `user` | Secondary Gray |
| Settings | `cog-6-tooth` | Secondary Gray |
| Notification | `bell` | Secondary Gray |
| Calendar | `calendar` | Secondary Gray |
| Document | `document-text` | Secondary Gray |
| Folder | `folder` | Secondary Gray |

---

## 🧩 6. Component Standards

### Buttons

#### Primary Button
```
Background: #3B82F6 (Primary Blue)
Text: #FFFFFF
Padding: 8px 16px
Border Radius: 6px
Font: 14px, 500 weight
Height: 36px (SM), 40px (MD), 44px (LG)

Hover: Background #2563EB
Active: Background #1D4ED8
Disabled: Background #93C5FD, cursor not-allowed
Focus: shadow-focus ring
```

#### Secondary Button
```
Background: #FFFFFF
Border: 1px solid #D1D5DB
Text: #374151
Padding: 8px 16px

Hover: Background #F9FAFB
Active: Background #F3F4F6
```

#### Danger Button
```
Background: #EF4444
Text: #FFFFFF

Hover: Background #DC2626
```

#### Ghost Button
```
Background: transparent
Text: #3B82F6

Hover: Background #DBEAFE
```

### Form Inputs

#### Text Input
```
Background: #FFFFFF
Border: 1px solid #D1D5DB
Border Radius: 6px
Padding: 10px 12px
Height: 40px
Font: 14px

Focus: Border #3B82F6, shadow-focus
Error: Border #EF4444, shadow-focus-error
Disabled: Background #F9FAFB, text #9CA3AF
```

#### Select Dropdown
```
Same as Text Input
Chevron Icon: right-aligned, #6B7280
Dropdown Menu: shadow-lg, max-height 240px
Option Hover: Background #F3F4F6
Option Selected: Background #DBEAFE, text #1E40AF
```

#### Checkbox
```
Size: 16×16px
Border: 1px solid #D1D5DB
Border Radius: 4px
Checked: Background #3B82F6, white checkmark
Focus: shadow-focus
```

#### Radio Button
```
Size: 16×16px
Border: 1px solid #D1D5DB
Border Radius: 9999px
Selected: Border #3B82F6, inner dot #3B82F6 (8×8px)
```

### Data Table

```
Header Row:
  Background: #F9FAFB
  Text: #374151, 12px, 600 weight, uppercase
  Padding: 12px 16px
  Border Bottom: 1px solid #E5E7EB

Body Row:
  Background: #FFFFFF
  Text: #374151, 14px
  Padding: 16px
  Border Bottom: 1px solid #E5E7EB
  
  Hover: Background #F9FAFB
  Selected: Background #DBEAFE

Zebra Striping: Optional, alternate #F9FAFB
```

### Cards

```
Background: #FFFFFF
Border: 1px solid #E5E7EB
Border Radius: 8px
Shadow: shadow-sm
Padding: 24px

Header:
  Font: H3 (20px, 600)
  Margin Bottom: 16px
  Border Bottom: 1px solid #E5E7EB (optional)
```

### Badges/Tags

```
Padding: 4px 8px
Border Radius: 9999px
Font: 12px, 500 weight

Status variations use Status Colors defined above
```

### Modal/Dialog

```
Overlay: rgba(0, 0, 0, 0.5)
Container:
  Background: #FFFFFF
  Border Radius: 12px
  Shadow: shadow-xl
  Max Width: 560px (SM), 720px (MD), 960px (LG)
  Padding: 24px

Header:
  Font: H2 (24px, 600)
  Close Button: top-right, 24×24px

Footer:
  Padding Top: 24px
  Border Top: 1px solid #E5E7EB
  Button alignment: right
```

### Toast Notifications

```
Position: Bottom-right, 24px from edges
Max Width: 400px
Border Radius: 8px
Shadow: shadow-lg
Padding: 16px

Success: Left border 4px #10B981, icon check-circle
Warning: Left border 4px #F59E0B, icon exclamation-triangle
Error: Left border 4px #EF4444, icon exclamation-circle
Info: Left border 4px #3B82F6, icon information-circle

Auto-dismiss: 5 seconds (configurable)
```

---

## 📱 7. Responsive Breakpoints

| Breakpoint | Min Width | Max Width | Target |
|------------|-----------|-----------|--------|
| **Mobile** | 0px | 767px | Phones |
| **Tablet** | 768px | 1023px | Tablets, small laptops |
| **Desktop** | 1024px | 1279px | Standard laptops |
| **Desktop Large** | 1280px | 1535px | Large monitors |
| **Desktop XL** | 1536px | ∞ | Ultra-wide monitors |

```css
/* CSS Custom Media Queries */
@media (max-width: 767px) { /* Mobile */ }
@media (min-width: 768px) and (max-width: 1023px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Desktop Large */ }
@media (min-width: 1536px) { /* Desktop XL */ }
```

---

## ♿ 8. Accessibility Guidelines

### Color Contrast
- **Normal text:** Minimum 4.5:1 contrast ratio (WCAG AA)
- **Large text (18px+):** Minimum 3:1 contrast ratio
- **Interactive elements:** Minimum 3:1 against background

### Focus States
- All interactive elements must have visible focus indicators
- Use `shadow-focus` for consistent focus rings
- Never use `outline: none` without alternative focus indicator

### Keyboard Navigation
- All functionality accessible via keyboard
- Tab order follows logical reading order
- Escape key closes modals and dropdowns
- Enter/Space activates buttons and links

### Screen Reader Support
- All images have meaningful `alt` text
- Form inputs have associated `<label>` elements
- ARIA landmarks for main regions
- Live regions for dynamic content updates

### Motion & Animation
- Respect `prefers-reduced-motion` media query
- Provide option to disable animations
- No content that flashes more than 3 times per second

---

## 🎭 9. Animation & Transitions

### Timing Functions

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### Duration

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 150ms | Hovers, toggles |
| `--duration-normal` | 200ms | Default transitions |
| `--duration-slow` | 300ms | Page transitions, modals |
| `--duration-slower` | 500ms | Complex animations |

### Standard Transitions

```css
/* Button hover */
transition: background-color 150ms ease-in-out, 
            border-color 150ms ease-in-out;

/* Modal entrance */
transition: opacity 200ms ease-out, 
            transform 200ms ease-out;

/* Sidebar expand/collapse */
transition: width 300ms ease-in-out;

/* Dropdown menu */
transition: opacity 150ms ease-out, 
            transform 150ms ease-out;
```

---

## 📄 10. Page Layout Templates

### Standard Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (64px height, fixed)                                     │
│ Logo | Breadcrumb                    Notifications | User Menu  │
├─────────────────────────────────────────────────────────────────┤
│         │                                                       │
│ SIDEBAR │  MAIN CONTENT AREA                                    │
│ (256px) │  ┌─────────────────────────────────────────────────┐ │
│         │  │ PAGE HEADER                                      │ │
│ Menu    │  │ Title              Actions (+ Add, Export, etc.) │ │
│ Items   │  ├─────────────────────────────────────────────────┤ │
│         │  │ FILTERS BAR (collapsible)                       │ │
│         │  │ Search | Type | Status | Date Range | Clear     │ │
│         │  ├─────────────────────────────────────────────────┤ │
│         │  │                                                  │ │
│         │  │ CONTENT                                          │ │
│         │  │ (Table, Cards, Forms, etc.)                      │ │
│         │  │                                                  │ │
│         │  ├─────────────────────────────────────────────────┤ │
│         │  │ PAGINATION                                       │ │
│         │  │ Showing 1-25 of 150        < 1 2 3 ... 6 >       │ │
│         │  └─────────────────────────────────────────────────┘ │
│         │                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                          │
├─────────────────────────────────────────────────────────────────┤
│         │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ SIDEBAR │  │ STAT     │ │ STAT     │ │ STAT     │ │ STAT     │ │
│         │  │ CARD 1   │ │ CARD 2   │ │ CARD 3   │ │ CARD 4   │ │
│         │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│         │  ┌────────────────────────┐ ┌────────────────────────┐│
│         │  │                        │ │                        ││
│         │  │ CHART / CALENDAR       │ │ COMPLIANCE OVERVIEW    ││
│         │  │ (Large Widget)         │ │ (Medium Widget)        ││
│         │  │                        │ │                        ││
│         │  └────────────────────────┘ └────────────────────────┘│
│         │  ┌────────────────────────────────────────────────────┐│
│         │  │ RECENT ACTIVITIES TABLE                            ││
│         │  └────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 11. File Naming Conventions

### Components
- PascalCase: `EmployeeList.jsx`, `ComplianceCard.jsx`
- Suffix with type: `EmployeeForm.jsx`, `ProjectModal.jsx`

### Styles
- kebab-case: `employee-list.css`, `compliance-card.css`
- Module pattern: `EmployeeList.module.css`

### Images/Icons
- kebab-case: `icon-user.svg`, `logo-primary.png`
- Include size: `avatar-32.png`, `avatar-64.png`

---

**Document Version:** 1.0  
**Last Updated:** December 13, 2025  
**Author:** UI/UX Design Team  
**Status:** Approved for Implementation

