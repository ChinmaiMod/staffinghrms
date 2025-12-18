# Staffing HRMS - Complete Data Model & Schema Design

## Overview
Multi-tenant HRMS system integrated with Staffing CRM, built on React (Vite) + Supabase (PostgreSQL) with RLS-based tenant isolation.

## Core Principles
- All tables prefixed with `hrms_`
- All tables include `tenant_id` and `business_id` for multi-tenancy
- RLS policies enforce tenant isolation
- Audit fields: `created_at`, `updated_at`, `created_by`, `updated_by`
- Soft deletes where applicable (`deleted_at`, `is_active`)

---

## 1. EMPLOYEE CORE TABLES

### 1.1 hrms_employees (Core Employee Information)
Primary table for all employee types.

**Employee Code Format:** `<business_short_name><sequence>` (e.g., `IES00001` for Intuites LLC)
- Business short_name is sourced from `businesses.short_name`
- Sequence is auto-incremented per business using `hrms_employee_sequences` table
- Format: 3-5 char prefix + 5-digit zero-padded number

```sql
CREATE TABLE hrms_employees (
  employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID REFERENCES businesses(business_id),
  
  -- From CRM Bridge
  crm_contact_id UUID REFERENCES contacts(id),
  
  -- Basic Info (employee_code format: <short_name><seq>, e.g., IES00001)
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  
  -- Employee Type
  employee_type VARCHAR(50) NOT NULL, -- 'internal_india', 'internal_usa', 'it_usa', 'nonit_usa', 'healthcare_usa'
  
  -- Dates
  date_of_birth DATE,
  date_of_birth_as_per_record DATE,
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Job Details (Dual Job Titles)
  job_title_id INTEGER REFERENCES job_title(id), -- Working/functional title (e.g., "Senior React Developer")
  lca_job_title_id UUID REFERENCES hrms_lca_job_titles(lca_job_title_id), -- LCA/immigration title (e.g., "Software Developer" per DOL)
  department VARCHAR(100),
  
  -- Sensitive Info (encrypted)
  ssn_encrypted TEXT,
  
  -- Status
  employment_status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'terminated', 'on_leave'
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_employee_type CHECK (employee_type IN ('internal_india', 'internal_usa', 'it_usa', 'nonit_usa', 'healthcare_usa'))
);

CREATE INDEX idx_hrms_employees_tenant ON hrms_employees(tenant_id);
CREATE INDEX idx_hrms_employees_business ON hrms_employees(business_id);
CREATE INDEX idx_hrms_employees_type ON hrms_employees(employee_type);
CREATE INDEX idx_hrms_employees_status ON hrms_employees(employment_status);
CREATE INDEX idx_hrms_employees_crm_contact ON hrms_employees(crm_contact_id);
CREATE INDEX idx_hrms_employees_code ON hrms_employees(employee_code);
```

---

### 1.2 hrms_employee_addresses (Time-Based Address History)
Tracks multiple addresses with temporal validity.

```sql
CREATE TABLE hrms_employee_addresses (
  address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID REFERENCES businesses(business_id),
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Address Type
  address_type VARCHAR(50) NOT NULL, -- 'current', 'permanent', 'mailing', 'previous'
  
  -- Address Details
  street_address_1 VARCHAR(255),
  street_address_2 VARCHAR(255),
  city_id UUID REFERENCES cities(city_id),
  state_id UUID REFERENCES states(state_id),
  country_id UUID REFERENCES countries(country_id),
  postal_code VARCHAR(20),
  
  -- Temporal Validity
  valid_from DATE NOT NULL,
  valid_to DATE,
  is_current BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_date_range CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

CREATE INDEX idx_hrms_addresses_employee ON hrms_employee_addresses(employee_id);
CREATE INDEX idx_hrms_addresses_current ON hrms_employee_addresses(is_current) WHERE is_current = true;
CREATE INDEX idx_hrms_addresses_dates ON hrms_employee_addresses(valid_from, valid_to);
```

---

### 1.3 hrms_employee_sequences (Auto-Increment Per Business)
Tracks the next sequence number for employee codes per business.

```sql
CREATE TABLE hrms_employee_sequences (
  sequence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID NOT NULL REFERENCES businesses(business_id),
  
  -- Current sequence value (next employee gets this number, then it increments)
  next_sequence INTEGER NOT NULL DEFAULT 1,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_business_sequence UNIQUE (business_id)
);

-- Function to generate next employee code
CREATE OR REPLACE FUNCTION fn_generate_employee_code(p_business_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_short_name VARCHAR(10);
  v_next_seq INTEGER;
  v_employee_code VARCHAR(50);
BEGIN
  -- Get business short_name
  SELECT short_name INTO v_short_name
  FROM businesses
  WHERE business_id = p_business_id;
  
  IF v_short_name IS NULL THEN
    RAISE EXCEPTION 'Business short_name not found for business_id %', p_business_id;
  END IF;
  
  -- Get and increment sequence (with lock)
  INSERT INTO hrms_employee_sequences (tenant_id, business_id, next_sequence)
  SELECT tenant_id, business_id, 1
  FROM businesses WHERE business_id = p_business_id
  ON CONFLICT (business_id) 
  DO UPDATE SET 
    next_sequence = hrms_employee_sequences.next_sequence + 1,
    updated_at = NOW()
  RETURNING next_sequence - 1 INTO v_next_seq;
  
  -- For new inserts, use 1; for updates, we got the pre-increment value
  IF v_next_seq IS NULL THEN
    v_next_seq := 1;
  END IF;
  
  -- Format: PREFIX + 5-digit zero-padded number (e.g., IES00001)
  v_employee_code := v_short_name || LPAD(v_next_seq::TEXT, 5, '0');
  
  RETURN v_employee_code;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- INSERT INTO hrms_employees (employee_code, ...) 
-- VALUES (fn_generate_employee_code('business-uuid'), ...);
```

**Note:** The `businesses` table (shared with CRM) must have a `short_name` column:
```sql
-- Add to businesses table if not exists
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS short_name VARCHAR(10);

-- Example business short names:
-- Intuites LLC → 'IES'
-- Acme Corp → 'ACM'
-- TechStaff Inc → 'TSI'
```

---

## 2. UNIVERSAL DOCUMENT CHECKLIST SYSTEM

**Key Enhancement:** Fully dynamic, admin-configurable checklist architecture for ANY document type.

### 2.1 hrms_checklist_types (Checklist Type Definitions) ⭐ NEW
**Admin-configurable checklist types with entity mapping definitions.**

```sql
CREATE TABLE hrms_checklist_types (
  checklist_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  
  -- Type Definition
  type_code VARCHAR(100) UNIQUE NOT NULL, -- 'immigration', 'project', 'timesheet', etc.
  type_name VARCHAR(255) NOT NULL, -- 'Immigration Documents', 'Project Documents', etc.
  type_description TEXT,
  
  -- Entity Mapping Configuration
  target_entity_type VARCHAR(100) NOT NULL, -- 'employee', 'project', 'timesheet', 'compliance', 'custom'
  target_table_name VARCHAR(100) NOT NULL, -- 'hrms_employees', 'hrms_projects', 'hrms_timesheets', etc.
  target_id_column VARCHAR(100) NOT NULL, -- 'employee_id', 'project_id', 'timesheet_id', etc.
  
  -- Display Configuration
  icon VARCHAR(50), -- UI icon name: 'document', 'project', 'clock', 'shield', etc.
  color_code VARCHAR(20), -- Hex color for UI: '#3B82F6', '#10B981', etc.
  display_order INTEGER DEFAULT 0,
  
  -- Behavior Flags
  allow_multiple_templates BOOLEAN DEFAULT true, -- Can have multiple templates of this type
  require_employee_type BOOLEAN DEFAULT false, -- Must specify employee_type for templates
  enable_ai_parsing BOOLEAN DEFAULT true, -- Enable AI parsing for this checklist type
  enable_compliance_tracking BOOLEAN DEFAULT true, -- Enable expiry/compliance tracking
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system_type BOOLEAN DEFAULT false, -- System types cannot be deleted
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_target_entity CHECK (target_entity_type IN ('employee', 'project', 'timesheet', 'compliance', 'visa', 'background_check', 'performance', 'custom'))
);

CREATE INDEX idx_hrms_checklist_types_tenant ON hrms_checklist_types(tenant_id);
CREATE INDEX idx_hrms_checklist_types_code ON hrms_checklist_types(type_code);
CREATE INDEX idx_hrms_checklist_types_entity ON hrms_checklist_types(target_entity_type);
CREATE INDEX idx_hrms_checklist_types_active ON hrms_checklist_types(is_active) WHERE is_active = true;

-- Seed Default System Types
INSERT INTO hrms_checklist_types (type_code, type_name, type_description, target_entity_type, target_table_name, target_id_column, icon, color_code, require_employee_type, is_system_type) VALUES
('immigration', 'Immigration Documents', 'Employee immigration and visa documents', 'employee', 'hrms_employees', 'employee_id', 'passport', '#3B82F6', true, true),
('project', 'Project Documents', 'Project-related documents (MSA, PO, COI, SOW)', 'project', 'hrms_projects', 'project_id', 'briefcase', '#10B981', false, true),
('timesheet', 'Timesheet Documents', 'Timesheet supporting documents and attachments', 'timesheet', 'hrms_timesheets', 'timesheet_id', 'clock', '#F59E0B', false, true),
('compliance', 'Compliance Documents', 'Regulatory and compliance documents', 'compliance', 'hrms_compliance_items', 'compliance_item_id', 'shield-check', '#EF4444', false, true),
('onboarding', 'Employee Onboarding', 'New hire onboarding documents', 'employee', 'hrms_employees', 'employee_id', 'user-plus', '#8B5CF6', false, true),
('offboarding', 'Employee Offboarding', 'Employee exit and offboarding documents', 'employee', 'hrms_employees', 'employee_id', 'user-minus', '#6B7280', false, true),
('background_check', 'Background Checks', 'Background verification documents', 'background_check', 'hrms_background_checks', 'background_check_id', 'search', '#EC4899', false, true),
('performance', 'Performance Reviews', 'Performance review supporting documents', 'performance', 'hrms_performance_reports', 'report_id', 'chart-bar', '#14B8A6', false, true);
```

---

### 2.2 hrms_checklist_templates (Universal Checklist Templates)
Master templates linked to admin-defined checklist types.

```sql
CREATE TABLE hrms_checklist_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID REFERENCES businesses(business_id),
  
  template_name VARCHAR(255) NOT NULL,
  
  -- Link to Checklist Type (Dynamic, Admin-Defined)
  checklist_type_id UUID NOT NULL REFERENCES hrms_checklist_types(checklist_type_id),
  
  -- Optional: Employee Type (required if checklist_type.require_employee_type = true)
  employee_type VARCHAR(50), -- 'internal_india', 'internal_usa', 'it_usa', 'nonit_usa', 'healthcare_usa'
  
  description TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_employee_type CHECK (employee_type IS NULL OR employee_type IN ('internal_india', 'internal_usa', 'it_usa', 'nonit_usa', 'healthcare_usa'))
);

CREATE INDEX idx_hrms_checklist_templates_tenant ON hrms_checklist_templates(tenant_id);
CREATE INDEX idx_hrms_checklist_templates_type ON hrms_checklist_templates(checklist_type_id);
CREATE INDEX idx_hrms_checklist_templates_employee_type ON hrms_checklist_templates(employee_type);
CREATE INDEX idx_hrms_checklist_templates_active ON hrms_checklist_templates(is_active) WHERE is_active = true;

-- Examples:
-- Immigration Checklist for IT USA: template_name='IT USA Immigration', checklist_type_id=(immigration), employee_type='it_usa'
-- Project Checklist: template_name='Project Documents', checklist_type_id=(project), employee_type=NULL
-- Custom Checklist: template_name='Client Onboarding', checklist_type_id=(custom_type), employee_type=NULL
```

---

### 2.3 hrms_checklist_groups (Document Groups)
Grouping mechanism for organizing checklist items (e.g., Educational Documents, Immigration Documents).

```sql
CREATE TABLE hrms_checklist_groups (
  group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  template_id UUID NOT NULL REFERENCES hrms_checklist_templates(template_id) ON DELETE CASCADE,
  
  group_name VARCHAR(255) NOT NULL,
  group_description TEXT,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_checklist_groups_template ON hrms_checklist_groups(template_id);
```

---

### 2.5 hrms_checklist_items (Checklist Item Definitions)
Individual checklist items within groups (e.g., Bachelor's Degree, Master's Degree, H1B Copy, BLS License).

```sql
CREATE TABLE hrms_checklist_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  template_id UUID NOT NULL REFERENCES hrms_checklist_templates(template_id) ON DELETE CASCADE,
  group_id UUID REFERENCES hrms_checklist_groups(group_id) ON DELETE SET NULL,
  
  item_name VARCHAR(255),  -- Optional as per requirements
  item_description TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Flags
  is_required BOOLEAN DEFAULT false,
  compliance_tracking_flag BOOLEAN DEFAULT false,
  visible_to_employee_flag BOOLEAN DEFAULT true,
  
  -- AI Document Parsing
  enable_ai_parsing BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_checklist_items_template ON hrms_checklist_items(template_id);
CREATE INDEX idx_hrms_checklist_items_group ON hrms_checklist_items(group_id);
CREATE INDEX idx_hrms_checklist_items_compliance ON hrms_checklist_items(compliance_tracking_flag) WHERE compliance_tracking_flag = true;
```

---

### 2.6 hrms_documents (Universal Document Storage)
**GENERALIZED:** Stores ALL documents (employee, project, timesheet, compliance) with version history and AI-parsed metadata.

```sql
CREATE TABLE hrms_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID REFERENCES businesses(business_id),
  
  -- Universal Context References (polymorphic)
  entity_type VARCHAR(50) NOT NULL, -- 'employee', 'project', 'timesheet', 'compliance', 'system'
  entity_id UUID NOT NULL, -- References employee_id, project_id, timesheet_id, etc.
  
  -- Checklist Association
  checklist_item_id UUID REFERENCES hrms_checklist_items(item_id),
  
  -- Document Info
  document_name VARCHAR(255) NOT NULL,
  document_description TEXT,
  document_type VARCHAR(100), -- 'passport', 'visa', 'i9', 'w4', 'h1b', 'license', 'bls', 'degree', 'msa', 'po', 'coi', 'timesheet', etc.
  
  -- File Storage
  file_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(100),
  size_bytes BIGINT,
  
  -- Validity Dates (AI-parsed or manually entered)
  start_date DATE,
  expiry_date DATE,
  
  -- Flags
  compliance_tracking_flag BOOLEAN DEFAULT false,
  visible_to_employee_flag BOOLEAN DEFAULT true,
  is_current_version BOOLEAN DEFAULT true,
  
  -- AI Parsing Results (OpenRouter Claude)
  ai_parsed_data JSONB,
  ai_parsed_at TIMESTAMPTZ,
  ai_confidence_score DECIMAL(3,2),
  ai_model_used VARCHAR(100),
  
  -- Version Control
  version_number INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES hrms_documents(document_id),
  
  -- Additional Metadata (JSONB for flexibility)
  metadata JSONB, -- Can store document_number, receipt_number, policy_number, etc.
  
  -- Status
  document_status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'superseded', 'archived'
  
  -- Audit
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_expiry_date CHECK (expiry_date IS NULL OR expiry_date >= start_date),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('employee', 'project', 'timesheet', 'compliance', 'system'))
);

CREATE INDEX idx_hrms_docs_entity ON hrms_documents(entity_type, entity_id);
CREATE INDEX idx_hrms_docs_checklist ON hrms_documents(checklist_item_id);
CREATE INDEX idx_hrms_docs_type ON hrms_documents(document_type);
CREATE INDEX idx_hrms_docs_expiry ON hrms_documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_hrms_docs_compliance ON hrms_documents(compliance_tracking_flag, expiry_date) WHERE compliance_tracking_flag = true;
CREATE INDEX idx_hrms_docs_current ON hrms_documents(is_current_version) WHERE is_current_version = true;

-- Usage Examples:
-- Employee Immigration Doc: entity_type='employee', entity_id=employee_id, document_type='h1b'
-- Project MSA: entity_type='project', entity_id=project_id, document_type='msa'
-- Project PO: entity_type='project', entity_id=project_id, document_type='po'
-- Project COI: entity_type='project', entity_id=project_id, document_type='coi'
-- Timesheet Attachment: entity_type='timesheet', entity_id=timesheet_id, document_type='timesheet'
```

---

## 3. CLIENTS & VENDORS MASTER TABLES

**Note:** These tables are synced with Staffing-Accounting system for unified client/vendor management across HRMS, CRM, and Accounting.

### 3.1 Clients (Managed in CRM)

**Clients are stored in the CRM `clients` table** - not duplicated in HRMS. This ensures a single source of truth across all systems.

**CRM Clients Table Location:** `Staffing-CRM/clients`

**Key Fields (managed in CRM, referenced by HRMS):**
- `client_id UUID` - Primary key
- `tenant_id`, `business_id` - Multi-tenancy
- `client_name`, `client_code`, `client_type`
- Address fields, primary contact fields
- `payment_terms_days` - For Accounting integration

**Client Contacts:**
- Client contacts are stored as CRM `contacts` with `contact_type = 'Client Empanelment'`
- Links to client via `client_id` foreign key

**Vendor-to-Client Auto-Sync (Important):**
When a vendor is identified as **"next to client"** (vendor_level = 1, working directly with end client):
1. Vendor company info is copied to CRM `clients` table
2. Vendor contacts are copied to CRM `contacts` with `contact_type = 'Client Empanelment'`
3. This creates a unified view of all client relationships in CRM

See [STAFFING_CRM_TO_HRMS_BRIDGE_DOCUMENTATION.md](../STAFFING_CRM_TO_HRMS_BRIDGE_DOCUMENTATION.md) for sync details.

---

### 3.2 hrms_vendors (Vendor Master Data) ⭐ NEW
**Staffing vendors/intermediaries for C2C arrangements. Synced with Accounting system.**

```sql
CREATE TABLE hrms_vendors (
  vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  
  -- Vendor Identification
  vendor_name VARCHAR(255) NOT NULL,
  vendor_code VARCHAR(50) NOT NULL, -- Short code (e.g., 'TCS', 'INFO')
  vendor_type VARCHAR(50) DEFAULT 'primary', -- 'primary', 'secondary', 'implementation_partner'
  
  -- Tax & Legal
  ein VARCHAR(20), -- Employer Identification Number
  
  -- Address (denormalized for sync with Accounting)
  address_line_1 VARCHAR(255),
  address_line_2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  
  -- Primary Contact
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  primary_contact_phone VARCHAR(20),
  
  -- Accounts Payable Contact
  accounts_payable_email VARCHAR(255),
  
  -- Payment Terms (from Accounting)
  payment_terms_days INTEGER DEFAULT 30, -- Payment terms we give vendor
  receives_payment_terms_days INTEGER DEFAULT 45, -- Terms vendor gives us
  invoice_frequency VARCHAR(20) DEFAULT 'bi_weekly', -- 'weekly', 'bi_weekly', 'semi_monthly', 'monthly'
  
  -- Default Rates (can be overridden at project level)
  default_markup_percentage NUMERIC(5,2),
  default_bill_rate NUMERIC(10,2),
  default_ot_bill_rate NUMERIC(10,2),
  default_holiday_bill_rate NUMERIC(10,2),
  default_holiday_ot_bill_rate NUMERIC(10,2),
  
  -- Discount Thresholds
  tenure_discount_percentage NUMERIC(5,2),
  tenure_discount_threshold_months INTEGER,
  volume_discount_percentage NUMERIC(5,2),
  volume_discount_threshold_hours NUMERIC(10,2),
  
  -- Notes & Status
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT hrms_vendors_unique_code UNIQUE(tenant_id, business_id, vendor_code),
  CONSTRAINT hrms_vendors_valid_frequency CHECK (invoice_frequency IN ('weekly', 'bi_weekly', 'semi_monthly', 'monthly'))
);

CREATE INDEX idx_hrms_vendors_tenant ON hrms_vendors(tenant_id);
CREATE INDEX idx_hrms_vendors_business ON hrms_vendors(tenant_id, business_id);
CREATE INDEX idx_hrms_vendors_name ON hrms_vendors(vendor_name);
CREATE INDEX idx_hrms_vendors_code ON hrms_vendors(vendor_code);
CREATE INDEX idx_hrms_vendors_active ON hrms_vendors(tenant_id, business_id, is_active) WHERE is_active = true;
CREATE INDEX idx_hrms_vendors_type ON hrms_vendors(vendor_type);
```

**Vendor Types:**
- `primary`: Primary/direct vendor in the chain
- `secondary`: Secondary vendor (vendor's vendor)
- `implementation_partner`: Implementation/service partner

**Relationship to hrms_project_vendors:**
- `hrms_vendors` = Master vendor data (company info, default rates, contacts)
- `hrms_project_vendors` = Project-specific vendor assignments (which vendors are involved in which project, at which level, with project-specific overrides)

---

## 4. PROJECT MANAGEMENT TABLES

### 4.1 hrms_projects (Employee Projects)
Projects with complex vendor chains and LCA tracking.

```sql
CREATE TABLE hrms_projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID REFERENCES businesses(business_id),
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Project Details
  project_name VARCHAR(255) NOT NULL,
  project_code VARCHAR(100),
  
  -- Client Information (linked to CRM clients table)
  client_id UUID REFERENCES clients(client_id), -- Link to CRM clients master table
  end_client_name VARCHAR(255) NOT NULL, -- Denormalized for quick access
  end_client_manager_name VARCHAR(255),
  end_client_manager_email VARCHAR(255),
  end_client_manager_phone VARCHAR(50),
  end_client_manager_linkedin VARCHAR(255),
  
  -- Location
  work_location_type VARCHAR(50), -- 'onsite', 'hybrid', 'remote'
  physical_location_city_id UUID REFERENCES cities(city_id),
  physical_location_state_id UUID REFERENCES states(state_id),
  physical_location_country_id UUID REFERENCES countries(country_id),
  
  -- Rates & Financials (Current/Latest - See hrms_project_rate_history for full history)
  actual_client_bill_rate DECIMAL(10,2),
  informed_rate_to_candidate DECIMAL(10,2),
  candidate_percentage DECIMAL(5,2), -- 80%, 70%, etc.
  rate_paid_to_candidate DECIMAL(10,2),
  lca_rate DECIMAL(10,2),
  vms_charges DECIMAL(10,2),
  
  -- NOTE: Rate changes are tracked in hrms_project_rate_history with effective dates
  -- These fields store CURRENT rates for quick access
  
  -- Tenure Discounts (5 levels)
  tenure_discount_1 DECIMAL(5,2),
  tenure_discount_1_period VARCHAR(50),
  tenure_discount_2 DECIMAL(5,2),
  tenure_discount_2_period VARCHAR(50),
  tenure_discount_3 DECIMAL(5,2),
  tenure_discount_3_period VARCHAR(50),
  tenure_discount_4 DECIMAL(5,2),
  tenure_discount_4_period VARCHAR(50),
  tenure_discount_5 DECIMAL(5,2),
  tenure_discount_5_period VARCHAR(50),
  current_applicable_tenure_discount DECIMAL(5,2),
  
  -- Volume Discounts (3 levels)
  volume_discount_1 DECIMAL(5,2),
  volume_discount_1_period VARCHAR(50),
  volume_discount_2 DECIMAL(5,2),
  volume_discount_2_period VARCHAR(50),
  volume_discount_3 DECIMAL(5,2),
  volume_discount_3_period VARCHAR(50),
  current_applicable_volume_discount DECIMAL(5,2),
  
  -- LCA Project Flag
  is_lca_project BOOLEAN DEFAULT false,
  public_access_folder_url TEXT,
  
  -- Dates
  project_start_date DATE,
  project_end_date DATE,
  
  -- Status
  project_status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'on_hold', 'cancelled'
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_hrms_projects_employee ON hrms_projects(employee_id);
CREATE INDEX idx_hrms_projects_client ON hrms_projects(client_id);
CREATE INDEX idx_hrms_projects_status ON hrms_projects(project_status);
CREATE INDEX idx_hrms_projects_lca ON hrms_projects(is_lca_project) WHERE is_lca_project = true;
CREATE INDEX idx_hrms_projects_dates ON hrms_projects(project_start_date, project_end_date);
```

---

### 4.2 hrms_project_rate_history (Rate Change History) ⭐ NEW
**Tracks rate changes over time within the same project with effective dates.**

```sql
CREATE TABLE hrms_project_rate_history (
  rate_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID REFERENCES businesses(business_id),
  project_id UUID NOT NULL REFERENCES hrms_projects(project_id) ON DELETE CASCADE,
  
  -- Rate Details
  actual_client_bill_rate DECIMAL(10,2) NOT NULL,
  informed_rate_to_candidate DECIMAL(10,2),
  candidate_percentage DECIMAL(5,2),
  rate_paid_to_candidate DECIMAL(10,2),
  lca_rate DECIMAL(10,2),
  vms_charges DECIMAL(10,2),
  
  -- Tenure Discounts (5 levels)
  tenure_discount_1 DECIMAL(5,2),
  tenure_discount_1_period VARCHAR(50),
  tenure_discount_2 DECIMAL(5,2),
  tenure_discount_2_period VARCHAR(50),
  tenure_discount_3 DECIMAL(5,2),
  tenure_discount_3_period VARCHAR(50),
  tenure_discount_4 DECIMAL(5,2),
  tenure_discount_4_period VARCHAR(50),
  tenure_discount_5 DECIMAL(5,2),
  tenure_discount_5_period VARCHAR(50),
  current_applicable_tenure_discount DECIMAL(5,2),
  
  -- Volume Discounts (3 levels)
  volume_discount_1 DECIMAL(5,2),
  volume_discount_1_period VARCHAR(50),
  volume_discount_2 DECIMAL(5,2),
  volume_discount_2_period VARCHAR(50),
  volume_discount_3 DECIMAL(5,2),
  volume_discount_3_period VARCHAR(50),
  current_applicable_volume_discount DECIMAL(5,2),
  
  -- Effective Date Range
  effective_from_date DATE NOT NULL,
  effective_to_date DATE, -- NULL means currently active
  
  -- Change Reason
  change_reason TEXT, -- 'initial_rate', 'client_reduction', 'client_increase', 'discount_applied', 'amendment', etc.
  change_notes TEXT,
  
  -- Status
  is_current_rate BOOLEAN DEFAULT false, -- Only one record per project should be true
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_effective_date_range CHECK (effective_to_date IS NULL OR effective_to_date >= effective_from_date),
  CONSTRAINT no_overlapping_dates EXCLUDE USING gist (
    project_id WITH =,
    daterange(effective_from_date, COALESCE(effective_to_date, 'infinity'::date), '[]') WITH &&
  )
);

CREATE INDEX idx_hrms_rate_history_project ON hrms_project_rate_history(project_id);
CREATE INDEX idx_hrms_rate_history_effective ON hrms_project_rate_history(effective_from_date, effective_to_date);
CREATE INDEX idx_hrms_rate_history_current ON hrms_project_rate_history(is_current_rate) WHERE is_current_rate = true;
CREATE INDEX idx_hrms_rate_history_tenant ON hrms_project_rate_history(tenant_id);

-- Trigger to maintain is_current_rate flag
CREATE OR REPLACE FUNCTION fn_update_current_rate()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new rate is inserted or updated with NULL effective_to_date
  IF NEW.effective_to_date IS NULL THEN
    -- Mark all other rates for this project as not current
    UPDATE hrms_project_rate_history
    SET is_current_rate = false
    WHERE project_id = NEW.project_id
      AND rate_history_id != NEW.rate_history_id;
    
    -- Mark this rate as current
    NEW.is_current_rate := true;
  ELSE
    -- If effective_to_date is set, this is not current
    NEW.is_current_rate := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_current_rate
BEFORE INSERT OR UPDATE ON hrms_project_rate_history
FOR EACH ROW
EXECUTE FUNCTION fn_update_current_rate();
```

**Usage Examples:**

```sql
-- Initial rate when project starts
INSERT INTO hrms_project_rate_history (
  project_id, actual_client_bill_rate, effective_from_date, change_reason
) VALUES (
  'project-uuid', 85.00, '2025-01-01', 'initial_rate'
);
-- Result: effective_from_date='2025-01-01', effective_to_date=NULL, is_current_rate=true

-- Client reduces rate effective March 1st
INSERT INTO hrms_project_rate_history (
  project_id, actual_client_bill_rate, effective_from_date, change_reason, change_notes
) VALUES (
  'project-uuid', 78.00, '2025-03-01', 'client_reduction', 'Client budget cuts'
);
-- Trigger automatically:
-- 1. Sets old rate: effective_to_date='2025-02-28', is_current_rate=false
-- 2. Sets new rate: effective_to_date=NULL, is_current_rate=true

-- Get current rate for a project
SELECT * FROM hrms_project_rate_history
WHERE project_id = 'project-uuid'
  AND is_current_rate = true;

-- Get rate effective on specific date
SELECT * FROM hrms_project_rate_history
WHERE project_id = 'project-uuid'
  AND effective_from_date <= '2025-02-15'
  AND (effective_to_date IS NULL OR effective_to_date >= '2025-02-15');

-- Get full rate history for a project
SELECT 
  effective_from_date,
  effective_to_date,
  actual_client_bill_rate,
  rate_paid_to_candidate,
  change_reason,
  change_notes
FROM hrms_project_rate_history
WHERE project_id = 'project-uuid'
ORDER BY effective_from_date DESC;
```

---

### 4.3 hrms_project_vendors (Vendor Chain)
Supports up to 10 vendors in the chain from employee to end client.

**Vendor-to-Client Auto-Sync:**
When `vendor_level = 1` (vendor working directly with end client), the system automatically:
1. Copies vendor company info to CRM `clients` table (if not already exists)
2. Copies vendor contacts to CRM `contacts` with `contact_type = 'Client Empanelment'`
3. Sets `is_direct_to_client = true` flag on the vendor entry

```sql
CREATE TABLE hrms_project_vendors (
  vendor_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  project_id UUID NOT NULL REFERENCES hrms_projects(project_id) ON DELETE CASCADE,
  
  -- Vendor Details
  vendor_level INTEGER NOT NULL CHECK (vendor_level BETWEEN 1 AND 10),
  vendor_name VARCHAR(255) NOT NULL,
  hrms_vendor_id UUID REFERENCES hrms_vendors(vendor_id), -- Link to hrms_vendors master table
  is_direct_to_client BOOLEAN DEFAULT false, -- TRUE if vendor_level=1 (next to client), triggers CRM sync
  
  -- Vendor Contacts (can override master data for project-specific contacts)
  vendor_ceo_name VARCHAR(255),
  vendor_ceo_email VARCHAR(255),
  vendor_ceo_phone VARCHAR(50),
  
  vendor_hr_name VARCHAR(255),
  vendor_hr_email VARCHAR(255),
  vendor_hr_phone VARCHAR(50),
  
  vendor_finance_name VARCHAR(255),
  vendor_finance_email VARCHAR(255),
  vendor_finance_phone VARCHAR(50),
  
  vendor_invoicing_name VARCHAR(255),
  vendor_invoicing_email VARCHAR(255),
  vendor_invoicing_phone VARCHAR(50),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_project_vendor_level UNIQUE(project_id, vendor_level)
);

CREATE INDEX idx_hrms_project_vendors_project ON hrms_project_vendors(project_id);
CREATE INDEX idx_hrms_project_vendors_vendor ON hrms_project_vendors(hrms_vendor_id);
CREATE INDEX idx_hrms_project_vendors_level ON hrms_project_vendors(vendor_level);
```

---

### 4.4 Project Documents via Universal Checklist System

**MSA, PO, and COI documents are now managed through the universal checklist system:**

**Setup Process:**
1. Create checklist template: `checklist_type='msa_po'` or `checklist_type='coi'`
2. Add checklist items: "Master Service Agreement", "Purchase Order", "Certificate of Insurance"
3. Associate documents via `hrms_documents` table with `entity_type='project'`

**Advantages:**
- Unified document management interface
- AI parsing for all project documents
- Automatic compliance tracking
- Version control for MSA/PO/COI renewals
- Flexible metadata storage (document numbers, policy numbers)

**Query Example for Project MSAs:**
```sql
SELECT d.*
FROM hrms_documents d
JOIN hrms_checklist_items ci ON d.checklist_item_id = ci.item_id
JOIN hrms_checklist_templates ct ON ci.template_id = ct.template_id
WHERE d.entity_type = 'project'
  AND d.entity_id = :project_id
  AND ct.checklist_type = 'msa_po'
  AND d.document_type = 'msa'
  AND d.is_current_version = true;
```

---

## 4. TIMESHEET SYSTEM

### 4.1 hrms_timesheets (Employee Time Tracking)

```sql
CREATE TABLE hrms_timesheets (
  timesheet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID REFERENCES businesses(business_id),
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES hrms_projects(project_id) ON DELETE CASCADE,
  
  -- Timesheet Period
  timesheet_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Hours
  total_hours_worked DECIMAL(10,2) NOT NULL DEFAULT 0,
  regular_hours DECIMAL(10,2) DEFAULT 0,
  overtime_hours DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  submission_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected'
  
  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_period CHECK (period_end_date >= period_start_date)
);

CREATE INDEX idx_hrms_timesheets_employee ON hrms_timesheets(employee_id);
CREATE INDEX idx_hrms_timesheets_project ON hrms_timesheets(project_id);
CREATE INDEX idx_hrms_timesheets_period ON hrms_timesheets(period_start_date, period_end_date);
CREATE INDEX idx_hrms_timesheets_status ON hrms_timesheets(submission_status);
```

---

### 4.2 hrms_timesheet_entries (Daily Time Entries)

```sql
CREATE TABLE hrms_timesheet_entries (
  entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id UUID NOT NULL REFERENCES hrms_timesheets(timesheet_id) ON DELETE CASCADE,
  
  work_date DATE NOT NULL,
  hours_worked DECIMAL(10,2) NOT NULL DEFAULT 0,
  task_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_timesheet_entries_timesheet ON hrms_timesheet_entries(timesheet_id);
CREATE INDEX idx_hrms_timesheet_entries_date ON hrms_timesheet_entries(work_date);
```

---

## 5. VISA & IMMIGRATION

### 5.1 hrms_visa_statuses (Employee Visa History)

```sql
CREATE TABLE hrms_visa_statuses (
  visa_status_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Visa Details
  visa_type_id INTEGER REFERENCES visa_status(id), -- Link to CRM visa_status lookup
  visa_type_name VARCHAR(100),
  
  -- H1B/Visa Specifics
  receipt_number VARCHAR(100),
  petition_number VARCHAR(100),
  case_number VARCHAR(100),
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  is_current BOOLEAN DEFAULT false,
  visa_status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'pending', 'cancelled'
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_visa_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_hrms_visa_statuses_employee ON hrms_visa_statuses(employee_id);
CREATE INDEX idx_hrms_visa_statuses_current ON hrms_visa_statuses(is_current) WHERE is_current = true;
CREATE INDEX idx_hrms_visa_statuses_expiry ON hrms_visa_statuses(end_date) WHERE visa_status = 'active';
```

---

### 5.2 hrms_dependents (Employee Dependents)

```sql
CREATE TABLE hrms_dependents (
  dependent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Dependent Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  relationship VARCHAR(50), -- 'spouse', 'child', 'parent', etc.
  date_of_birth DATE,
  
  -- Visa/Immigration
  visa_type VARCHAR(100),
  visa_status VARCHAR(50),
  visa_expiry_date DATE,
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_dependents_employee ON hrms_dependents(employee_id);
```

---

## 6. COMPLIANCE & REMINDERS

### 6.1 hrms_compliance_items (Compliance Tracking)

```sql
CREATE TABLE hrms_compliance_items (
  compliance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID REFERENCES businesses(business_id),
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Source Document
  document_id UUID REFERENCES hrms_employee_documents(document_id),
  project_id UUID REFERENCES hrms_projects(project_id),
  visa_status_id UUID REFERENCES hrms_visa_statuses(visa_status_id),
  
  -- Compliance Details
  compliance_type VARCHAR(100) NOT NULL, -- 'document_expiry', 'visa_renewal', 'i9_reverify', 'po_extension', 'amendment_required'
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Dates
  due_date DATE NOT NULL,
  completion_date DATE,
  
  -- Status
  compliance_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'overdue', 'waived'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Reminders
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_hrms_compliance_employee ON hrms_compliance_items(employee_id);
CREATE INDEX idx_hrms_compliance_status ON hrms_compliance_items(compliance_status);
CREATE INDEX idx_hrms_compliance_due_date ON hrms_compliance_items(due_date) WHERE compliance_status IN ('pending', 'overdue');
CREATE INDEX idx_hrms_compliance_type ON hrms_compliance_items(compliance_type);
```

---

### 6.2 hrms_compliance_reminders (Reminder Configuration)

```sql
CREATE TABLE hrms_compliance_reminders (
  reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  compliance_id UUID NOT NULL REFERENCES hrms_compliance_items(compliance_id) ON DELETE CASCADE,
  
  -- Reminder Schedule
  remind_before_days INTEGER NOT NULL, -- Days before due date
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  
  -- Recipients
  recipient_emails TEXT[], -- Array of email addresses
  recipient_user_ids UUID[], -- Array of user IDs
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_compliance_reminders_compliance ON hrms_compliance_reminders(compliance_id);
CREATE INDEX idx_hrms_compliance_reminders_pending ON hrms_compliance_reminders(reminder_sent) WHERE reminder_sent = false;
```

---

## 7. ADDITIONAL EMPLOYEE TABLES

### 7.1 hrms_employee_resumes (Multiple Resumes)

```sql
CREATE TABLE hrms_employee_resumes (
  resume_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  resume_title VARCHAR(255),
  technology_focus VARCHAR(255), -- 'Java', '.NET', 'React', 'Nursing', etc.
  
  -- File Storage
  file_path TEXT NOT NULL,
  file_name VARCHAR(255),
  content_type VARCHAR(100),
  size_bytes BIGINT,
  
  -- Temporal
  version_date DATE,
  is_current BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_hrms_resumes_employee ON hrms_employee_resumes(employee_id);
CREATE INDEX idx_hrms_resumes_current ON hrms_employee_resumes(is_current) WHERE is_current = true;
```

---

### 7.2 hrms_background_checks (Background Verification)

```sql
CREATE TABLE hrms_background_checks (
  background_check_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Verification Company
  verification_company_name VARCHAR(255),
  verification_company_contact VARCHAR(255),
  
  -- Check Details
  check_type VARCHAR(100), -- 'criminal', 'employment', 'education', 'credit', etc.
  check_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  
  -- Dates
  initiated_date DATE,
  completion_date DATE,
  
  -- Results
  result VARCHAR(50), -- 'clear', 'discrepancy', 'issue_found'
  notes TEXT,
  
  -- File Storage
  file_path TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_background_checks_employee ON hrms_background_checks(employee_id);
CREATE INDEX idx_hrms_background_checks_status ON hrms_background_checks(check_status);
```

---

### 7.3 hrms_performance_reports (Performance Reviews)

```sql
CREATE TABLE hrms_performance_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID REFERENCES businesses(business_id),
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Review Details
  review_period_start DATE,
  review_period_end DATE,
  review_year INTEGER,
  
  -- Ratings
  overall_rating DECIMAL(3,2), -- e.g., 4.5 out of 5
  rating_scale VARCHAR(50), -- '1-5', '1-10', 'A-F', etc.
  
  -- Content
  strengths TEXT,
  areas_for_improvement TEXT,
  goals_next_period TEXT,
  reviewer_comments TEXT,
  employee_comments TEXT,
  
  -- Status
  review_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'acknowledged'
  
  -- File Storage
  file_path TEXT,
  
  -- Reviewer
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_performance_employee ON hrms_performance_reports(employee_id);
CREATE INDEX idx_hrms_performance_year ON hrms_performance_reports(review_year);
```

---

## 7.5 EMPLOYEE TICKETS SYSTEM

### 7.5.1 hrms_tickets (Employee Support Tickets)
Main table for tracking employee support requests/tickets.

**Ticket Number Format:** `<business_short_name>TKT<sequence>` (e.g., `IESTKT0042` for Intuites LLC)
- Business short_name is sourced from `businesses.short_name`
- Sequence is auto-incremented per business using `hrms_ticket_sequences` table
- Format: 3-5 char prefix + "TKT" + 4-digit zero-padded number

```sql
CREATE TABLE hrms_tickets (
  ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID NOT NULL REFERENCES businesses(business_id),
  
  -- Ticket Number (auto-generated, format: <short_name>TKT<seq>, e.g., IESTKT0042)
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Employee (who submitted)
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id),
  
  -- Ticket Classification
  department VARCHAR(50) NOT NULL, -- 'HR', 'Immigration'
  request_type VARCHAR(100) NOT NULL, -- 'offer_letter', 'gc_processing', 'payroll_discrepancy', etc.
  
  -- Ticket Content
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Assignment
  assigned_team VARCHAR(50) NOT NULL, -- 'HR_Team', 'Immigration_Team'
  assigned_to UUID REFERENCES auth.users(id), -- Specific team member assigned
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  
  -- Status
  status VARCHAR(50) DEFAULT 'ticket_created',
  -- Status values:
  -- 'ticket_created', 'in_team_review', 'need_leadership_discussion',
  -- 'need_attorney_discussion', 'need_team_discussion',
  -- 'sent_to_candidate_review', 'closed', 'auto_closed'
  
  -- Timestamps
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  auto_close_reminder_sent_at TIMESTAMPTZ,
  auto_close_warning_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_department CHECK (department IN ('HR', 'Immigration')),
  CONSTRAINT valid_assigned_team CHECK (assigned_team IN ('HR_Team', 'Immigration_Team')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (status IN (
    'ticket_created', 'in_team_review', 'need_leadership_discussion',
    'need_attorney_discussion', 'need_team_discussion',
    'sent_to_candidate_review', 'closed', 'auto_closed'
  ))
);

CREATE INDEX idx_hrms_tickets_tenant ON hrms_tickets(tenant_id);
CREATE INDEX idx_hrms_tickets_business ON hrms_tickets(business_id);
CREATE INDEX idx_hrms_tickets_employee ON hrms_tickets(employee_id);
CREATE INDEX idx_hrms_tickets_assigned_team ON hrms_tickets(assigned_team);
CREATE INDEX idx_hrms_tickets_status ON hrms_tickets(status);
CREATE INDEX idx_hrms_tickets_department ON hrms_tickets(department);
CREATE INDEX idx_hrms_tickets_number ON hrms_tickets(ticket_number);
CREATE INDEX idx_hrms_tickets_created ON hrms_tickets(created_at DESC);

-- Ticket Number Sequence Table
CREATE TABLE hrms_ticket_sequences (
  sequence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID NOT NULL REFERENCES businesses(business_id),
  next_sequence INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_business_ticket_sequence UNIQUE (business_id)
);

-- Function to generate next ticket number
-- Format: <business_short_name>TKT<4-digit-seq> (e.g., IESTKT0042)
CREATE OR REPLACE FUNCTION fn_generate_ticket_number(p_business_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_short_name VARCHAR(10);
  v_tenant_id UUID;
  v_next_seq INTEGER;
  v_ticket_number VARCHAR(50);
BEGIN
  -- Get business short_name and tenant_id
  SELECT short_name, tenant_id INTO v_short_name, v_tenant_id
  FROM businesses
  WHERE business_id = p_business_id;
  
  IF v_short_name IS NULL THEN
    RAISE EXCEPTION 'Business short_name not found for business_id %', p_business_id;
  END IF;
  
  -- Get and increment sequence (with lock)
  INSERT INTO hrms_ticket_sequences (tenant_id, business_id, next_sequence)
  VALUES (v_tenant_id, p_business_id, 1)
  ON CONFLICT (business_id) 
  DO UPDATE SET 
    next_sequence = hrms_ticket_sequences.next_sequence + 1,
    updated_at = NOW()
  RETURNING next_sequence - 1 INTO v_next_seq;
  
  -- For new inserts, use 1
  IF v_next_seq IS NULL THEN
    v_next_seq := 1;
  END IF;
  
  -- Format: <short_name>TKT<4-digit-seq> (e.g., IESTKT0042)
  v_ticket_number := v_short_name || 'TKT' || LPAD(v_next_seq::TEXT, 4, '0');
  
  RETURN v_ticket_number;
END;
$$ LANGUAGE plpgsql;
```

---

### 7.5.2 hrms_ticket_comments (Ticket Comments/Messages)
Stores all comments, replies, and internal notes on tickets.

```sql
CREATE TABLE hrms_ticket_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  ticket_id UUID NOT NULL REFERENCES hrms_tickets(ticket_id) ON DELETE CASCADE,
  
  -- Comment Content
  comment_text TEXT NOT NULL,
  
  -- Comment Type
  is_internal_note BOOLEAN DEFAULT false, -- Internal notes not visible to employee
  is_system_generated BOOLEAN DEFAULT false, -- Auto-generated by system (status changes, etc.)
  
  -- Author
  author_type VARCHAR(50) NOT NULL, -- 'employee', 'team_member', 'system'
  author_user_id UUID REFERENCES auth.users(id),
  author_employee_id UUID REFERENCES hrms_employees(employee_id),
  author_display_name VARCHAR(255), -- Cached for display
  
  -- Email Notification
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_author_type CHECK (author_type IN ('employee', 'team_member', 'system'))
);

CREATE INDEX idx_hrms_ticket_comments_ticket ON hrms_ticket_comments(ticket_id);
CREATE INDEX idx_hrms_ticket_comments_created ON hrms_ticket_comments(created_at);
CREATE INDEX idx_hrms_ticket_comments_internal ON hrms_ticket_comments(is_internal_note);
```

---

### 7.5.3 hrms_ticket_attachments (Ticket File Attachments)
Stores attachments for tickets and comments.

```sql
CREATE TABLE hrms_ticket_attachments (
  attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  ticket_id UUID NOT NULL REFERENCES hrms_tickets(ticket_id) ON DELETE CASCADE,
  comment_id UUID REFERENCES hrms_ticket_comments(comment_id) ON DELETE CASCADE, -- NULL if attached to ticket directly
  
  -- File Info
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  content_type VARCHAR(100),
  file_size_bytes BIGINT,
  
  -- Upload Info
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_by_employee_id UUID REFERENCES hrms_employees(employee_id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_ticket_attachments_ticket ON hrms_ticket_attachments(ticket_id);
CREATE INDEX idx_hrms_ticket_attachments_comment ON hrms_ticket_attachments(comment_id);
```

---

### 7.5.4 hrms_ticket_status_history (Status Change Audit Trail)
Tracks all status changes for tickets.

```sql
CREATE TABLE hrms_ticket_status_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  ticket_id UUID NOT NULL REFERENCES hrms_tickets(ticket_id) ON DELETE CASCADE,
  
  -- Status Change
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  
  -- Change Details
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_name VARCHAR(255), -- Cached for display
  
  -- Email Notification
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_ticket_status_history_ticket ON hrms_ticket_status_history(ticket_id);
CREATE INDEX idx_hrms_ticket_status_history_created ON hrms_ticket_status_history(created_at);
```

---

### 7.5.5 hrms_ticket_request_types (Request Type Configuration)
Configurable request types per department.

```sql
CREATE TABLE hrms_ticket_request_types (
  request_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  
  -- Request Type Info
  type_code VARCHAR(100) NOT NULL, -- 'offer_letter', 'gc_processing', etc.
  type_name VARCHAR(255) NOT NULL, -- 'Offer Letter', 'GC Processing', etc.
  type_description TEXT,
  
  -- Department
  department VARCHAR(50) NOT NULL, -- 'HR' or 'Immigration'
  
  -- Display
  display_order INTEGER DEFAULT 0,
  icon VARCHAR(50),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system_type BOOLEAN DEFAULT false, -- System types cannot be deleted
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_department CHECK (department IN ('HR', 'Immigration')),
  CONSTRAINT unique_type_per_tenant_dept UNIQUE (tenant_id, department, type_code)
);

CREATE INDEX idx_hrms_ticket_request_types_tenant ON hrms_ticket_request_types(tenant_id);
CREATE INDEX idx_hrms_ticket_request_types_department ON hrms_ticket_request_types(department);
CREATE INDEX idx_hrms_ticket_request_types_active ON hrms_ticket_request_types(is_active) WHERE is_active = true;

-- Seed Default HR Request Types
INSERT INTO hrms_ticket_request_types (tenant_id, type_code, type_name, type_description, department, display_order, is_system_type) VALUES
('00000000-0000-0000-0000-000000000000', 'offer_letter', 'Offer Letter', 'Request for new/updated offer letter', 'HR', 1, true),
('00000000-0000-0000-0000-000000000000', 'employment_verification', 'Employment Verification', 'Letter for background check, mortgage, etc.', 'HR', 2, true),
('00000000-0000-0000-0000-000000000000', 'payroll_discrepancy', 'Payroll Discrepancy', 'Issue with pay, deductions, overtime', 'HR', 3, true),
('00000000-0000-0000-0000-000000000000', 'benefits_inquiry', 'Benefits Inquiry', 'Health insurance, 401k, PTO questions', 'HR', 4, true),
('00000000-0000-0000-0000-000000000000', 'leave_request', 'Leave Request', 'FMLA, personal leave, extended absence', 'HR', 5, true),
('00000000-0000-0000-0000-000000000000', 'tax_forms', 'Tax Forms', 'W2, W4 updates, tax withholding', 'HR', 6, true),
('00000000-0000-0000-0000-000000000000', 'address_change', 'Address Change', 'Update personal/mailing address', 'HR', 7, true),
('00000000-0000-0000-0000-000000000000', 'direct_deposit_change', 'Direct Deposit Change', 'Update bank account information', 'HR', 8, true),
('00000000-0000-0000-0000-000000000000', 'policy_clarification', 'Policy Clarification', 'Questions about company policies', 'HR', 9, true),
('00000000-0000-0000-0000-000000000000', 'other_hr', 'Other HR Request', 'General HR-related requests', 'HR', 99, true);

-- Seed Default Immigration Request Types
INSERT INTO hrms_ticket_request_types (tenant_id, type_code, type_name, type_description, department, display_order, is_system_type) VALUES
('00000000-0000-0000-0000-000000000000', 'gc_processing', 'GC Processing', 'Green Card application status/questions', 'Immigration', 1, true),
('00000000-0000-0000-0000-000000000000', 'h1b_transfer', 'H1B Transfer', 'H1B visa transfer inquiry', 'Immigration', 2, true),
('00000000-0000-0000-0000-000000000000', 'h1b_extension', 'H1B Extension', 'H1B extension filing request', 'Immigration', 3, true),
('00000000-0000-0000-0000-000000000000', 'h1b_amendment', 'H1B Amendment', 'H1B amendment for job/location change', 'Immigration', 4, true),
('00000000-0000-0000-0000-000000000000', 'i9_reverification', 'I-9 Reverification', 'I-9 document update/reverification', 'Immigration', 5, true),
('00000000-0000-0000-0000-000000000000', 'visa_stamping', 'Visa Stamping', 'Visa stamping appointment assistance', 'Immigration', 6, true),
('00000000-0000-0000-0000-000000000000', 'travel_authorization', 'Travel Authorization', 'AP/EAD travel document request', 'Immigration', 7, true),
('00000000-0000-0000-0000-000000000000', 'lca_questions', 'LCA Questions', 'Labor Condition Application inquiries', 'Immigration', 8, true),
('00000000-0000-0000-0000-000000000000', 'perm_processing', 'PERM Processing', 'PERM labor certification questions', 'Immigration', 9, true),
('00000000-0000-0000-0000-000000000000', 'dependent_visa', 'Dependent Visa', 'H4/L2 dependent visa questions', 'Immigration', 10, true),
('00000000-0000-0000-0000-000000000000', 'status_update', 'Status Update', 'General case status inquiry', 'Immigration', 11, true),
('00000000-0000-0000-0000-000000000000', 'other_immigration', 'Other Immigration', 'General immigration-related requests', 'Immigration', 99, true);
```

---

## 8. SYSTEM TABLES

### 8.1 hrms_notifications (System Notifications)

```sql
CREATE TABLE hrms_notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  
  -- Recipient
  user_id UUID REFERENCES auth.users(id),
  employee_id UUID REFERENCES hrms_employees(employee_id),
  
  -- Notification Details
  notification_type VARCHAR(100) NOT NULL, -- 'compliance_reminder', 'document_expiry', 'project_update', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related Records
  related_entity_type VARCHAR(100), -- 'compliance', 'document', 'project', etc.
  related_entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Action
  action_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_notifications_user ON hrms_notifications(user_id);
CREATE INDEX idx_hrms_notifications_employee ON hrms_notifications(employee_id);
CREATE INDEX idx_hrms_notifications_unread ON hrms_notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_hrms_notifications_type ON hrms_notifications(notification_type);
```

---

### 8.2 hrms_email_templates (Email Templates)

```sql
CREATE TABLE hrms_email_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  
  template_name VARCHAR(255) NOT NULL,
  template_key VARCHAR(100) UNIQUE NOT NULL, -- 'compliance_reminder', 'welcome_employee', etc.
  
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  -- Variables (JSON array of available placeholders)
  available_variables JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_hrms_email_templates_key ON hrms_email_templates(template_key);
```

---

### 8.3 hrms_newsletters (Newsletter Management)

```sql
CREATE TABLE hrms_newsletters (
  newsletter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID REFERENCES businesses(business_id),
  
  title VARCHAR(255) NOT NULL,
  content_html TEXT NOT NULL,
  content_text TEXT,
  
  -- Audience
  target_employee_types VARCHAR(50)[], -- Array of employee types
  target_employees UUID[], -- Specific employee IDs
  
  -- Scheduling
  scheduled_send_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Status
  newsletter_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'sent'
  
  -- Stats
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_hrms_newsletters_status ON hrms_newsletters(newsletter_status);
CREATE INDEX idx_hrms_newsletters_scheduled ON hrms_newsletters(scheduled_send_at);
```

---

### 8.4 hrms_suggestions (Ideas & Suggestions)

```sql
CREATE TABLE hrms_suggestions (
  suggestion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  
  -- Submitted By
  submitted_by_user_id UUID REFERENCES auth.users(id),
  submitted_by_employee_id UUID REFERENCES hrms_employees(employee_id),
  
  suggestion_type VARCHAR(50), -- 'feature', 'improvement', 'bug_report', 'feedback'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'under_review', 'approved', 'rejected', 'implemented'
  priority VARCHAR(20) DEFAULT 'medium',
  
  -- Admin Response
  admin_response TEXT,
  admin_user_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_suggestions_status ON hrms_suggestions(status);
CREATE INDEX idx_hrms_suggestions_type ON hrms_suggestions(suggestion_type);
```

---

### 8.5 hrms_issue_reports (Issue Tracking)

```sql
CREATE TABLE hrms_issue_reports (
  issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  
  -- Reported By
  reported_by_user_id UUID REFERENCES auth.users(id),
  reported_by_employee_id UUID REFERENCES hrms_employees(employee_id),
  
  issue_type VARCHAR(50), -- 'bug', 'error', 'access_issue', 'data_issue', 'other'
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  
  -- Environment
  browser VARCHAR(100),
  os VARCHAR(100),
  screenshot_paths TEXT[],
  
  -- Status
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed', 'wont_fix'
  
  -- Resolution
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_issues_status ON hrms_issue_reports(status);
CREATE INDEX idx_hrms_issues_severity ON hrms_issue_reports(severity);
```

---

### 8.6 hrms_ai_prompts (AI Prompts for Newsletter Generation)
Stores AI prompt templates for generating newsletters and other AI-assisted content.

```sql
CREATE TABLE hrms_ai_prompts (
  prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  business_id UUID REFERENCES businesses(business_id),
  
  -- Prompt Identification
  prompt_name VARCHAR(255) NOT NULL,
  prompt_key VARCHAR(100) NOT NULL, -- 'monthly_company_update', 'weekly_team_digest', etc.
  prompt_description TEXT,
  
  -- AI Configuration
  system_prompt TEXT NOT NULL, -- The actual AI system prompt
  ai_model VARCHAR(100) DEFAULT 'claude-3.5-sonnet', -- OpenRouter model identifier
  temperature DECIMAL(3,2) DEFAULT 0.7, -- 0.0 - 2.0
  max_tokens INTEGER DEFAULT 2000, -- Max response tokens
  
  -- Prompt Category
  prompt_category VARCHAR(50) DEFAULT 'newsletter', -- 'newsletter', 'email', 'document', 'other'
  
  -- Variables (JSONB array of available placeholders for user input)
  available_variables JSONB, -- e.g., [{"name": "company_name", "description": "Company Name", "required": true}]
  
  -- Usage Stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Status
  is_system_prompt BOOLEAN DEFAULT false, -- System prompts cannot be deleted
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_prompt_key_per_tenant UNIQUE (tenant_id, prompt_key),
  CONSTRAINT valid_temperature CHECK (temperature >= 0.0 AND temperature <= 2.0),
  CONSTRAINT valid_max_tokens CHECK (max_tokens >= 100 AND max_tokens <= 8000)
);

CREATE INDEX idx_hrms_ai_prompts_tenant ON hrms_ai_prompts(tenant_id);
CREATE INDEX idx_hrms_ai_prompts_key ON hrms_ai_prompts(prompt_key);
CREATE INDEX idx_hrms_ai_prompts_category ON hrms_ai_prompts(prompt_category);
CREATE INDEX idx_hrms_ai_prompts_active ON hrms_ai_prompts(is_active) WHERE is_active = true;

-- Seed Default System Prompts
INSERT INTO hrms_ai_prompts (tenant_id, prompt_name, prompt_key, prompt_description, system_prompt, prompt_category, is_system_prompt, available_variables) VALUES
(
  '00000000-0000-0000-0000-000000000000', -- Will be replaced per tenant on first use
  'Monthly Company Update',
  'monthly_company_update',
  'Generate a polished monthly newsletter for company-wide updates',
  'You are a professional corporate communications writer. Generate a polished, engaging monthly newsletter based on the provided topic and description. Use a friendly yet professional tone. Include an engaging introduction, clear sections with headers, and a warm closing. Format the output as clean HTML suitable for email.',
  'newsletter',
  true,
  '[{"name": "topic", "description": "Newsletter Topic/Theme", "required": true}, {"name": "key_points", "description": "Key Points to Cover", "required": true}, {"name": "company_name", "description": "Company Name", "required": false}]'
),
(
  '00000000-0000-0000-0000-000000000000',
  'Weekly Team Digest',
  'weekly_team_digest',
  'Generate a brief weekly summary for team communications',
  'You are a professional corporate communications writer. Create a concise weekly digest newsletter. Keep it brief and scannable. Use bullet points for updates. Include a quick summary at the top. Format as clean HTML.',
  'newsletter',
  true,
  '[{"name": "week_highlights", "description": "Week Highlights", "required": true}, {"name": "upcoming_events", "description": "Upcoming Events", "required": false}]'
),
(
  '00000000-0000-0000-0000-000000000000',
  'Holiday Announcement',
  'holiday_announcement',
  'Generate holiday schedule announcements',
  'You are a professional HR communications writer. Create a warm, festive holiday announcement newsletter. Include holiday schedule details, office closure information, and appropriate seasonal greetings. Format as clean HTML.',
  'newsletter',
  true,
  '[{"name": "holiday_name", "description": "Holiday Name", "required": true}, {"name": "closure_dates", "description": "Office Closure Dates", "required": true}]'
);
```

---

### 8.7 hrms_lca_job_titles (LCA Job Titles for H1B/L1 Compliance)
Stores LCA (Labor Condition Application) job titles with SOC codes and wage levels for visa compliance.

**Note:** This table is NOT linked to CRM and is NOT scoped by business_id. LCA job titles are standardized
by the Department of Labor (DOL) and apply across all businesses. Employees reference this during
project creation when `is_lca_project = true`.

```sql
CREATE TABLE hrms_lca_job_titles (
  lca_job_title_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  
  -- LCA Job Title Information
  lca_job_title VARCHAR(255) NOT NULL, -- The job title as used in LCA filing
  
  -- SOC Code (Standard Occupational Classification)
  soc_code VARCHAR(10) NOT NULL, -- Format: XX-XXXX (e.g., '15-1252')
  soc_title VARCHAR(255), -- Official SOC title (e.g., 'Software Developers')
  
  -- Wage Level (1-4: Entry → Fully Competent)
  wage_level INTEGER NOT NULL, -- 1 = Entry, 2 = Qualified, 3 = Experienced, 4 = Fully Competent
  wage_level_description VARCHAR(50), -- 'Level 1 - Entry', 'Level 2 - Qualified', etc.
  
  -- OES Wage Data Reference
  oes_wage_source_url TEXT, -- Link to OES wage data source for reference
  
  -- Notes
  description TEXT,
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_soc_code_format CHECK (soc_code ~ '^[0-9]{2}-[0-9]{4}$'),
  CONSTRAINT valid_wage_level CHECK (wage_level BETWEEN 1 AND 4),
  CONSTRAINT unique_lca_title_soc_level UNIQUE (tenant_id, lca_job_title, soc_code, wage_level)
);

CREATE INDEX idx_hrms_lca_job_titles_tenant ON hrms_lca_job_titles(tenant_id);
CREATE INDEX idx_hrms_lca_job_titles_soc ON hrms_lca_job_titles(soc_code);
CREATE INDEX idx_hrms_lca_job_titles_level ON hrms_lca_job_titles(wage_level);
CREATE INDEX idx_hrms_lca_job_titles_active ON hrms_lca_job_titles(is_active) WHERE is_active = true;
CREATE INDEX idx_hrms_lca_job_titles_search ON hrms_lca_job_titles USING gin(to_tsvector('english', lca_job_title || ' ' || COALESCE(soc_title, '')));

-- Common IT LCA Job Titles (Seed Data)
-- Note: Actual wage rates vary by metropolitan area - these are title/SOC mappings only
INSERT INTO hrms_lca_job_titles (tenant_id, lca_job_title, soc_code, soc_title, wage_level, wage_level_description) VALUES
-- Software Development
('00000000-0000-0000-0000-000000000000', 'Software Developer', '15-1252', 'Software Developers', 2, 'Level 2 - Qualified'),
('00000000-0000-0000-0000-000000000000', 'Senior Software Developer', '15-1252', 'Software Developers', 3, 'Level 3 - Experienced'),
('00000000-0000-0000-0000-000000000000', 'Lead Software Developer', '15-1252', 'Software Developers', 4, 'Level 4 - Fully Competent'),
('00000000-0000-0000-0000-000000000000', 'Software Engineer', '15-1252', 'Software Developers', 2, 'Level 2 - Qualified'),
('00000000-0000-0000-0000-000000000000', 'Senior Software Engineer', '15-1252', 'Software Developers', 3, 'Level 3 - Experienced'),

-- Systems Analysis
('00000000-0000-0000-0000-000000000000', 'Computer Systems Analyst', '15-1211', 'Computer Systems Analysts', 2, 'Level 2 - Qualified'),
('00000000-0000-0000-0000-000000000000', 'Senior Systems Analyst', '15-1211', 'Computer Systems Analysts', 3, 'Level 3 - Experienced'),
('00000000-0000-0000-0000-000000000000', 'Business Systems Analyst', '15-1211', 'Computer Systems Analysts', 2, 'Level 2 - Qualified'),

-- Database
('00000000-0000-0000-0000-000000000000', 'Database Administrator', '15-1242', 'Database Administrators and Architects', 2, 'Level 2 - Qualified'),
('00000000-0000-0000-0000-000000000000', 'Senior Database Administrator', '15-1242', 'Database Administrators and Architects', 3, 'Level 3 - Experienced'),
('00000000-0000-0000-0000-000000000000', 'Database Architect', '15-1242', 'Database Administrators and Architects', 4, 'Level 4 - Fully Competent'),

-- Network/Infrastructure
('00000000-0000-0000-0000-000000000000', 'Network Engineer', '15-1244', 'Network and Computer Systems Administrators', 2, 'Level 2 - Qualified'),
('00000000-0000-0000-0000-000000000000', 'Senior Network Engineer', '15-1244', 'Network and Computer Systems Administrators', 3, 'Level 3 - Experienced'),
('00000000-0000-0000-0000-000000000000', 'Systems Administrator', '15-1244', 'Network and Computer Systems Administrators', 2, 'Level 2 - Qualified'),

-- Security
('00000000-0000-0000-0000-000000000000', 'Information Security Analyst', '15-1212', 'Information Security Analysts', 2, 'Level 2 - Qualified'),
('00000000-0000-0000-0000-000000000000', 'Senior Security Analyst', '15-1212', 'Information Security Analysts', 3, 'Level 3 - Experienced'),
('00000000-0000-0000-0000-000000000000', 'Cybersecurity Engineer', '15-1212', 'Information Security Analysts', 3, 'Level 3 - Experienced'),

-- Data Science/Analytics
('00000000-0000-0000-0000-000000000000', 'Data Scientist', '15-2051', 'Data Scientists', 2, 'Level 2 - Qualified'),
('00000000-0000-0000-0000-000000000000', 'Senior Data Scientist', '15-2051', 'Data Scientists', 3, 'Level 3 - Experienced'),
('00000000-0000-0000-0000-000000000000', 'Data Analyst', '15-2051', 'Data Scientists', 2, 'Level 2 - Qualified'),
('00000000-0000-0000-0000-000000000000', 'Business Intelligence Analyst', '15-2051', 'Data Scientists', 2, 'Level 2 - Qualified'),

-- Management/Other
('00000000-0000-0000-0000-000000000000', 'IT Project Manager', '15-1299', 'Computer Occupations, All Other', 3, 'Level 3 - Experienced'),
('00000000-0000-0000-0000-000000000000', 'Technical Lead', '15-1299', 'Computer Occupations, All Other', 3, 'Level 3 - Experienced'),
('00000000-0000-0000-0000-000000000000', 'DevOps Engineer', '15-1299', 'Computer Occupations, All Other', 3, 'Level 3 - Experienced'),
('00000000-0000-0000-0000-000000000000', 'Cloud Engineer', '15-1299', 'Computer Occupations, All Other', 3, 'Level 3 - Experienced'),

-- QA/Testing
('00000000-0000-0000-0000-000000000000', 'QA Engineer', '15-1253', 'Software Quality Assurance Analysts and Testers', 2, 'Level 2 - Qualified'),
('00000000-0000-0000-0000-000000000000', 'Senior QA Engineer', '15-1253', 'Software Quality Assurance Analysts and Testers', 3, 'Level 3 - Experienced'),
('00000000-0000-0000-0000-000000000000', 'Test Automation Engineer', '15-1253', 'Software Quality Assurance Analysts and Testers', 3, 'Level 3 - Experienced');
```

---

## 9. CRM-HRMS BRIDGE

### 9.1 crm_hrms_contact_bridge (Cross-Database Link)
This table should be created in BOTH databases for bidirectional sync.

**Canonical Contract (Recommended):**
- Use the same table name **and** the same column set in both databases.
- Treat this as the single “source of truth” mapping between a CRM contact and an HRMS employee.

**Canonical columns (keep identical on both sides):**
- `bridge_id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `tenant_id UUID NOT NULL REFERENCES tenants(tenant_id)`
- `crm_contact_id UUID NOT NULL` (CRM contacts PK)
- `hrms_employee_id UUID NOT NULL` (HRMS employees PK)
- `sync_status VARCHAR(50) DEFAULT 'active'`
- `sync_date TIMESTAMPTZ DEFAULT NOW()`
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`

**Optional (only if you need it):**
- `business_id UUID` (include if your HRMS tables are business-scoped like CRM)

**In CRM Database:**
```sql
CREATE TABLE crm_hrms_contact_bridge (
  bridge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  
  -- Canonical IDs
  crm_contact_id UUID NOT NULL REFERENCES contacts(id),
  hrms_employee_id UUID NOT NULL,
  
  -- Sync Status
  sync_status VARCHAR(50) DEFAULT 'active',
  sync_date TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_crm_contact UNIQUE(crm_contact_id),
  CONSTRAINT unique_hrms_employee UNIQUE(hrms_employee_id)
);

-- Note: CRM cannot enforce a FK to HRMS if CRM and HRMS are separate databases.
-- Keep `hrms_employee_id` as a UUID and validate existence via an integration job / Edge Function.
```

**In HRMS Database (mirror for quick lookup):**
```sql
CREATE TABLE crm_hrms_contact_bridge (
  bridge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id),
  
  -- Canonical IDs
  crm_contact_id UUID NOT NULL,
  hrms_employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id),
  
  sync_status VARCHAR(50) DEFAULT 'active',
  sync_date TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_crm_contact UNIQUE(crm_contact_id),
  CONSTRAINT unique_hrms_employee UNIQUE(hrms_employee_id)
);

-- Note: HRMS cannot enforce a FK to CRM's contacts table if CRM is a separate database.
-- Keep `crm_contact_id` as a UUID and validate existence via an integration job / Edge Function.
```

---

## 10. ROW LEVEL SECURITY (RLS)

All tables must have RLS enabled with tenant isolation:

```sql
-- Example for hrms_employees
ALTER TABLE hrms_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON hrms_employees
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY tenant_insert_policy ON hrms_employees
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY tenant_update_policy ON hrms_employees
  FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY tenant_delete_policy ON hrms_employees
  FOR DELETE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

**Apply similar RLS policies to ALL hrms_* tables.**

---

## 11. DATABASE FUNCTIONS & TRIGGERS

### 11.1 Auto-create Compliance Items

```sql
CREATE OR REPLACE FUNCTION fn_create_compliance_from_document()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.expiry_date IS NOT NULL OR NEW.compliance_tracking_flag = true) AND NEW.document_status = 'active' THEN
    INSERT INTO hrms_compliance_items (
      tenant_id,
      business_id,
      employee_id,
      document_id,
      compliance_type,
      item_name,
      description,
      due_date,
      priority
    ) VALUES (
      NEW.tenant_id,
      NEW.business_id,
      NEW.employee_id,
      NEW.document_id,
      'document_expiry',
      NEW.document_name || ' - Renewal Required',
      'Document ' || NEW.document_name || ' is expiring soon',
      COALESCE(NEW.expiry_date - INTERVAL '30 days', CURRENT_DATE + INTERVAL '90 days'),
      CASE 
        WHEN NEW.expiry_date IS NULL THEN 'medium'
        WHEN NEW.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
        WHEN NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'high'
        ELSE 'medium'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_compliance_from_document
  AFTER INSERT ON hrms_employee_documents
  FOR EACH ROW
  EXECUTE FUNCTION fn_create_compliance_from_document();
```

---

### 11.2 Update Timestamps

```sql
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER trg_update_timestamp
  BEFORE UPDATE ON hrms_employees
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_timestamp();

-- Repeat for other tables...
```

---

### 11.3 Trigger Amendment Required Alert

```sql
CREATE OR REPLACE FUNCTION fn_check_project_amendment_required()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_visa_status VARCHAR(50);
  v_existing_lca_project_count INTEGER;
BEGIN
  -- Check if employee is on visa
  SELECT visa_status INTO v_employee_visa_status
  FROM hrms_visa_statuses
  WHERE employee_id = NEW.employee_id AND is_current = true
  LIMIT 1;
  
  -- If on visa and this is a new LCA project
  IF v_employee_visa_status IN ('H1B', 'L1') AND NEW.is_lca_project = true THEN
    -- Check if employee already has an active LCA project
    SELECT COUNT(*) INTO v_existing_lca_project_count
    FROM hrms_projects
    WHERE employee_id = NEW.employee_id 
      AND is_lca_project = true 
      AND project_status = 'active'
      AND project_id != NEW.project_id;
    
    -- If already has LCA project, trigger amendment
    IF v_existing_lca_project_count > 0 THEN
      INSERT INTO hrms_compliance_items (
        tenant_id,
        business_id,
        employee_id,
        project_id,
        compliance_type,
        item_name,
        description,
        due_date,
        priority
      ) VALUES (
        NEW.tenant_id,
        NEW.business_id,
        NEW.employee_id,
        NEW.project_id,
        'amendment_required',
        'H1B Amendment Required',
        'New LCA project added for visa holder - Amendment process required',
        CURRENT_DATE + INTERVAL '7 days',
        'high'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_project_amendment
  AFTER INSERT OR UPDATE ON hrms_projects
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_project_amendment_required();
```

---

## 12. VIEWS

### 12.1 Active Employees with Current Details

```sql
CREATE VIEW v_hrms_employees_full AS
SELECT 
  e.*,
  a.street_address_1,
  a.city_id,
  c.name as city_name,
  s.name as state_name,
  co.name as country_name,
  v.visa_type_name as current_visa_type,
  v.end_date as visa_expiry_date,
  jt.job_title
FROM hrms_employees e
LEFT JOIN hrms_employee_addresses a ON e.employee_id = a.employee_id AND a.is_current = true
LEFT JOIN cities c ON a.city_id = c.city_id
LEFT JOIN states s ON a.state_id = s.state_id
LEFT JOIN countries co ON a.country_id = co.country_id
LEFT JOIN hrms_visa_statuses v ON e.employee_id = v.employee_id AND v.is_current = true
LEFT JOIN job_title jt ON e.job_title_id = jt.id
WHERE e.is_active = true AND e.deleted_at IS NULL;
```

---

### 12.2 Compliance Dashboard

```sql
CREATE VIEW v_hrms_compliance_dashboard AS
SELECT 
  e.employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  e.employee_type,
  e.employment_status,
  COUNT(CASE WHEN c.compliance_status = 'pending' THEN 1 END) as pending_items,
  COUNT(CASE WHEN c.compliance_status = 'overdue' THEN 1 END) as overdue_items,
  COUNT(CASE WHEN c.due_date <= CURRENT_DATE + INTERVAL '7 days' AND c.compliance_status = 'pending' THEN 1 END) as due_within_week,
  COUNT(CASE WHEN c.priority = 'critical' THEN 1 END) as critical_items
FROM hrms_employees e
LEFT JOIN hrms_compliance_items c ON e.employee_id = c.employee_id AND c.compliance_status IN ('pending', 'overdue')
WHERE e.employment_status = 'active'
GROUP BY e.employee_id, e.first_name, e.last_name, e.employee_type, e.employment_status;
```

---

### 12.3 Project Vendor Chain View

```sql
CREATE VIEW v_hrms_project_vendor_chain AS
SELECT 
  p.project_id,
  p.project_name,
  p.employee_id,
  e.first_name || ' ' || e.last_name as employee_name,
  p.end_client_name,
  string_agg(
    'V' || pv.vendor_level || ': ' || pv.vendor_name, 
    ' → ' 
    ORDER BY pv.vendor_level DESC
  ) as vendor_chain
FROM hrms_projects p
JOIN hrms_employees e ON p.employee_id = e.employee_id
LEFT JOIN hrms_project_vendors pv ON p.project_id = pv.project_id
GROUP BY p.project_id, p.project_name, p.employee_id, e.first_name, e.last_name, p.end_client_name;
```

---

## 13. SUMMARY

### Table Count: 36 Core Tables (Updated from 35)
1. hrms_employees
2. hrms_employee_addresses
3. hrms_employee_sequences
4. **hrms_checklist_types** (Admin-configurable checklist type definitions)
5. hrms_checklist_templates (Links to dynamic checklist types)
6. hrms_checklist_groups
7. hrms_checklist_items
8. hrms_documents (Universal document storage - employee, project, timesheet, compliance)
9. **hrms_vendors** (**NEW:** Vendor master data, synced with Accounting)
10. hrms_projects
11. **hrms_project_rate_history** (Tracks rate changes with effective dates)
12. hrms_project_vendors
13. hrms_timesheets
14. hrms_timesheet_entries
15. hrms_visa_statuses
16. hrms_dependents
17. hrms_compliance_items
18. hrms_compliance_reminders
19. hrms_employee_resumes
20. hrms_background_checks
21. hrms_performance_reports
22. **hrms_tickets** (**NEW:** Employee support tickets)
23. **hrms_ticket_sequences** (**NEW:** Ticket number auto-generation)
24. **hrms_ticket_comments** (**NEW:** Ticket comments/messages)
25. **hrms_ticket_attachments** (**NEW:** Ticket file attachments)
26. **hrms_ticket_status_history** (**NEW:** Status change audit trail)
27. **hrms_ticket_request_types** (**NEW:** Configurable request types per department)
28. hrms_notifications
29. hrms_email_templates
30. hrms_newsletters
31. hrms_suggestions
32. hrms_issue_reports
33. **hrms_ai_prompts** (AI prompt templates for newsletter generation)
34. **hrms_lca_job_titles** (LCA job titles for H1B/L1 visa compliance)
35. crm_hrms_contact_bridge (in both databases)

### CRM-Linked Reference Tables (Managed in CRM, Referenced in HRMS)
- `businesses` - Company/business entities
- `countries` - Country reference data
- `states` - State/province reference data
- `cities` - City reference data
- `job_title` - IT job titles
- `visa_status` - Visa type reference data
- **`clients`** - Client master data (HRMS references CRM clients table)

### Key Architectural Improvements
- ✅ **Admin-Configurable Checklist Types:** New `hrms_checklist_types` table for dynamic type definitions
- ✅ **Dynamic Entity Mapping:** Admin defines which table/column each checklist type maps to
- ✅ **Zero Hardcoding:** No hardcoded checklist types - all defined through admin UI
- ✅ **Universal Checklist System:** Single architecture for ALL document types (immigration, project, timesheet, compliance)
- ✅ **Polymorphic Document Storage:** `hrms_documents` table supports employee, project, timesheet, and compliance contexts
- ✅ **Rate Change History:** New `hrms_project_rate_history` table tracks rate changes with effective dates
- ✅ **AI Newsletter Generation:** New `hrms_ai_prompts` table for AI-powered newsletter content generation
- ✅ **LCA Compliance:** New `hrms_lca_job_titles` table for H1B/L1 visa compliance with SOC codes
- ✅ **Employee Ticket System:** Comprehensive helpdesk system with HR/Immigration teams, comments, attachments, and status tracking
- ✅ **Clients in CRM:** HRMS references CRM `clients` table (single source of truth)
- ✅ **Vendor Master Table:** New `hrms_vendors` table synced with Accounting system
- ✅ **Vendor-to-Client Sync:** Vendors at level 1 (next to client) auto-sync to CRM clients/contacts
- ✅ **Reduced Complexity:** Eliminated specialized tables (MSA/PO/COI) in favor of flexible checklist approach
- ✅ **Extreme Scalability:** Add new checklist types without code changes, only admin configuration

### Key Features
- ✅ Multi-tenant with RLS
- ✅ Complete audit trail
- ✅ Document version control
- ✅ AI-powered document parsing (OpenRouter Claude)
- ✅ **AI-powered newsletter generation (OpenRouter Claude)**
- ✅ **Universal checklist system for ALL documents**
- ✅ **Polymorphic document storage (employee, project, timesheet, compliance)**
- ✅ Complex vendor chain tracking (up to 10 levels)
- ✅ Comprehensive compliance management
- ✅ **LCA job title management for visa compliance**
- ✅ Time-based address history
- ✅ Timesheet management
- ✅ CRM integration bridge
- ✅ Automated reminders
- ✅ Newsletter system with AI generation
- ✅ Suggestions & issue tracking
- ✅ **Employee Ticket/Helpdesk System** (HR & Immigration teams)

---

**Status:** Ready for Review & Migration Development
**Next Phase:** Create Supabase migrations in sequential order
