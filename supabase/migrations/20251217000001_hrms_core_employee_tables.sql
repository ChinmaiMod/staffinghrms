-- =====================================================
-- HRMS Core Employee Tables Migration
-- =====================================================
-- Tables: hrms_employees, hrms_employee_addresses, hrms_employee_sequences
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. hrms_employee_sequences (Auto-Increment Per Business)
-- =====================================================
CREATE TABLE hrms_employee_sequences (
  sequence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  
  -- Current sequence value (next employee gets this number, then it increments)
  next_sequence INTEGER NOT NULL DEFAULT 1,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_business_sequence UNIQUE (business_id)
);

CREATE INDEX idx_hrms_employee_sequences_tenant ON hrms_employee_sequences(tenant_id);
CREATE INDEX idx_hrms_employee_sequences_business ON hrms_employee_sequences(business_id);

-- =====================================================
-- 2. hrms_employees (Core Employee Information)
-- =====================================================
CREATE TABLE hrms_employees (
  employee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE SET NULL,
  
  -- From CRM Bridge
  crm_contact_id UUID,
  
  -- Basic Info (employee_code format: <short_name><seq>, e.g., IES00001)
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  
  -- Employee Type
  employee_type VARCHAR(50) NOT NULL,
  
  -- Dates
  date_of_birth DATE,
  date_of_birth_as_per_record DATE,
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Job Details (Dual Job Titles)
  job_title_id INTEGER REFERENCES job_title(id),
  lca_job_title_id UUID,
  department VARCHAR(100),
  
  -- Sensitive Info (encrypted)
  ssn_encrypted TEXT,
  
  -- Status
  employment_status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_employee_type CHECK (employee_type IN ('internal_india', 'internal_usa', 'it_usa', 'nonit_usa', 'healthcare_usa')),
  CONSTRAINT valid_employment_status CHECK (employment_status IN ('active', 'inactive', 'terminated', 'on_leave'))
);

CREATE INDEX idx_hrms_employees_tenant ON hrms_employees(tenant_id);
CREATE INDEX idx_hrms_employees_business ON hrms_employees(business_id);
CREATE INDEX idx_hrms_employees_type ON hrms_employees(employee_type);
CREATE INDEX idx_hrms_employees_status ON hrms_employees(employment_status);
CREATE INDEX idx_hrms_employees_crm_contact ON hrms_employees(crm_contact_id);
CREATE INDEX idx_hrms_employees_code ON hrms_employees(employee_code);
CREATE INDEX idx_hrms_employees_email ON hrms_employees(email);
CREATE INDEX idx_hrms_employees_active ON hrms_employees(is_active) WHERE is_active = true;

-- =====================================================
-- 3. hrms_employee_addresses (Time-Based Address History)
-- =====================================================
CREATE TABLE hrms_employee_addresses (
  address_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Address Type
  address_type VARCHAR(50) NOT NULL,
  
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
  
  CONSTRAINT valid_address_type CHECK (address_type IN ('current', 'permanent', 'mailing', 'previous')),
  CONSTRAINT valid_date_range CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

CREATE INDEX idx_hrms_addresses_tenant ON hrms_employee_addresses(tenant_id);
CREATE INDEX idx_hrms_addresses_employee ON hrms_employee_addresses(employee_id);
CREATE INDEX idx_hrms_addresses_current ON hrms_employee_addresses(is_current) WHERE is_current = true;
CREATE INDEX idx_hrms_addresses_dates ON hrms_employee_addresses(valid_from, valid_to);

-- =====================================================
-- 4. Function to Generate Employee Code
-- =====================================================
CREATE OR REPLACE FUNCTION fn_generate_employee_code(p_business_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  v_short_name VARCHAR(10);
  v_tenant_id UUID;
  v_next_seq INTEGER;
  v_employee_code VARCHAR(50);
BEGIN
  -- Get business short_name and tenant_id
  SELECT short_name, tenant_id INTO v_short_name, v_tenant_id
  FROM businesses
  WHERE business_id = p_business_id;
  
  IF v_short_name IS NULL THEN
    RAISE EXCEPTION 'Business short_name not found for business_id %', p_business_id;
  END IF;
  
  -- Get and increment sequence (with lock)
  INSERT INTO hrms_employee_sequences (tenant_id, business_id, next_sequence)
  VALUES (v_tenant_id, p_business_id, 2)
  ON CONFLICT (business_id) 
  DO UPDATE SET 
    next_sequence = hrms_employee_sequences.next_sequence + 1,
    updated_at = NOW()
  RETURNING next_sequence - 1 INTO v_next_seq;
  
  -- Format: PREFIX + 5-digit zero-padded number (e.g., IES00001)
  v_employee_code := v_short_name || LPAD(v_next_seq::TEXT, 5, '0');
  
  RETURN v_employee_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. Trigger for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION fn_update_hrms_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hrms_employees_updated_at
  BEFORE UPDATE ON hrms_employees
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_employee_addresses_updated_at
  BEFORE UPDATE ON hrms_employee_addresses
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_employee_sequences_updated_at
  BEFORE UPDATE ON hrms_employee_sequences
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE hrms_employees IS 'Core employee information table for all employee types';
COMMENT ON TABLE hrms_employee_addresses IS 'Time-based address history for employees';
COMMENT ON TABLE hrms_employee_sequences IS 'Auto-increment sequence per business for employee codes';
COMMENT ON FUNCTION fn_generate_employee_code IS 'Generates employee code in format <business_short_name><5-digit-seq>';
