-- =====================================================
-- HRMS System Tables Migration
-- =====================================================
-- Tables: hrms_notifications, hrms_email_templates, hrms_newsletters,
--         hrms_suggestions, hrms_issue_reports, hrms_ai_prompts
-- =====================================================

-- =====================================================
-- 1. hrms_notifications (System Notifications)
-- =====================================================
CREATE TABLE hrms_notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Recipient
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES hrms_employees(employee_id) ON DELETE CASCADE,
  
  -- Notification Details
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related Records
  related_entity_type VARCHAR(100),
  related_entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal',
  
  -- Action
  action_url TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_notification_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  CONSTRAINT valid_notification_type CHECK (notification_type IN (
    'compliance_reminder', 'document_expiry', 'project_update', 'ticket_update',
    'visa_expiry', 'performance_review', 'timesheet_reminder', 'approval_required',
    'system_announcement', 'newsletter', 'other'
  ))
);

CREATE INDEX idx_hrms_notifications_tenant ON hrms_notifications(tenant_id);
CREATE INDEX idx_hrms_notifications_user ON hrms_notifications(user_id);
CREATE INDEX idx_hrms_notifications_employee ON hrms_notifications(employee_id);
CREATE INDEX idx_hrms_notifications_unread ON hrms_notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_hrms_notifications_type ON hrms_notifications(notification_type);
CREATE INDEX idx_hrms_notifications_created ON hrms_notifications(created_at DESC);

-- =====================================================
-- 2. hrms_email_templates (Email Templates)
-- =====================================================
CREATE TABLE hrms_email_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Template Details
  template_name VARCHAR(255) NOT NULL,
  template_key VARCHAR(100) NOT NULL,
  template_category VARCHAR(100) DEFAULT 'general',
  
  -- Content
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  -- Variables (JSON array of available placeholders)
  available_variables JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system_template BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_template_key_per_tenant UNIQUE (tenant_id, template_key),
  CONSTRAINT valid_template_category CHECK (template_category IN (
    'onboarding', 'offboarding', 'compliance', 'benefits', 'payroll',
    'performance', 'timesheet', 'visa', 'ticket', 'newsletter', 'general'
  ))
);

CREATE INDEX idx_hrms_email_templates_tenant ON hrms_email_templates(tenant_id);
CREATE INDEX idx_hrms_email_templates_key ON hrms_email_templates(template_key);
CREATE INDEX idx_hrms_email_templates_category ON hrms_email_templates(template_category);
CREATE INDEX idx_hrms_email_templates_active ON hrms_email_templates(is_active) WHERE is_active = true;

-- =====================================================
-- 3. hrms_newsletters (Newsletter Management)
-- =====================================================
CREATE TABLE hrms_newsletters (
  newsletter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE SET NULL,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  content_html TEXT NOT NULL,
  content_text TEXT,
  
  -- Audience
  target_employee_types VARCHAR(50)[],
  target_employees UUID[],
  target_departments VARCHAR(100)[],
  
  -- Scheduling
  scheduled_send_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Status
  newsletter_status VARCHAR(50) DEFAULT 'draft',
  
  -- Stats
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  
  -- AI Generation
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt_used TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_newsletter_status CHECK (newsletter_status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled'))
);

CREATE INDEX idx_hrms_newsletters_tenant ON hrms_newsletters(tenant_id);
CREATE INDEX idx_hrms_newsletters_business ON hrms_newsletters(business_id);
CREATE INDEX idx_hrms_newsletters_status ON hrms_newsletters(newsletter_status);
CREATE INDEX idx_hrms_newsletters_scheduled ON hrms_newsletters(scheduled_send_at) WHERE newsletter_status = 'scheduled';
CREATE INDEX idx_hrms_newsletters_created ON hrms_newsletters(created_at DESC);

-- =====================================================
-- 4. hrms_suggestions (Ideas & Suggestions)
-- =====================================================
CREATE TABLE hrms_suggestions (
  suggestion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Submitted By
  submitted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_by_employee_id UUID REFERENCES hrms_employees(employee_id) ON DELETE SET NULL,
  
  -- Suggestion Details
  suggestion_type VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'submitted',
  priority VARCHAR(20) DEFAULT 'medium',
  
  -- Admin Response
  admin_response TEXT,
  admin_user_id UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Voting (optional)
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_suggestion_type CHECK (suggestion_type IS NULL OR suggestion_type IN (
    'feature', 'improvement', 'bug_report', 'feedback', 'process', 'policy', 'other'
  )),
  CONSTRAINT valid_suggestion_status CHECK (status IN (
    'submitted', 'under_review', 'approved', 'rejected', 'implemented', 'deferred'
  )),
  CONSTRAINT valid_suggestion_priority CHECK (priority IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX idx_hrms_suggestions_tenant ON hrms_suggestions(tenant_id);
CREATE INDEX idx_hrms_suggestions_status ON hrms_suggestions(status);
CREATE INDEX idx_hrms_suggestions_type ON hrms_suggestions(suggestion_type);
CREATE INDEX idx_hrms_suggestions_user ON hrms_suggestions(submitted_by_user_id);
CREATE INDEX idx_hrms_suggestions_created ON hrms_suggestions(created_at DESC);

-- =====================================================
-- 5. hrms_issue_reports (Issue Tracking)
-- =====================================================
CREATE TABLE hrms_issue_reports (
  issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Reported By
  reported_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_by_employee_id UUID REFERENCES hrms_employees(employee_id) ON DELETE SET NULL,
  
  -- Issue Details
  issue_type VARCHAR(50),
  severity VARCHAR(20) DEFAULT 'medium',
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  
  -- Environment
  browser VARCHAR(100),
  os VARCHAR(100),
  screen_resolution VARCHAR(50),
  page_url TEXT,
  screenshot_paths TEXT[],
  
  -- Status
  status VARCHAR(50) DEFAULT 'open',
  
  -- Resolution
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_issue_type CHECK (issue_type IS NULL OR issue_type IN (
    'bug', 'error', 'access_issue', 'data_issue', 'performance', 'ui_ux', 'other'
  )),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_issue_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix', 'duplicate'))
);

CREATE INDEX idx_hrms_issues_tenant ON hrms_issue_reports(tenant_id);
CREATE INDEX idx_hrms_issues_status ON hrms_issue_reports(status);
CREATE INDEX idx_hrms_issues_severity ON hrms_issue_reports(severity);
CREATE INDEX idx_hrms_issues_type ON hrms_issue_reports(issue_type);
CREATE INDEX idx_hrms_issues_user ON hrms_issue_reports(reported_by_user_id);
CREATE INDEX idx_hrms_issues_created ON hrms_issue_reports(created_at DESC);

-- =====================================================
-- 6. hrms_ai_prompts (AI Prompts for Newsletter Generation)
-- =====================================================
CREATE TABLE hrms_ai_prompts (
  prompt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE SET NULL,
  
  -- Prompt Identification
  prompt_name VARCHAR(255) NOT NULL,
  prompt_key VARCHAR(100) NOT NULL,
  prompt_description TEXT,
  
  -- AI Configuration
  system_prompt TEXT NOT NULL,
  ai_model VARCHAR(100) DEFAULT 'claude-3.5-sonnet',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  
  -- Prompt Category
  prompt_category VARCHAR(50) DEFAULT 'newsletter',
  
  -- Variables (JSONB array of available placeholders for user input)
  available_variables JSONB,
  
  -- Usage Stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Status
  is_system_prompt BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT unique_prompt_key_per_tenant UNIQUE (tenant_id, prompt_key),
  CONSTRAINT valid_temperature CHECK (temperature >= 0.0 AND temperature <= 2.0),
  CONSTRAINT valid_max_tokens CHECK (max_tokens >= 100 AND max_tokens <= 8000),
  CONSTRAINT valid_prompt_category CHECK (prompt_category IN (
    'newsletter', 'email', 'document', 'summary', 'analysis', 'other'
  ))
);

CREATE INDEX idx_hrms_ai_prompts_tenant ON hrms_ai_prompts(tenant_id);
CREATE INDEX idx_hrms_ai_prompts_business ON hrms_ai_prompts(business_id);
CREATE INDEX idx_hrms_ai_prompts_key ON hrms_ai_prompts(prompt_key);
CREATE INDEX idx_hrms_ai_prompts_category ON hrms_ai_prompts(prompt_category);
CREATE INDEX idx_hrms_ai_prompts_active ON hrms_ai_prompts(is_active) WHERE is_active = true;

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE TRIGGER trg_hrms_email_templates_updated_at
  BEFORE UPDATE ON hrms_email_templates
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_newsletters_updated_at
  BEFORE UPDATE ON hrms_newsletters
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_suggestions_updated_at
  BEFORE UPDATE ON hrms_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_issue_reports_updated_at
  BEFORE UPDATE ON hrms_issue_reports
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_ai_prompts_updated_at
  BEFORE UPDATE ON hrms_ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE hrms_notifications IS 'System notifications for users and employees';
COMMENT ON TABLE hrms_email_templates IS 'Configurable email templates with variable placeholders';
COMMENT ON TABLE hrms_newsletters IS 'Newsletter management with AI generation support';
COMMENT ON TABLE hrms_suggestions IS 'Employee ideas and suggestions with voting';
COMMENT ON TABLE hrms_issue_reports IS 'Issue/bug tracking for the HRMS system';
COMMENT ON TABLE hrms_ai_prompts IS 'AI prompt templates for newsletter and content generation';
