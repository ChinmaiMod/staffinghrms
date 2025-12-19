# Comprehensive Testing Guide
## Staffing HRMS Application - Step-by-Step Testing Instructions

This guide provides detailed step-by-step instructions for testing all forms and functionality in the Staffing HRMS application.

---

## Prerequisites

1. **Application Running**
   - Start the development server: `npm run dev`
   - Ensure database connection is active
   - Log in as an admin user

2. **Test Data Preparation**
   - Clear or backup existing test data if needed
   - Have sample data ready (see sample data section below)

---

## Testing Order (Respect Dependencies)

### Phase 1: Foundation Setup

#### 1.1 Business Form Testing

**Path:** `/hrms/data-admin/businesses` → Click "Add Business"

**Test Case 1.1.1: Create New Business (Valid Data)**
1. Navigate to Business Management
2. Click "Add Business" button
3. Fill in the form:
   ```
   Business Name: Acme Staffing Solutions
   Business Type: IT_STAFFING
   Description: IT staffing and consulting services
   Industry: Technology
   Enabled Contact Types: [Select IT_CANDIDATE, EMPLOYEE_USA]
   Is Active: ✓ (checked)
   Is Default: ✓ (checked)
   ```
4. Click "Save"
5. **Expected Result:**
   - ✅ Form submits successfully
   - ✅ Success message displayed
   - ✅ Redirected to business list
   - ✅ New business appears in list

**Test Case 1.1.2: Validation Errors**
1. Click "Add Business" again
2. Leave "Business Name" empty
3. Click "Save"
4. **Expected Result:**
   - ✅ Error message: "Business name is required"
   - ✅ Field highlighted in red
   - ✅ Form does not submit
   - ✅ Error icon visible next to field

**Test Case 1.1.3: Edit Business**
1. Click on existing business
2. Change business name
3. Click "Save"
4. **Expected Result:**
   - ✅ Changes saved successfully
   - ✅ Success message displayed
   - ✅ Updated name appears in list

---

### Phase 2: Core Data Entry

#### 2.1 Employee Form Testing

**Path:** `/hrms/employees` → Click "Add Employee"

**Test Case 2.1.1: Complete Employee Creation (All Steps)**

**Step 1: Basic Information**
1. Fill in:
   ```
   First Name: John
   Middle Name: Michael
   Last Name: Smith
   Email: john.smith@example.com
   Phone: +1-555-123-4567
   Date of Birth: 1990-05-15
   Date of Birth (as per record): 1990-05-15
   SSN: 123-45-6789
   ```
2. Click "Next"
3. **Expected Result:**
   - ✅ Moves to Step 2
   - ✅ Step indicator shows Step 2 as current
   - ✅ No validation errors

**Step 2: Address**
1. Fill in:
   ```
   Current Street Address 1: 123 Main Street
   Current Street Address 2: Apt 4B
   Current City: Los Angeles
   Current State: California
   Current Country: United States
   Current Postal Code: 90001
   Permanent Same as Current: ✓ (checked)
   ```
2. Click "Next"
3. **Expected Result:**
   - ✅ Moves to Step 3
   - ✅ Permanent address fields auto-filled
   - ✅ No validation errors

**Step 3: Employment**
1. Fill in:
   ```
   Employee Type: IT USA
   Department: Engineering
   Job Title: Software Developer
   Employee Code: IES00012
   Employment Status: Active
   Hire Date: 2024-01-15
   Termination Date: (leave empty)
   LCA Job Title: Software Developer (if applicable)
   ```
2. Click "Next"
3. **Expected Result:**
   - ✅ Moves to Step 4 (Review)
   - ✅ All data displayed in summary
   - ✅ No validation errors

**Step 4: Review & Submit**
1. Review all information
2. Click "Submit"
3. **Expected Result:**
   - ✅ Form submits successfully
   - ✅ Success message displayed
   - ✅ Redirected to employee detail page
   - ✅ Employee appears in employee list

**Test Case 2.1.2: Validation Errors - Required Fields**
1. Start new employee form
2. Leave "First Name" empty
3. Click "Next"
4. **Expected Result:**
   - ✅ Error message: "First name is required"
   - ✅ Field highlighted in red
   - ✅ Error icon visible
   - ✅ Cannot proceed to next step

**Test Case 2.1.3: Validation Errors - Email Format**
1. Enter invalid email: "invalid-email"
2. Click "Next"
3. **Expected Result:**
   - ✅ Error message: "Please enter a valid email address"
   - ✅ Field highlighted in red
   - ✅ Cannot proceed

**Test Case 2.1.4: Edit Employee**
1. Navigate to employee list
2. Click on existing employee
3. Click "Edit"
4. Change first name
5. Click "Submit"
6. **Expected Result:**
   - ✅ Changes saved
   - ✅ Success message displayed
   - ✅ Updated information visible

---

#### 2.2 Project Form Testing

**Path:** `/hrms/projects` → Click "New Project"

**Prerequisite:** At least one employee must exist

**Test Case 2.2.1: Create New Project (Valid Data)**
1. Navigate to Projects
2. Click "New Project"
3. Fill in the form:
   ```
   Project Name: Acme Corp - Software Developer
   Project Code: PRJ-2025-001
   Employee: [Select John Smith (IES00012)]
   End Client Name: Acme Corporation
   End Client Manager Name: Jane Wilson
   End Client Manager Email: jane.wilson@acme.com
   End Client Manager Phone: +1-555-987-6543
   Work Location Type: Hybrid
   Project Start Date: 2025-01-15
   Project End Date: 2025-12-31
   Actual Client Bill Rate: 85.00
   Informed Rate to Candidate: 70.00
   Candidate Percentage: 80
   Rate Paid to Candidate: 56.00
   LCA Rate: 75.00
   Is LCA Project: ✓ (checked)
   Project Status: Active
   ```
4. Click "Save"
5. **Expected Result:**
   - ✅ Form submits successfully
   - ✅ Success message displayed
   - ✅ Redirected to project detail page
   - ✅ Project appears in project list

**Test Case 2.2.2: Validation Errors - Required Fields**
1. Start new project form
2. Leave "Project Name" empty
3. Click "Save"
4. **Expected Result:**
   - ✅ Error message: "Project name is required"
   - ✅ Field highlighted in red
   - ✅ Form does not submit

**Test Case 2.2.3: Validation Errors - Date Logic**
1. Set Project Start Date: 2025-12-31
2. Set Project End Date: 2025-01-15
3. Click "Save"
4. **Expected Result:**
   - ✅ Error message: "End date must be after start date"
   - ✅ End date field highlighted
   - ✅ Form does not submit

**Test Case 2.2.4: Validation Errors - LCA Project**
1. Check "Is LCA Project"
2. Leave "LCA Rate" empty
3. Click "Save"
4. **Expected Result:**
   - ✅ Error message: "LCA rate is required for LCA projects"
   - ✅ LCA Rate field highlighted
   - ✅ Form does not submit

---

#### 2.3 Client Form Testing

**Path:** `/hrms/clients` → Click "Add Client"

**Test Case 2.3.1: Create New Client (Valid Data)**
1. Navigate to Clients
2. Click "Add Client"
3. Fill in the form:
   ```
   Client Name: Acme Corporation
   Website: https://www.acme.com
   Industry: Technology
   Status: ACTIVE
   Primary Contact Email: contact@acme.com
   Primary Contact Phone: +1-555-111-2222
   Address: 456 Business Ave
   City: San Francisco
   State: California
   Country: USA
   Postal Code: 94102
   Notes: Major client, high priority
   ```
4. Click "Save"
5. **Expected Result:**
   - ✅ Form submits successfully
   - ✅ Success message displayed
   - ✅ Redirected to client list
   - ✅ Client appears in list

**Test Case 2.3.2: Validation Errors - URL Format**
1. Enter invalid URL: "not-a-url"
2. Click "Save"
3. **Expected Result:**
   - ✅ Error message: "Please enter a valid URL"
   - ✅ Website field highlighted
   - ✅ Form does not submit

**Test Case 2.3.3: Validation Errors - Email Format**
1. Enter invalid email in "Primary Contact Email": "invalid-email"
2. Click "Save"
3. **Expected Result:**
   - ✅ Error message: "Please enter a valid email address"
   - ✅ Email field highlighted
   - ✅ Form does not submit

---

#### 2.4 Vendor Form Testing

**Path:** `/hrms/vendors` → Click "Add Vendor"

**Test Case 2.4.1: Create New Vendor (Valid Data)**
1. Navigate to Vendors
2. Click "Add Vendor"
3. Fill in the form:
   ```
   Vendor Name: TechStaff Solutions
   Vendor Type: STAFFING
   Contact Email: info@techstaff.com
   Contact Phone: +1-555-333-4444
   Website: https://www.techstaff.com
   Address: 789 Vendor Street
   City: Dallas
   State: Texas
   Country: USA
   Postal Code: 75201
   Status: ACTIVE
   ```
4. Click "Save"
5. **Expected Result:**
   - ✅ Form submits successfully
   - ✅ Success message displayed
   - ✅ Vendor appears in list

---

### Phase 3: Supporting Features

#### 3.1 Checklist Type Form Testing

**Path:** `/hrms/data-admin/checklist-types` → Click "Add Checklist Type"

**Test Case 3.1.1: Create Checklist Type**
1. Navigate to Checklist Types
2. Click "Add Checklist Type"
3. Fill in:
   ```
   Type Code: EMP_ONBOARDING
   Type Name: Employee Onboarding
   Description: Checklist for new employee onboarding
   Target Entity Type: employee
   Target Table Name: hrms_employees
   Target ID Column: employee_id
   Icon: 📋
   Color Code: #3B82F6
   Display Order: 1
   Allow Multiple Templates: ✓
   Require Employee Type: ✗
   Enable AI Parsing: ✓
   Enable Compliance Tracking: ✓
   Is Active: ✓
   ```
4. Click "Save"
5. **Expected Result:**
   - ✅ Form submits successfully
   - ✅ Checklist type appears in list

---

#### 3.2 Visa Status Form Testing

**Path:** `/hrms/visa-immigration` → Click "Add Visa Status"

**Prerequisite:** Employee must exist

**Test Case 3.2.1: Create Visa Status**
1. Navigate to Visa & Immigration
2. Click "Add Visa Status"
3. Fill in:
   ```
   Employee: [Select existing employee]
   Visa Type: H1B
   Visa Status: Active
   Visa Number: H1B-2024-001
   Issue Date: 2024-01-15
   Expiry Date: 2027-01-14
   I-94 Number: I94-123456
   I-94 Expiry Date: 2027-01-14
   ```
4. Click "Save"
5. **Expected Result:**
   - ✅ Form submits successfully
   - ✅ Visa status appears in employee's visa history

---

## Error Scenario Testing

### Network Error Testing

**Test Case: Offline Mode**
1. Open browser DevTools → Network tab
2. Set throttling to "Offline"
3. Attempt to submit any form
4. **Expected Result:**
   - ✅ Network error message displayed
   - ✅ Message: "Connection failed. Please check your internet connection."
   - ✅ Form does not submit
   - ✅ User can retry after reconnecting

### Database Error Testing

**Test Case: Duplicate Employee Code**
1. Create employee with code: "IES00012"
2. Try to create another employee with same code
3. **Expected Result:**
   - ✅ Error message: "This record already exists. Please use a different value."
   - ✅ Employee Code field highlighted
   - ✅ Form does not submit

**Test Case: Foreign Key Constraint**
1. Create project with employee
2. Try to delete the employee
3. **Expected Result:**
   - ✅ Error message: "Cannot delete this record because it is referenced by other data."
   - ✅ Employee not deleted

---

## UI Compliance Verification

### Color Verification

**Test:** Check all error states use `#EF4444`
1. Trigger validation error on any form
2. Inspect error border/text color
3. **Expected:** Color is `#EF4444` (Error Red)

**Test:** Check all success states use `#10B981`
1. Successfully submit any form
2. Inspect success message color
3. **Expected:** Color is `#10B981` (Success Green)

### Typography Verification

**Test:** Check base font size
1. Inspect any text element
2. **Expected:** Font size is 14px (base)

**Test:** Check font family
1. Inspect any text element
2. **Expected:** Font family is Inter (or system fallback)

### Spacing Verification

**Test:** Check form spacing
1. Inspect form groups
2. **Expected:** Spacing uses multiples of 8px (8px, 16px, 24px, etc.)

### Button Verification

**Test:** Check primary button
1. Inspect any primary button
2. **Expected:**
   - Background: `#3B82F6`
   - Text: White
   - Border radius: `6px`
   - Height: 40px (medium)

**Test:** Check button hover state
1. Hover over primary button
2. **Expected:** Background changes to `#2563EB`

---

## Testing Checklist Summary

### Forms Tested
- [ ] Business Form
- [ ] Employee Form (all 4 steps)
- [ ] Project Form
- [ ] Client Form
- [ ] Vendor Form
- [ ] Checklist Type Form
- [ ] Visa Status Form
- [ ] Dependent Form

### Error Scenarios Tested
- [ ] Required field validation
- [ ] Format validation (email, URL, phone)
- [ ] Date logic validation
- [ ] Duplicate key errors
- [ ] Foreign key constraint errors
- [ ] Network errors
- [ ] Database errors

### UI Compliance Verified
- [ ] Error colors (`#EF4444`)
- [ ] Success colors (`#10B981`)
- [ ] Typography (14px base, Inter font)
- [ ] Spacing (8pt grid)
- [ ] Button styling
- [ ] Input styling
- [ ] Focus states

---

## Sample Data Reference

### Complete Employee Data
```javascript
{
  // Step 1: Basic Information
  first_name: "John",
  middle_name: "Michael",
  last_name: "Smith",
  email: "john.smith@example.com",
  phone: "+1-555-123-4567",
  date_of_birth: "1990-05-15",
  date_of_birth_as_per_record: "1990-05-15",
  ssn: "123-45-6789",
  
  // Step 2: Address
  current_street_address_1: "123 Main Street",
  current_street_address_2: "Apt 4B",
  current_city_id: "1",
  current_state_id: "1",
  current_country_id: "1",
  current_postal_code: "90001",
  permanent_same_as_current: true,
  
  // Step 3: Employment
  employee_type: "it_usa",
  department_id: "1",
  job_title_id: "1",
  employee_code: "IES00012",
  employment_status: "active",
  hire_date: "2024-01-15"
}
```

### Complete Project Data
```javascript
{
  project_name: "Acme Corp - Software Developer",
  project_code: "PRJ-2025-001",
  employee_id: "[Select from created employee]",
  end_client_name: "Acme Corporation",
  end_client_manager_name: "Jane Wilson",
  end_client_manager_email: "jane.wilson@acme.com",
  end_client_manager_phone: "+1-555-987-6543",
  work_location_type: "hybrid",
  project_start_date: "2025-01-15",
  project_end_date: "2025-12-31",
  actual_client_bill_rate: "85.00",
  informed_rate_to_candidate: "70.00",
  candidate_percentage: 80,
  rate_paid_to_candidate: "56.00",
  lca_rate: "75.00",
  is_lca_project: true,
  project_status: "active"
}
```

---

## Notes

- Always test in the order specified to respect data dependencies
- Clear test data between test runs if needed
- Document any deviations from expected behavior
- Take screenshots of errors for documentation
- Verify both create and edit functionality for each form
