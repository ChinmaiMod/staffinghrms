-- =====================================================
-- HRMS Ticket System Migration
-- =====================================================
-- Tables: hrms_ticket_request_types, hrms_ticket_sequences, hrms_tickets,
--         hrms_ticket_comments, hrms_ticket_attachments, hrms_ticket_status_history
-- =====================================================

-- =====================================================
-- 1. hrms_ticket_request_types (Request Type Configuration)
-- =====================================================
CREATE TABLE hrms_ticket_request_types (
  request_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Request Type Info
  type_code VARCHAR(100) NOT NULL,
  type_name VARCHAR(255) NOT NULL,
  type_description TEXT,
  
  -- Department
  department VARCHAR(50) NOT NULL,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  icon VARCHAR(50),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system_type BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_department CHECK (department IN ('HR', 'Immigration')),
  CONSTRAINT unique_type_per_tenant_dept UNIQUE (tenant_id, department, type_code)
);

CREATE INDEX idx_hrms_ticket_request_types_tenant ON hrms_ticket_request_types(tenant_id);
CREATE INDEX idx_hrms_ticket_request_types_department ON hrms_ticket_request_types(department);
CREATE INDEX idx_hrms_ticket_request_types_active ON hrms_ticket_request_types(is_active) WHERE is_active = true;

-- =====================================================
-- 2. hrms_ticket_sequences (Ticket Number Auto-Generation)
-- =====================================================
CREATE TABLE hrms_ticket_sequences (
  sequence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  next_sequence INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_business_ticket_sequence UNIQUE (business_id)
);

-- =====================================================
-- 3. hrms_tickets (Employee Support Tickets)
-- =====================================================
CREATE TABLE hrms_tickets (
  ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(business_id) ON DELETE CASCADE,
  
  -- Ticket Number (auto-generated, format: <short_name>TKT<seq>, e.g., IESTKT0042)
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Employee (who submitted)
  employee_id UUID NOT NULL REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Ticket Classification
  department VARCHAR(50) NOT NULL,
  request_type VARCHAR(100) NOT NULL,
  request_type_id UUID REFERENCES hrms_ticket_request_types(request_type_id) ON DELETE SET NULL,
  
  -- Ticket Content
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Assignment
  assigned_team VARCHAR(50) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal',
  
  -- Status
  status VARCHAR(50) DEFAULT 'ticket_created',
  
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
  
  CONSTRAINT valid_ticket_department CHECK (department IN ('HR', 'Immigration')),
  CONSTRAINT valid_assigned_team CHECK (assigned_team IN ('HR_Team', 'Immigration_Team')),
  CONSTRAINT valid_ticket_priority CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  CONSTRAINT valid_ticket_status CHECK (status IN (
    'ticket_created', 'in_team_review', 'need_leadership_discussion',
    'need_attorney_discussion', 'need_team_discussion',
    'sent_to_candidate_review', 'closed', 'auto_closed'
  ))
);

CREATE INDEX idx_hrms_tickets_tenant ON hrms_tickets(tenant_id);
CREATE INDEX idx_hrms_tickets_business ON hrms_tickets(business_id);
CREATE INDEX idx_hrms_tickets_employee ON hrms_tickets(employee_id);
CREATE INDEX idx_hrms_tickets_assigned_team ON hrms_tickets(assigned_team);
CREATE INDEX idx_hrms_tickets_assigned_to ON hrms_tickets(assigned_to);
CREATE INDEX idx_hrms_tickets_status ON hrms_tickets(status);
CREATE INDEX idx_hrms_tickets_department ON hrms_tickets(department);
CREATE INDEX idx_hrms_tickets_number ON hrms_tickets(ticket_number);
CREATE INDEX idx_hrms_tickets_priority ON hrms_tickets(priority);
CREATE INDEX idx_hrms_tickets_created ON hrms_tickets(created_at DESC);
CREATE INDEX idx_hrms_tickets_last_activity ON hrms_tickets(last_activity_at DESC);

-- =====================================================
-- 4. hrms_ticket_comments (Ticket Comments/Messages)
-- =====================================================
CREATE TABLE hrms_ticket_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES hrms_tickets(ticket_id) ON DELETE CASCADE,
  
  -- Comment Content
  comment_text TEXT NOT NULL,
  
  -- Comment Type
  is_internal_note BOOLEAN DEFAULT false,
  is_system_generated BOOLEAN DEFAULT false,
  
  -- Author
  author_type VARCHAR(50) NOT NULL,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_employee_id UUID REFERENCES hrms_employees(employee_id) ON DELETE SET NULL,
  author_display_name VARCHAR(255),
  
  -- Email Notification
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_author_type CHECK (author_type IN ('employee', 'team_member', 'system'))
);

CREATE INDEX idx_hrms_ticket_comments_tenant ON hrms_ticket_comments(tenant_id);
CREATE INDEX idx_hrms_ticket_comments_ticket ON hrms_ticket_comments(ticket_id);
CREATE INDEX idx_hrms_ticket_comments_created ON hrms_ticket_comments(created_at);
CREATE INDEX idx_hrms_ticket_comments_internal ON hrms_ticket_comments(is_internal_note);
CREATE INDEX idx_hrms_ticket_comments_author ON hrms_ticket_comments(author_user_id);

-- =====================================================
-- 5. hrms_ticket_attachments (Ticket File Attachments)
-- =====================================================
CREATE TABLE hrms_ticket_attachments (
  attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES hrms_tickets(ticket_id) ON DELETE CASCADE,
  comment_id UUID REFERENCES hrms_ticket_comments(comment_id) ON DELETE CASCADE,
  
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

CREATE INDEX idx_hrms_ticket_attachments_tenant ON hrms_ticket_attachments(tenant_id);
CREATE INDEX idx_hrms_ticket_attachments_ticket ON hrms_ticket_attachments(ticket_id);
CREATE INDEX idx_hrms_ticket_attachments_comment ON hrms_ticket_attachments(comment_id);

-- =====================================================
-- 6. hrms_ticket_status_history (Status Change Audit Trail)
-- =====================================================
CREATE TABLE hrms_ticket_status_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES hrms_tickets(ticket_id) ON DELETE CASCADE,
  
  -- Status Change
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  
  -- Change Details
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_name VARCHAR(255),
  
  -- Email Notification
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_ticket_status_history_tenant ON hrms_ticket_status_history(tenant_id);
CREATE INDEX idx_hrms_ticket_status_history_ticket ON hrms_ticket_status_history(ticket_id);
CREATE INDEX idx_hrms_ticket_status_history_created ON hrms_ticket_status_history(created_at);

-- =====================================================
-- Function: Generate Ticket Number
-- =====================================================
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
  VALUES (v_tenant_id, p_business_id, 2)
  ON CONFLICT (business_id) 
  DO UPDATE SET 
    next_sequence = hrms_ticket_sequences.next_sequence + 1,
    updated_at = NOW()
  RETURNING next_sequence - 1 INTO v_next_seq;
  
  -- Format: <short_name>TKT<4-digit-seq> (e.g., IESTKT0042)
  v_ticket_number := v_short_name || 'TKT' || LPAD(v_next_seq::TEXT, 4, '0');
  
  RETURN v_ticket_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Update Last Activity on Ticket
-- =====================================================
CREATE OR REPLACE FUNCTION fn_update_ticket_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hrms_tickets
  SET last_activity_at = NOW(),
      updated_at = NOW()
  WHERE ticket_id = NEW.ticket_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_ticket_activity_on_comment
  AFTER INSERT ON hrms_ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_ticket_last_activity();

-- =====================================================
-- Function: Record Status Change History
-- =====================================================
CREATE OR REPLACE FUNCTION fn_record_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO hrms_ticket_status_history (
      tenant_id,
      ticket_id,
      previous_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.tenant_id,
      NEW.ticket_id,
      OLD.status,
      NEW.status,
      NEW.updated_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_record_ticket_status_change
  AFTER UPDATE OF status ON hrms_tickets
  FOR EACH ROW
  EXECUTE FUNCTION fn_record_ticket_status_change();

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE TRIGGER trg_hrms_ticket_request_types_updated_at
  BEFORE UPDATE ON hrms_ticket_request_types
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_tickets_updated_at
  BEFORE UPDATE ON hrms_tickets
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_ticket_comments_updated_at
  BEFORE UPDATE ON hrms_ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE hrms_ticket_request_types IS 'Configurable request types per department (HR/Immigration)';
COMMENT ON TABLE hrms_ticket_sequences IS 'Ticket number auto-generation sequence per business';
COMMENT ON TABLE hrms_tickets IS 'Employee support tickets for HR and Immigration teams';
COMMENT ON TABLE hrms_ticket_comments IS 'Ticket comments/messages with internal notes support';
COMMENT ON TABLE hrms_ticket_attachments IS 'File attachments for tickets and comments';
COMMENT ON TABLE hrms_ticket_status_history IS 'Status change audit trail for tickets';
COMMENT ON FUNCTION fn_generate_ticket_number(UUID) IS 'Generates unique ticket numbers in format <business_short>TKT<seq>';
