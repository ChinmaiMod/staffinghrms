# Admin-Configurable Checklist System - Quick Reference

## Overview
Complete flexibility: Admins can create ANY type of checklist for ANY entity without code changes.

---

## How It Works

### 1. Admin Creates Checklist Type (One-Time Setup)

**Example: Create "Vendor Certification" Checklist**

**Step 1:** Navigate to Data Administration → Checklist Type Management

**Step 2:** Click "+ Create New Checklist Type"

**Step 3:** Fill in configuration:
```yaml
Type Code: vendor_certification
Type Name: Vendor Certifications
Description: Required certifications from vendors
Target Entity Type: custom
Target Table: contacts
Target ID Column: id
Icon: 🏅 badge-check
Color: #10B981 (green)
Behavior:
  - ✅ Allow Multiple Templates
  - ✅ Enable AI Parsing
  - ✅ Enable Compliance Tracking
  - ❌ Require Employee Type
```

**Step 4:** Save

**Result:** New checklist type is available system-wide!

---

### 2. User Creates Template from Type

**Navigation:** Data Administration → Checklist Templates

**Create Template:**
```yaml
Template Name: ISO 9001 Vendor Certification
Checklist Type: Vendor Certification (from dropdown)
Employee Type: (not required for this type)
```

**Add Groups:**
- Group 1: Quality Certifications
- Group 2: Safety Certifications
- Group 3: Insurance Documents

**Add Items:**
- ISO 9001 Certificate (Group 1)
- ISO 14001 Certificate (Group 1)
- OSHA Compliance (Group 2)
- General Liability Insurance (Group 3)
- Workers' Comp Insurance (Group 3)

---

### 3. Documents Get Mapped Automatically

**When uploading a document:**

```javascript
// System automatically knows the mapping
const checklistType = getChecklistType('vendor_certification');

// checklistType contains:
{
  target_table_name: 'contacts',
  target_id_column: 'id'
}

// Document insertion
INSERT INTO hrms_documents (
  entity_type: 'custom',
  entity_id: vendor_contact_id,  // Maps to contacts.id
  checklist_item_id: iso_9001_item_id,
  ...
)
```

**Query to get all vendor certifications:**
```sql
SELECT d.*
FROM hrms_documents d
JOIN hrms_checklist_items ci ON d.checklist_item_id = ci.item_id
JOIN hrms_checklist_templates ct ON ci.template_id = ct.template_id
JOIN hrms_checklist_types ctype ON ct.checklist_type_id = ctype.checklist_type_id
WHERE ctype.type_code = 'vendor_certification'
  AND d.entity_id = :vendor_contact_id
  AND d.is_current_version = true;
```

---

## Real-World Examples

### Example 1: Employee Immigration (Built-in)

**Admin Config:**
```yaml
type_code: immigration
target_table: hrms_employees
target_id_column: employee_id
require_employee_type: true
```

**Usage:**
- Template: "IT USA Immigration Checklist"
- Entity: Employee (John Doe, employee_code: IES00001, employee_id: abc-123)
- Documents map to: hrms_employees.employee_id = 'abc-123'
- Note: `employee_code` (e.g., IES00001) is for display; `employee_id` (UUID) is for DB references

---

### Example 2: Project Documents (Built-in)

**Admin Config:**
```yaml
type_code: project
target_table: hrms_projects
target_id_column: project_id
require_employee_type: false
```

**Usage:**
- Template: "Project Legal Documents"
- Entity: Project (Acme Corp Project, project_id: def-456)
- Documents map to: hrms_projects.project_id = 'def-456'

---

### Example 3: Client Onboarding (Custom)

**Admin Config:**
```yaml
type_code: client_onboarding
target_table: contacts
target_id_column: id
require_employee_type: false
```

**Usage:**
- Template: "New Client Documents"
- Entity: Client (XYZ Corp, contact_id: ghi-789)
- Documents map to: contacts.id = 'ghi-789'

**Checklist Items:**
- Master Service Agreement
- W9 Form
- Insurance Certificate
- NDA
- Payment Terms Agreement

---

### Example 4: Equipment Tracking (Custom)

**Admin Creates New Table & Type:**

**Step 1:** Create equipment table (via migration):
```sql
CREATE TABLE hrms_equipment (
  equipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  equipment_name VARCHAR(255),
  serial_number VARCHAR(100),
  assigned_to_employee_id UUID REFERENCES hrms_employees(employee_id),
  ...
);
```

**Step 2:** Create checklist type:
```yaml
type_code: equipment_documentation
target_table: hrms_equipment
target_id_column: equipment_id
require_employee_type: false
```

**Step 3:** Create template:
- Purchase Order
- Warranty Document
- User Manual
- Maintenance Records

**Usage:**
- Entity: Laptop (Dell XPS 15, equipment_id: jkl-012)
- Documents map to: hrms_equipment.equipment_id = 'jkl-012'

---

## Comparison: Before vs After

### Before (Hardcoded System)

**Adding New Document Type (e.g., Vendor Certification):**

1. ❌ Modify database schema:
   ```sql
   ALTER TABLE hrms_checklist_templates 
   ADD CONSTRAINT valid_checklist_type 
   CHECK (checklist_type IN (..., 'vendor_certification'));
   ```

2. ❌ Update backend code:
   ```javascript
   // edgeFunctions.js
   if (checklistType === 'vendor_certification') {
     entityTable = 'contacts';
     entityIdColumn = 'id';
   }
   ```

3. ❌ Update frontend:
   ```javascript
   // ChecklistTypeDropdown.jsx
   const types = [
     ...existingTypes,
     { value: 'vendor_certification', label: 'Vendor Certification' }
   ];
   ```

4. ❌ Deploy code changes
5. ❌ Migration required
6. ❌ Testing needed
7. ❌ Documentation updates

**Time:** Several hours to days  
**Risk:** High (code changes, deployment, testing)  
**Flexibility:** Low

---

### After (Admin-Configurable System)

**Adding New Document Type (e.g., Vendor Certification):**

1. ✅ Admin opens Checklist Type Management page
2. ✅ Clicks "+ Create New Checklist Type"
3. ✅ Fills form (2 minutes)
4. ✅ Saves

**Time:** 2 minutes  
**Risk:** None (no code changes, no deployment)  
**Flexibility:** Extreme - any table, any column, any configuration

---

## Key Concepts

### 1. Polymorphic Storage
Documents don't know what they're attached to—they just store:
```javascript
{
  entity_type: 'custom',  // Category
  entity_id: 'uuid-here'  // The specific record
}
```

The checklist type configuration tells the system what table/column to use.

### 2. Dynamic Mapping
```javascript
// At runtime, system looks up mapping
const checklistType = await getChecklistType(template.checklist_type_id);
const targetTable = checklistType.target_table_name;
const targetColumn = checklistType.target_id_column;

// Now can query dynamically
const query = `
  SELECT * FROM ${targetTable}
  WHERE ${targetColumn} = $1
`;
```

### 3. Zero Hardcoding
No checklist types in code:
- ❌ No `if (type === 'immigration')` statements
- ❌ No enum definitions
- ❌ No hardcoded table mappings
- ✅ Everything in database, configured by admin

---

## Query Patterns

### Get Documents for Any Entity
```sql
-- Generic query works for ANY checklist type
SELECT 
  d.*,
  ci.item_name,
  cg.group_name,
  ct.template_name,
  ctype.type_name,
  ctype.target_table_name,
  ctype.target_id_column
FROM hrms_documents d
JOIN hrms_checklist_items ci ON d.checklist_item_id = ci.item_id
JOIN hrms_checklist_groups cg ON ci.group_id = cg.group_id
JOIN hrms_checklist_templates ct ON ci.template_id = ct.template_id
JOIN hrms_checklist_types ctype ON ct.checklist_type_id = ctype.checklist_type_id
WHERE d.entity_id = :entity_id
  AND d.is_current_version = true
ORDER BY cg.display_order, ci.display_order;
```

### Get All Expiring Documents (Universal)
```sql
-- Works for ALL checklist types automatically
SELECT 
  d.*,
  ctype.type_name,
  ctype.target_table_name,
  ctype.target_id_column,
  ctype.icon,
  ctype.color_code
FROM hrms_documents d
JOIN hrms_checklist_items ci ON d.checklist_item_id = ci.item_id
JOIN hrms_checklist_templates ct ON ci.template_id = ct.template_id
JOIN hrms_checklist_types ctype ON ct.checklist_type_id = ctype.checklist_type_id
WHERE d.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
  AND d.compliance_tracking_flag = true
  AND d.is_current_version = true
  AND ctype.enable_compliance_tracking = true
ORDER BY d.expiry_date ASC;
```

### Get Entity Details (Dynamic Join)
```javascript
// Backend function: dynamically join to target table
async function getDocumentsWithEntityDetails(entityId, checklistTypeId) {
  const checklistType = await getChecklistType(checklistTypeId);
  
  // Build dynamic query
  const query = `
    SELECT 
      d.*,
      entity.*
    FROM hrms_documents d
    JOIN ${checklistType.target_table_name} entity 
      ON d.entity_id = entity.${checklistType.target_id_column}
    WHERE d.entity_id = $1
  `;
  
  return await supabase.rpc('execute_dynamic_query', { 
    query, 
    params: [entityId] 
  });
}
```

---

## Admin Workflow Summary

### Adding New Checklist Type (Example: Interview Documents)

**Scenario:** Want to track interview documents for candidates

**Step 1: Decide Entity**
- Option A: Use existing `contacts` table with `contact_type = 'candidate'`
- Option B: Create new `hrms_candidates` table

Let's use Option A (contacts).

**Step 2: Create Checklist Type**
```yaml
Go to: Data Administration → Checklist Type Management
Click: + Create New Checklist Type

Fill Form:
  Type Code: interview_documents
  Type Name: Interview Documents
  Description: Documents collected during candidate interviews
  Target Entity Type: custom
  Target Table: contacts
  Target ID Column: id
  Icon: 📝 document-text
  Color: #8B5CF6 (purple)
  Display Order: 25
  ✅ Allow Multiple Templates
  ✅ Enable AI Parsing
  ✅ Enable Compliance Tracking
  ❌ Require Employee Type

Save
```

**Step 3: Create Template**
```yaml
Go to: Data Administration → Checklist Templates
Click: + Create Template

Fill Form:
  Template Name: Technical Interview Documents
  Checklist Type: Interview Documents (appears in dropdown!)
  Employee Type: (not required)

Add Groups:
  - Background Documents
  - Technical Assessments
  - Reference Checks

Add Items:
  - Resume (Background Documents)
  - Cover Letter (Background Documents)
  - Coding Challenge Results (Technical Assessments)
  - System Design Whiteboard (Technical Assessments)
  - Reference Check Form 1 (Reference Checks)
  - Reference Check Form 2 (Reference Checks)

Save
```

**Step 4: Use Immediately**
- Navigate to candidate profile
- Upload documents
- System automatically maps to `contacts.id`
- Documents appear in candidate's checklist
- Compliance tracking active (if any have expiry dates)

**Total Time:** 5 minutes  
**Code Changes:** 0  
**Deployments:** 0  

---

## Benefits Summary

✅ **No Hardcoding** - All types defined by admins  
✅ **Instant Availability** - New types usable immediately  
✅ **Flexible Mapping** - Any table, any column  
✅ **Safe Configuration** - Validation prevents errors  
✅ **Impact Analysis** - See what will be affected  
✅ **System Protection** - Built-in types cannot be deleted  
✅ **Scalability** - Unlimited custom types  
✅ **Unified Management** - Single admin interface  

---

## Future Extensions (Easy to Add)

### Business Documents
```yaml
type_code: business_compliance
target_table: businesses
target_id_column: business_id
```

### Location Documents
```yaml
type_code: office_documents
target_table: locations
target_id_column: location_id
```

### Training Materials
```yaml
type_code: training_materials
target_table: hrms_training_courses
target_id_column: course_id
```

### Benefits Enrollment
```yaml
type_code: benefits_documents
target_table: hrms_employee_benefits
target_id_column: benefit_id
```

**All added via admin UI in minutes!**

---

**Status:** ✅ Architecture Complete  
**Flexibility:** Extreme - Any entity, any context  
**Deployment:** Ready for Phase 1 implementation  
**Last Updated:** November 10, 2025
