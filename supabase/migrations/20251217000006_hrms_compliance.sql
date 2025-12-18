-- =====================================================
-- HRMS Compliance Migration
-- =====================================================
-- Tables: hrms_compliance_items, hrms_compliance_reminders
-- =====================================================

-- =====================================================
-- 1. hrms_compliance_items (Compliance Tracking)
-- =====================================================
CREATE TABLE hrms_compliance_items (
  compliance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE SET NULL,
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Source Document References
  document_id UUID REFERENCES hrms_documents(document_id) ON DELETE SET NULL,
  project_id UUID REFERENCES hrms_projects(project_id) ON DELETE SET NULL,
  visa_status_id UUID REFERENCES hrms_visa_statuses(visa_status_id) ON DELETE SET NULL,
  
  -- Compliance Details
  compliance_type VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Dates
  due_date DATE NOT NULL,
  completion_date DATE,
  
  -- Status
  compliance_status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  
  -- Reminders
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_compliance_type CHECK (compliance_type IN (
    'document_expiry', 'visa_renewal', 'i9_reverify', 'po_extension', 
    'amendment_required', 'background_check', 'certification_renewal',
    'license_renewal', 'training_due', 'performance_review', 'other'
  )),
  CONSTRAINT valid_compliance_status CHECK (compliance_status IN ('pending', 'completed', 'overdue', 'waived')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_hrms_compliance_tenant ON hrms_compliance_items(tenant_id);
CREATE INDEX idx_hrms_compliance_business ON hrms_compliance_items(business_id);
CREATE INDEX idx_hrms_compliance_employee ON hrms_compliance_items(employee_id);
CREATE INDEX idx_hrms_compliance_status ON hrms_compliance_items(compliance_status);
CREATE INDEX idx_hrms_compliance_due_date ON hrms_compliance_items(due_date) WHERE compliance_status IN ('pending', 'overdue');
CREATE INDEX idx_hrms_compliance_type ON hrms_compliance_items(compliance_type);
CREATE INDEX idx_hrms_compliance_priority ON hrms_compliance_items(priority) WHERE compliance_status = 'pending';

-- =====================================================
-- 2. hrms_compliance_reminders (Reminder Configuration)
-- =====================================================
CREATE TABLE hrms_compliance_reminders (
  reminder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  compliance_id UUID NOT NULL REFERENCES hrms_compliance_items(compliance_id) ON DELETE CASCADE,
  
  -- Reminder Schedule
  remind_before_days INTEGER NOT NULL,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  
  -- Recipients
  recipient_emails TEXT[],
  recipient_user_ids UUID[],
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_compliance_reminders_tenant ON hrms_compliance_reminders(tenant_id);
CREATE INDEX idx_hrms_compliance_reminders_compliance ON hrms_compliance_reminders(compliance_id);
CREATE INDEX idx_hrms_compliance_reminders_pending ON hrms_compliance_reminders(reminder_sent) WHERE reminder_sent = false;

-- =====================================================
-- Function: Auto-create Compliance Items from Documents
-- =====================================================
CREATE OR REPLACE FUNCTION fn_create_compliance_from_document()
RETURNS TRIGGER AS $$
BEGIN
  -- Create compliance item for documents with expiry dates and compliance tracking
  IF NEW.expiry_date IS NOT NULL 
     AND NEW.compliance_tracking_flag = true 
     AND NEW.document_status = 'active'
     AND NEW.entity_type = 'employee' THEN
    
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
      NEW.entity_id, -- employee_id when entity_type = 'employee'
      NEW.document_id,
      'document_expiry',
      NEW.document_name || ' - Renewal Required',
      'Document ' || NEW.document_name || ' is expiring on ' || NEW.expiry_date,
      NEW.expiry_date - INTERVAL '30 days',
      CASE 
        WHEN NEW.expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'critical'
        WHEN NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'high'
        WHEN NEW.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'medium'
        ELSE 'low'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_compliance_from_document
  AFTER INSERT ON hrms_documents
  FOR EACH ROW
  EXECUTE FUNCTION fn_create_compliance_from_document();

-- =====================================================
-- Function: Auto-update Compliance Status to Overdue
-- =====================================================
CREATE OR REPLACE FUNCTION fn_update_overdue_compliance()
RETURNS void AS $$
BEGIN
  UPDATE hrms_compliance_items
  SET compliance_status = 'overdue',
      updated_at = NOW()
  WHERE compliance_status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Trigger Amendment Required Alert for LCA Projects
-- =====================================================
CREATE OR REPLACE FUNCTION fn_check_project_amendment_required()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_visa_status VARCHAR(50);
  v_existing_lca_project_count INTEGER;
BEGIN
  -- Only check if this is an LCA project
  IF NEW.is_lca_project = true THEN
    -- Check if employee has active visa
    SELECT vs.visa_type_name INTO v_employee_visa_status
    FROM hrms_visa_statuses vs
    WHERE vs.employee_id = NEW.employee_id 
      AND vs.is_current = true
      AND vs.visa_status = 'active'
    LIMIT 1;
    
    -- If employee has H1B or L1 visa
    IF v_employee_visa_status IN ('H1B', 'L1', 'H-1B', 'L-1') THEN
      -- Count existing active LCA projects for this employee
      SELECT COUNT(*) INTO v_existing_lca_project_count
      FROM hrms_projects
      WHERE employee_id = NEW.employee_id 
        AND is_lca_project = true 
        AND project_status = 'active'
        AND project_id != NEW.project_id;
      
      -- If employee already has an LCA project, create amendment alert
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
          'H1B Amendment Required - New LCA Project',
          'Employee already has an active LCA project. New project requires H1B amendment filing.',
          CURRENT_DATE + INTERVAL '7 days',
          'high'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_project_amendment
  AFTER INSERT OR UPDATE OF is_lca_project ON hrms_projects
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_project_amendment_required();

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE TRIGGER trg_hrms_compliance_items_updated_at
  BEFORE UPDATE ON hrms_compliance_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE hrms_compliance_items IS 'Compliance tracking for documents, visas, certifications, and other time-sensitive items';
COMMENT ON TABLE hrms_compliance_reminders IS 'Reminder configuration for compliance items';
COMMENT ON FUNCTION fn_create_compliance_from_document() IS 'Auto-creates compliance items when documents with expiry dates are uploaded';
COMMENT ON FUNCTION fn_check_project_amendment_required() IS 'Creates amendment alert when visa holder is assigned to multiple LCA projects';
