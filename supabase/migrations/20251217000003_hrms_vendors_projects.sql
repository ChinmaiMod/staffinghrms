-- =====================================================
-- HRMS Vendors & Projects Migration
-- =====================================================
-- Tables: hrms_vendors, hrms_projects, hrms_project_rate_history, hrms_project_vendors
-- =====================================================

-- =====================================================
-- 1. hrms_vendors (Vendor Master Data)
-- =====================================================
CREATE TABLE hrms_vendors (
  vendor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  
  -- Vendor Identification
  vendor_name VARCHAR(255) NOT NULL,
  vendor_code VARCHAR(50) NOT NULL,
  vendor_type VARCHAR(50) DEFAULT 'primary',
  
  -- Tax & Legal
  ein VARCHAR(20),
  
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
  
  -- Payment Terms
  payment_terms_days INTEGER DEFAULT 30,
  receives_payment_terms_days INTEGER DEFAULT 45,
  invoice_frequency VARCHAR(20) DEFAULT 'bi_weekly',
  
  -- Default Rates
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
  CONSTRAINT hrms_vendors_valid_type CHECK (vendor_type IN ('primary', 'secondary', 'implementation_partner')),
  CONSTRAINT hrms_vendors_valid_frequency CHECK (invoice_frequency IN ('weekly', 'bi_weekly', 'semi_monthly', 'monthly'))
);

CREATE INDEX idx_hrms_vendors_tenant ON hrms_vendors(tenant_id);
CREATE INDEX idx_hrms_vendors_business ON hrms_vendors(tenant_id, business_id);
CREATE INDEX idx_hrms_vendors_name ON hrms_vendors(vendor_name);
CREATE INDEX idx_hrms_vendors_code ON hrms_vendors(vendor_code);
CREATE INDEX idx_hrms_vendors_active ON hrms_vendors(tenant_id, business_id, is_active) WHERE is_active = true;
CREATE INDEX idx_hrms_vendors_type ON hrms_vendors(vendor_type);

-- =====================================================
-- 2. hrms_projects (Employee Projects)
-- =====================================================
CREATE TABLE hrms_projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Project Details
  project_name VARCHAR(255) NOT NULL,
  project_code VARCHAR(100),
  
  -- Client Information (linked to CRM clients table)
  client_id UUID,
  end_client_name VARCHAR(255) NOT NULL,
  end_client_manager_name VARCHAR(255),
  end_client_manager_email VARCHAR(255),
  end_client_manager_phone VARCHAR(50),
  end_client_manager_linkedin VARCHAR(255),
  
  -- Location
  work_location_type VARCHAR(50),
  physical_location_city_id UUID REFERENCES cities(city_id),
  physical_location_state_id UUID REFERENCES states(state_id),
  physical_location_country_id UUID REFERENCES countries(country_id),
  
  -- Rates & Financials (Current/Latest)
  actual_client_bill_rate DECIMAL(10,2),
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
  
  -- LCA Project Flag
  is_lca_project BOOLEAN DEFAULT false,
  public_access_folder_url TEXT,
  
  -- Dates
  project_start_date DATE,
  project_end_date DATE,
  
  -- Status
  project_status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_work_location_type CHECK (work_location_type IS NULL OR work_location_type IN ('onsite', 'hybrid', 'remote')),
  CONSTRAINT valid_project_status CHECK (project_status IN ('active', 'completed', 'on_hold', 'cancelled'))
);

CREATE INDEX idx_hrms_projects_tenant ON hrms_projects(tenant_id);
CREATE INDEX idx_hrms_projects_business ON hrms_projects(business_id);
CREATE INDEX idx_hrms_projects_employee ON hrms_projects(employee_id);
CREATE INDEX idx_hrms_projects_client ON hrms_projects(client_id);
CREATE INDEX idx_hrms_projects_status ON hrms_projects(project_status);
CREATE INDEX idx_hrms_projects_lca ON hrms_projects(is_lca_project) WHERE is_lca_project = true;
CREATE INDEX idx_hrms_projects_dates ON hrms_projects(project_start_date, project_end_date);
CREATE INDEX idx_hrms_projects_active ON hrms_projects(is_active) WHERE is_active = true;

-- =====================================================
-- 3. hrms_project_rate_history (Rate Change History)
-- =====================================================
CREATE TABLE hrms_project_rate_history (
  rate_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE SET NULL,
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
  effective_to_date DATE,
  
  -- Change Reason
  change_reason TEXT,
  change_notes TEXT,
  
  -- Status
  is_current_rate BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_effective_date_range CHECK (effective_to_date IS NULL OR effective_to_date >= effective_from_date)
);

-- Exclusion constraint to prevent overlapping date ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE hrms_project_rate_history 
ADD CONSTRAINT no_overlapping_dates EXCLUDE USING gist (
  project_id WITH =,
  daterange(effective_from_date, COALESCE(effective_to_date, 'infinity'::date), '[]') WITH &&
);

CREATE INDEX idx_hrms_rate_history_tenant ON hrms_project_rate_history(tenant_id);
CREATE INDEX idx_hrms_rate_history_project ON hrms_project_rate_history(project_id);
CREATE INDEX idx_hrms_rate_history_effective ON hrms_project_rate_history(effective_from_date, effective_to_date);
CREATE INDEX idx_hrms_rate_history_current ON hrms_project_rate_history(is_current_rate) WHERE is_current_rate = true;

-- =====================================================
-- 4. hrms_project_vendors (Vendor Chain)
-- =====================================================
CREATE TABLE hrms_project_vendors (
  vendor_entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES hrms_projects(project_id) ON DELETE CASCADE,
  
  -- Vendor Details
  vendor_level INTEGER NOT NULL CHECK (vendor_level BETWEEN 1 AND 10),
  vendor_name VARCHAR(255) NOT NULL,
  hrms_vendor_id UUID REFERENCES hrms_vendors(vendor_id) ON DELETE SET NULL,
  is_direct_to_client BOOLEAN DEFAULT false,
  
  -- Vendor Contacts
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

CREATE INDEX idx_hrms_project_vendors_tenant ON hrms_project_vendors(tenant_id);
CREATE INDEX idx_hrms_project_vendors_project ON hrms_project_vendors(project_id);
CREATE INDEX idx_hrms_project_vendors_vendor ON hrms_project_vendors(hrms_vendor_id);
CREATE INDEX idx_hrms_project_vendors_level ON hrms_project_vendors(vendor_level);

-- =====================================================
-- 5. Trigger to maintain is_current_rate flag
-- =====================================================
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

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE TRIGGER trg_hrms_vendors_updated_at
  BEFORE UPDATE ON hrms_vendors
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_projects_updated_at
  BEFORE UPDATE ON hrms_projects
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_project_vendors_updated_at
  BEFORE UPDATE ON hrms_project_vendors
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE hrms_vendors IS 'Vendor master data, synced with Accounting system';
COMMENT ON TABLE hrms_projects IS 'Employee projects with complex vendor chains and LCA tracking';
COMMENT ON TABLE hrms_project_rate_history IS 'Rate change history with effective dates - never overwrites rates';
COMMENT ON TABLE hrms_project_vendors IS 'Vendor chain supporting up to 10 levels from employee to end client';
COMMENT ON FUNCTION fn_update_current_rate IS 'Automatically maintains is_current_rate flag on rate history';
