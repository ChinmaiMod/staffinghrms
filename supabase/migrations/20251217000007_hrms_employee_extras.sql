-- =====================================================
-- HRMS Employee Extras Migration
-- =====================================================
-- Tables: hrms_employee_resumes, hrms_background_checks, hrms_performance_reports
-- =====================================================

-- =====================================================
-- 1. hrms_employee_resumes (Multiple Resumes)
-- =====================================================
CREATE TABLE hrms_employee_resumes (
  resume_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Resume Details
  resume_title VARCHAR(255),
  technology_focus VARCHAR(255),
  
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

CREATE INDEX idx_hrms_resumes_tenant ON hrms_employee_resumes(tenant_id);
CREATE INDEX idx_hrms_resumes_employee ON hrms_employee_resumes(employee_id);
CREATE INDEX idx_hrms_resumes_current ON hrms_employee_resumes(is_current) WHERE is_current = true;
CREATE INDEX idx_hrms_resumes_technology ON hrms_employee_resumes(technology_focus);

-- =====================================================
-- 2. hrms_background_checks (Background Verification)
-- =====================================================
CREATE TABLE hrms_background_checks (
  background_check_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Verification Company
  verification_company_name VARCHAR(255),
  verification_company_contact VARCHAR(255),
  
  -- Check Details
  check_type VARCHAR(100),
  check_status VARCHAR(50) DEFAULT 'pending',
  
  -- Dates
  initiated_date DATE,
  completion_date DATE,
  expiry_date DATE,
  
  -- Results
  result VARCHAR(50),
  notes TEXT,
  
  -- File Storage
  file_path TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_check_type CHECK (check_type IS NULL OR check_type IN (
    'criminal', 'employment', 'education', 'credit', 'drug_test', 
    'reference', 'identity', 'professional_license', 'other'
  )),
  CONSTRAINT valid_check_status CHECK (check_status IN ('pending', 'in_progress', 'completed', 'failed', 'expired')),
  CONSTRAINT valid_result CHECK (result IS NULL OR result IN ('clear', 'discrepancy', 'issue_found', 'pending'))
);

CREATE INDEX idx_hrms_background_checks_tenant ON hrms_background_checks(tenant_id);
CREATE INDEX idx_hrms_background_checks_employee ON hrms_background_checks(employee_id);
CREATE INDEX idx_hrms_background_checks_status ON hrms_background_checks(check_status);
CREATE INDEX idx_hrms_background_checks_type ON hrms_background_checks(check_type);
CREATE INDEX idx_hrms_background_checks_expiry ON hrms_background_checks(expiry_date) WHERE expiry_date IS NOT NULL;

-- =====================================================
-- 3. hrms_performance_reports (Performance Reviews)
-- =====================================================
CREATE TABLE hrms_performance_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Review Details
  review_period_start DATE,
  review_period_end DATE,
  review_year INTEGER,
  review_type VARCHAR(50) DEFAULT 'annual',
  
  -- Ratings
  overall_rating DECIMAL(3,2),
  rating_scale VARCHAR(50),
  
  -- Content
  strengths TEXT,
  areas_for_improvement TEXT,
  goals_next_period TEXT,
  reviewer_comments TEXT,
  employee_comments TEXT,
  
  -- Goals & Objectives (JSONB for flexibility)
  goals JSONB,
  objectives_achieved JSONB,
  
  -- Status
  review_status VARCHAR(50) DEFAULT 'draft',
  
  -- File Storage
  file_path TEXT,
  
  -- Reviewer
  reviewer_id UUID REFERENCES hrms_employees(employee_id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Employee Acknowledgment
  acknowledged_by_employee BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_review_type CHECK (review_type IN ('annual', 'semi_annual', 'quarterly', 'probation', 'pip', 'promotion', 'other')),
  CONSTRAINT valid_review_status CHECK (review_status IN ('draft', 'submitted', 'acknowledged', 'completed')),
  CONSTRAINT valid_overall_rating CHECK (overall_rating IS NULL OR (overall_rating >= 0 AND overall_rating <= 5))
);

CREATE INDEX idx_hrms_performance_tenant ON hrms_performance_reports(tenant_id);
CREATE INDEX idx_hrms_performance_business ON hrms_performance_reports(business_id);
CREATE INDEX idx_hrms_performance_employee ON hrms_performance_reports(employee_id);
CREATE INDEX idx_hrms_performance_reviewer ON hrms_performance_reports(reviewer_id);
CREATE INDEX idx_hrms_performance_year ON hrms_performance_reports(review_year);
CREATE INDEX idx_hrms_performance_status ON hrms_performance_reports(review_status);
CREATE INDEX idx_hrms_performance_type ON hrms_performance_reports(review_type);

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE TRIGGER trg_hrms_employee_resumes_updated_at
  BEFORE UPDATE ON hrms_employee_resumes
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_background_checks_updated_at
  BEFORE UPDATE ON hrms_background_checks
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_performance_reports_updated_at
  BEFORE UPDATE ON hrms_performance_reports
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

-- =====================================================
-- Function: Create Compliance Item for Expiring Background Checks
-- =====================================================
CREATE OR REPLACE FUNCTION fn_create_compliance_from_background_check()
RETURNS TRIGGER AS $$
BEGIN
  -- Create compliance item for background checks with expiry dates
  IF NEW.expiry_date IS NOT NULL AND NEW.check_status = 'completed' AND NEW.result = 'clear' THEN
    INSERT INTO hrms_compliance_items (
      tenant_id,
      employee_id,
      compliance_type,
      item_name,
      description,
      due_date,
      priority
    ) VALUES (
      NEW.tenant_id,
      NEW.employee_id,
      'background_check',
      NEW.check_type || ' Background Check - Renewal Required',
      'Background check expiring on ' || NEW.expiry_date,
      NEW.expiry_date - INTERVAL '30 days',
      CASE 
        WHEN NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'high'
        ELSE 'medium'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_compliance_from_background_check
  AFTER INSERT OR UPDATE OF expiry_date, check_status ON hrms_background_checks
  FOR EACH ROW
  EXECUTE FUNCTION fn_create_compliance_from_background_check();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE hrms_employee_resumes IS 'Multiple resume versions per employee with technology focus';
COMMENT ON TABLE hrms_background_checks IS 'Background verification tracking with expiry management';
COMMENT ON TABLE hrms_performance_reports IS 'Performance review tracking with goals and ratings';
