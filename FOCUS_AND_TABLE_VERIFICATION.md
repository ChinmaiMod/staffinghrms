# Focus States & Table Styling Verification Report

**Date:** 2025-01-17  
**Status:** Issues Found - Fixes Required

---

## 1. Focus States Verification

### ✅ Good Practices Found

**Global Styles (`src/styles/index.css`):**
- ✅ Buttons have focus states: `.btn-primary:focus { box-shadow: var(--shadow-focus); }`
- ✅ Form inputs have focus states: `.form-input:focus { box-shadow: var(--shadow-focus); }`
- ✅ Error states have focus: `.form-input.error:focus { box-shadow: var(--shadow-focus-error); }`

**Design System:**
- ✅ `--shadow-focus` defined: `0 0 0 3px rgba(59, 130, 246, 0.4)`
- ✅ `--shadow-focus-error` defined: `0 0 0 3px rgba(239, 68, 68, 0.4)`

### ⚠️ Issues Found

**Problem:** Many components use `outline: none` without ensuring alternative focus indicators are present.

**Files with `outline: none` but need verification:**
1. `src/components/Feedback/Feedback.css` - Lines 52-55
2. `src/components/IssueReport/IssueReport.css` - Lines 68-71
3. `src/components/DataAdministration/UserInvitations/InviteUsers.css` - Lines 64-66
4. `src/components/DataAdministration/UserRoles/UserRolesManagement.css` - Lines 288-291
5. `src/components/Auth/Auth.css` - Lines 63-64
6. Multiple form component CSS files

**Required Fix:**
All elements with `outline: none` MUST have:
- `box-shadow: var(--shadow-focus)` on `:focus` or `:focus-visible`
- OR visible border change on focus
- OR other visible focus indicator

---

## 2. Table Styling Verification

### Design System Requirements

**From `UI_DESIGN_DOCS/00_DESIGN_SYSTEM.md`:**

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
```

### Current Implementation Status

#### ✅ Compliant Tables

**1. Global Data Table (`src/styles/index.css`):**
```css
.data-table th {
  padding: var(--space-3) var(--space-4);  /* ✅ 12px 16px */
  font-size: var(--text-sm);                /* ✅ 12px */
  font-weight: var(--font-semibold);        /* ✅ 600 */
  color: var(--color-gray-700);             /* ✅ #374151 */
  background-color: var(--color-gray-50);    /* ✅ #F9FAFB */
  border-bottom: 1px solid var(--color-gray-200); /* ✅ #E5E7EB */
  text-transform: uppercase;               /* ✅ */
}

.data-table td {
  padding: var(--space-4);                  /* ✅ 16px */
  font-size: var(--text-base);              /* ✅ 14px */
  color: var(--color-gray-700);            /* ✅ #374151 */
  border-bottom: 1px solid var(--color-gray-200); /* ✅ #E5E7EB */
}

.data-table tbody tr:hover {
  background-color: var(--color-gray-50);   /* ✅ #F9FAFB */
}

.data-table tbody tr.selected {
  background-color: var(--color-primary-light); /* ✅ #DBEAFE */
}
```
**Status:** ✅ Fully Compliant

#### ⚠️ Partially Compliant Tables

**2. Client Table (`src/components/HRMS/Clients/ClientList.css`):**
```css
.client-table th {
  padding: 12px 16px;        /* ✅ Correct */
  font-size: 12px;          /* ✅ Correct */
  font-weight: 600;         /* ✅ Correct */
  color: #6B7280;           /* ⚠️ Should be #374151 */
  background: #F9FAFB;       /* ✅ Correct */
  text-transform: uppercase; /* ✅ Correct */
}

.client-table td {
  padding: 16px;            /* ✅ Correct */
  font-size: 14px;          /* ✅ Correct */
  color: #374151;           /* ✅ Correct */
}
```
**Issues:**
- ⚠️ Header text color is `#6B7280` instead of `#374151`
- ⚠️ Missing hover state verification
- ⚠️ Missing selected state verification

**3. Employee Table (`src/components/HRMS/Employees/EmployeeList.css`):**
- ⚠️ Needs verification against design standards
- ⚠️ May have custom styling that deviates

**4. Issue Table (`src/components/IssueReport/IssueManagement.css`):**
```css
.issues-table th {
  padding: 1rem;            /* ⚠️ Should be 12px 16px (0.75rem 1rem) */
  font-size: 0.875rem;      /* ⚠️ Should be 12px (0.75rem) */
  font-weight: 600;         /* ✅ Correct */
  color: #1e293b;           /* ⚠️ Should be #374151 */
  background: #f8fafc;      /* ✅ Correct (#F9FAFB) */
}

.issues-table td {
  padding: 1rem;            /* ⚠️ Should be 16px (1rem is close) */
  color: #475569;          /* ⚠️ Should be #374151 */
}
```
**Issues:**
- ⚠️ Padding values don't match exactly
- ⚠️ Text colors don't match design system
- ⚠️ Missing uppercase text-transform on headers

**5. Users Table (`src/components/DataAdministration/UserRoles/AssignUserRoles.css`):**
```css
.users-table th {
  padding: 1rem;            /* ⚠️ Should be 12px 16px */
  font-size: 0.85rem;       /* ⚠️ Should be 12px */
  color: #2d3748;           /* ⚠️ Should be #374151 */
  background: #f7fafc;       /* ⚠️ Should be #F9FAFB */
}
```
**Issues:**
- ⚠️ Multiple styling deviations from design system

---

## 3. Recommendations

### Focus States

1. **Create Focus State Utility Class:**
   ```css
   .focus-visible {
     outline: none;
   }
   
   .focus-visible:focus-visible {
     box-shadow: var(--shadow-focus);
   }
   ```

2. **Update All Components:**
   - Replace `outline: none` with focus-visible pattern
   - Ensure all interactive elements have visible focus indicators
   - Test with keyboard navigation

3. **Add Focus State Tests:**
   - Verify all buttons have focus indicators
   - Verify all form inputs have focus indicators
   - Verify all links have focus indicators
   - Test with keyboard-only navigation

### Table Styling

1. **Standardize All Tables:**
   - Use `.data-table` class from `index.css` where possible
   - Update custom table styles to match design system
   - Ensure consistent colors, spacing, and typography

2. **Create Table Component:**
   - Consider creating a reusable `<DataTable>` component
   - Enforce design system standards
   - Support hover and selected states

3. **Update Specific Tables:**
   - Client Table: Fix header text color
   - Issue Table: Fix padding and colors
   - Users Table: Align with design system
   - Employee Table: Verify compliance

---

## 4. Priority Actions

### High Priority
- [ ] Fix focus states in all form components
- [ ] Standardize Client Table styling
- [ ] Standardize Issue Table styling

### Medium Priority
- [ ] Create focus state utility class
- [ ] Update Employee Table if needed
- [ ] Update Users Table styling

### Low Priority
- [ ] Create reusable Table component
- [ ] Add focus state tests
- [ ] Document focus state patterns

---

## 5. Testing Checklist

### Focus States
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Test with keyboard navigation only
- [ ] Verify no `outline: none` without alternative
- [ ] Test in different browsers

### Table Styling
- [ ] Verify header background: #F9FAFB
- [ ] Verify header text: #374151, 12px, 600, uppercase
- [ ] Verify header padding: 12px 16px
- [ ] Verify body text: #374151, 14px
- [ ] Verify body padding: 16px
- [ ] Verify hover state: #F9FAFB
- [ ] Verify selected state: #DBEAFE
- [ ] Verify border colors: #E5E7EB

---

## Summary

**Focus States:** ⚠️ Needs Improvement
- Many components use `outline: none` without ensuring alternative focus indicators
- Need to add `box-shadow` focus states to all interactive elements

**Table Styling:** ⚠️ Partially Compliant
- Global `.data-table` class is fully compliant
- Several custom tables have minor deviations
- Need standardization across all table implementations
