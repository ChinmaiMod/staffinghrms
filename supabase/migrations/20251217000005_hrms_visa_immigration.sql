-- =====================================================
-- HRMS Visa & Immigration Migration
-- =====================================================
-- Tables: hrms_visa_statuses, hrms_dependents, hrms_lca_job_titles
-- =====================================================

-- =====================================================
-- 1. hrms_lca_job_titles (LCA Job Titles for H1B/L1 Compliance)
-- =====================================================
CREATE TABLE hrms_lca_job_titles (
  lca_job_title_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- LCA Job Title Information
  lca_job_title VARCHAR(255) NOT NULL,
  
  -- SOC Code (Standard Occupational Classification)
  soc_code VARCHAR(10) NOT NULL,
  soc_title VARCHAR(255),
  
  -- Wage Level (1-4: Entry → Fully Competent)
  wage_level INTEGER NOT NULL,
  wage_level_description VARCHAR(50),
  
  -- OES Wage Data Reference
  oes_wage_source_url TEXT,
  
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

-- Add foreign key constraint to hrms_employees
ALTER TABLE hrms_employees 
ADD CONSTRAINT fk_employees_lca_job_title 
FOREIGN KEY (lca_job_title_id) REFERENCES hrms_lca_job_titles(lca_job_title_id) ON DELETE SET NULL;

-- =====================================================
-- 2. hrms_visa_statuses (Employee Visa History)
-- =====================================================
CREATE TABLE hrms_visa_statuses (
  visa_status_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Visa Details
  visa_type_id INTEGER REFERENCES visa_status(id),
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
  visa_status VARCHAR(50) DEFAULT 'active',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_visa_status CHECK (visa_status IN ('active', 'expired', 'pending', 'cancelled')),
  CONSTRAINT valid_visa_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_hrms_visa_statuses_tenant ON hrms_visa_statuses(tenant_id);
CREATE INDEX idx_hrms_visa_statuses_employee ON hrms_visa_statuses(employee_id);
CREATE INDEX idx_hrms_visa_statuses_current ON hrms_visa_statuses(is_current) WHERE is_current = true;
CREATE INDEX idx_hrms_visa_statuses_expiry ON hrms_visa_statuses(end_date) WHERE visa_status = 'active';

-- =====================================================
-- 3. hrms_dependents (Employee Dependents)
-- =====================================================
CREATE TABLE hrms_dependents (
  dependent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Dependent Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  relationship VARCHAR(50),
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_relationship CHECK (relationship IS NULL OR relationship IN ('spouse', 'child', 'parent', 'sibling', 'other'))
);

CREATE INDEX idx_hrms_dependents_tenant ON hrms_dependents(tenant_id);
CREATE INDEX idx_hrms_dependents_employee ON hrms_dependents(employee_id);
CREATE INDEX idx_hrms_dependents_visa_expiry ON hrms_dependents(visa_expiry_date) WHERE visa_expiry_date IS NOT NULL;

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE TRIGGER trg_hrms_lca_job_titles_updated_at
  BEFORE UPDATE ON hrms_lca_job_titles
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_visa_statuses_updated_at
  BEFORE UPDATE ON hrms_visa_statuses
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_dependents_updated_at
  BEFORE UPDATE ON hrms_dependents
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE hrms_lca_job_titles IS 'LCA job titles with SOC codes and wage levels for visa compliance';
COMMENT ON TABLE hrms_visa_statuses IS 'Employee visa history tracking';
COMMENT ON TABLE hrms_dependents IS 'Employee dependents with visa tracking';
