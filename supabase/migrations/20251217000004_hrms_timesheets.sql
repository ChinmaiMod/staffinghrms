-- =====================================================
-- HRMS Timesheet System Migration
-- =====================================================
-- Tables: hrms_timesheets, hrms_timesheet_entries
-- =====================================================

-- =====================================================
-- 1. hrms_timesheets (Employee Time Tracking)
-- =====================================================
CREATE TABLE hrms_timesheets (
  timesheet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES hrms_projects(project_id) ON DELETE CASCADE,
  
  -- Timesheet Period
  timesheet_type VARCHAR(50) NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  
  -- Hours
  total_hours_worked DECIMAL(10,2) NOT NULL DEFAULT 0,
  regular_hours DECIMAL(10,2) DEFAULT 0,
  overtime_hours DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  submission_status VARCHAR(50) DEFAULT 'draft',
  
  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_timesheet_type CHECK (timesheet_type IN ('daily', 'weekly', 'monthly')),
  CONSTRAINT valid_submission_status CHECK (submission_status IN ('draft', 'submitted', 'approved', 'rejected')),
  CONSTRAINT valid_period CHECK (period_end_date >= period_start_date)
);

CREATE INDEX idx_hrms_timesheets_tenant ON hrms_timesheets(tenant_id);
CREATE INDEX idx_hrms_timesheets_business ON hrms_timesheets(business_id);
CREATE INDEX idx_hrms_timesheets_employee ON hrms_timesheets(employee_id);
CREATE INDEX idx_hrms_timesheets_project ON hrms_timesheets(project_id);
CREATE INDEX idx_hrms_timesheets_period ON hrms_timesheets(period_start_date, period_end_date);
CREATE INDEX idx_hrms_timesheets_status ON hrms_timesheets(submission_status);

-- =====================================================
-- 2. hrms_timesheet_entries (Daily Time Entries)
-- =====================================================
CREATE TABLE hrms_timesheet_entries (
  entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  timesheet_id UUID NOT NULL REFERENCES hrms_timesheets(timesheet_id) ON DELETE CASCADE,
  
  work_date DATE NOT NULL,
  hours_worked DECIMAL(10,2) NOT NULL DEFAULT 0,
  task_description TEXT,
  
  -- Entry Type
  entry_type VARCHAR(50) DEFAULT 'regular',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_entry_type CHECK (entry_type IN ('regular', 'overtime', 'holiday', 'sick', 'vacation'))
);

CREATE INDEX idx_hrms_timesheet_entries_tenant ON hrms_timesheet_entries(tenant_id);
CREATE INDEX idx_hrms_timesheet_entries_timesheet ON hrms_timesheet_entries(timesheet_id);
CREATE INDEX idx_hrms_timesheet_entries_date ON hrms_timesheet_entries(work_date);

-- =====================================================
-- 3. Function to calculate total hours
-- =====================================================
CREATE OR REPLACE FUNCTION fn_update_timesheet_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent timesheet with recalculated totals
  UPDATE hrms_timesheets
  SET 
    total_hours_worked = (
      SELECT COALESCE(SUM(hours_worked), 0)
      FROM hrms_timesheet_entries
      WHERE timesheet_id = COALESCE(NEW.timesheet_id, OLD.timesheet_id)
    ),
    regular_hours = (
      SELECT COALESCE(SUM(hours_worked), 0)
      FROM hrms_timesheet_entries
      WHERE timesheet_id = COALESCE(NEW.timesheet_id, OLD.timesheet_id)
        AND entry_type = 'regular'
    ),
    overtime_hours = (
      SELECT COALESCE(SUM(hours_worked), 0)
      FROM hrms_timesheet_entries
      WHERE timesheet_id = COALESCE(NEW.timesheet_id, OLD.timesheet_id)
        AND entry_type = 'overtime'
    ),
    updated_at = NOW()
  WHERE timesheet_id = COALESCE(NEW.timesheet_id, OLD.timesheet_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_timesheet_totals
AFTER INSERT OR UPDATE OR DELETE ON hrms_timesheet_entries
FOR EACH ROW
EXECUTE FUNCTION fn_update_timesheet_totals();

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE TRIGGER trg_hrms_timesheets_updated_at
  BEFORE UPDATE ON hrms_timesheets
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_timesheet_entries_updated_at
  BEFORE UPDATE ON hrms_timesheet_entries
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE hrms_timesheets IS 'Employee time tracking with approval workflow';
COMMENT ON TABLE hrms_timesheet_entries IS 'Daily time entries for timesheets';
COMMENT ON FUNCTION fn_update_timesheet_totals IS 'Automatically recalculates timesheet totals when entries change';
