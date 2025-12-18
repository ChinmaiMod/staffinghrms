-- =====================================================
-- HRMS CRM-HRMS Bridge Migration
-- =====================================================
-- Table: crm_hrms_contact_bridge
-- Purpose: Links CRM contacts to HRMS employees for conversion tracking
-- =====================================================

-- =====================================================
-- 1. crm_hrms_contact_bridge (Cross-System Link)
-- =====================================================
CREATE TABLE crm_hrms_contact_bridge (
  bridge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Canonical IDs
  crm_contact_id UUID NOT NULL,
  hrms_employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Sync Status
  sync_status VARCHAR(50) DEFAULT 'active',
  sync_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Conversion Details
  conversion_date TIMESTAMPTZ DEFAULT NOW(),
  converted_by UUID REFERENCES auth.users(id),
  conversion_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_sync_status CHECK (sync_status IN ('active', 'inactive', 'error', 'pending')),
  CONSTRAINT unique_crm_contact UNIQUE(crm_contact_id),
  CONSTRAINT unique_hrms_employee UNIQUE(hrms_employee_id)
);

CREATE INDEX idx_crm_hrms_bridge_tenant ON crm_hrms_contact_bridge(tenant_id);
CREATE INDEX idx_crm_hrms_bridge_contact ON crm_hrms_contact_bridge(crm_contact_id);
CREATE INDEX idx_crm_hrms_bridge_employee ON crm_hrms_contact_bridge(hrms_employee_id);
CREATE INDEX idx_crm_hrms_bridge_status ON crm_hrms_contact_bridge(sync_status);
CREATE INDEX idx_crm_hrms_bridge_date ON crm_hrms_contact_bridge(conversion_date);

-- =====================================================
-- Trigger for updated_at
-- =====================================================
CREATE TRIGGER trg_crm_hrms_bridge_updated_at
  BEFORE UPDATE ON crm_hrms_contact_bridge
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

-- =====================================================
-- Function: Convert Contact to Employee
-- This function creates an employee record from a CRM contact
-- and establishes the bridge link
-- =====================================================
CREATE OR REPLACE FUNCTION fn_convert_contact_to_employee(
  p_tenant_id UUID,
  p_business_id UUID,
  p_crm_contact_id UUID,
  p_first_name VARCHAR(100),
  p_last_name VARCHAR(100),
  p_email VARCHAR(255),
  p_phone VARCHAR(20),
  p_employee_type VARCHAR(50),
  p_start_date DATE,
  p_job_title_id INTEGER DEFAULT NULL,
  p_converted_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_employee_id UUID;
  v_employee_code VARCHAR(50);
  v_bridge_id UUID;
BEGIN
  -- Generate employee code
  v_employee_code := fn_generate_employee_code(p_business_id);
  
  -- Create employee record
  INSERT INTO hrms_employees (
    tenant_id,
    business_id,
    crm_contact_id,
    employee_code,
    first_name,
    last_name,
    email,
    phone,
    employee_type,
    start_date,
    job_title_id,
    employment_status,
    is_active,
    created_by
  ) VALUES (
    p_tenant_id,
    p_business_id,
    p_crm_contact_id,
    v_employee_code,
    p_first_name,
    p_last_name,
    p_email,
    p_phone,
    p_employee_type,
    p_start_date,
    p_job_title_id,
    'active',
    true,
    p_converted_by
  )
  RETURNING employee_id INTO v_employee_id;
  
  -- Create bridge record
  INSERT INTO crm_hrms_contact_bridge (
    tenant_id,
    crm_contact_id,
    hrms_employee_id,
    converted_by,
    conversion_notes
  ) VALUES (
    p_tenant_id,
    p_crm_contact_id,
    v_employee_id,
    p_converted_by,
    'Converted from CRM contact on ' || NOW()::TEXT
  )
  RETURNING bridge_id INTO v_bridge_id;
  
  RETURN v_employee_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Get Employee by CRM Contact ID
-- =====================================================
CREATE OR REPLACE FUNCTION fn_get_employee_by_contact(p_crm_contact_id UUID)
RETURNS TABLE (
  employee_id UUID,
  employee_code VARCHAR(50),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  employee_type VARCHAR(50),
  employment_status VARCHAR(50),
  sync_status VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.employee_id,
    e.employee_code,
    e.first_name,
    e.last_name,
    e.email,
    e.employee_type,
    e.employment_status,
    b.sync_status
  FROM hrms_employees e
  JOIN crm_hrms_contact_bridge b ON e.employee_id = b.hrms_employee_id
  WHERE b.crm_contact_id = p_crm_contact_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Sync Employee Data Back to CRM
-- This updates the bridge with sync timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION fn_mark_employee_synced(p_employee_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE crm_hrms_contact_bridge
  SET sync_date = NOW(),
      sync_status = 'active',
      updated_at = NOW()
  WHERE hrms_employee_id = p_employee_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE crm_hrms_contact_bridge IS 'Links CRM contacts to HRMS employees for conversion tracking and data sync';
COMMENT ON FUNCTION fn_convert_contact_to_employee IS 'Converts a CRM contact to an HRMS employee with automatic bridge creation';
COMMENT ON FUNCTION fn_get_employee_by_contact IS 'Retrieves employee details by CRM contact ID';
COMMENT ON FUNCTION fn_mark_employee_synced IS 'Updates sync timestamp for an employee in the bridge table';
