-- =====================================================
-- HRMS Row Level Security Policies Migration
-- =====================================================
-- Enable RLS and create policies for ALL HRMS tables
-- =====================================================

-- =====================================================
-- Enable RLS on ALL HRMS tables
-- =====================================================

ALTER TABLE hrms_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_employee_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_employee_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_checklist_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_checklist_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_project_rate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_project_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_timesheet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_lca_job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_visa_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_compliance_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_employee_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_background_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_performance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_ticket_request_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_ticket_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_issue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE hrms_ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_hrms_contact_bridge ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Helper Function: Get User's Tenant ID
-- =====================================================
CREATE OR REPLACE FUNCTION fn_get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper Function: Check if User is Super Admin
-- =====================================================
CREATE OR REPLACE FUNCTION fn_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
      AND role_level >= 5
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STANDARD TENANT ISOLATION POLICIES
-- Applied to most tables
-- =====================================================

-- ========================
-- hrms_employees
-- ========================
CREATE POLICY "hrms_employees_tenant_select" ON hrms_employees
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_employees_tenant_insert" ON hrms_employees
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_employees_tenant_update" ON hrms_employees
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id())
  WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_employees_tenant_delete" ON hrms_employees
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_employee_addresses
-- ========================
CREATE POLICY "hrms_employee_addresses_tenant_select" ON hrms_employee_addresses
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_employee_addresses_tenant_insert" ON hrms_employee_addresses
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_employee_addresses_tenant_update" ON hrms_employee_addresses
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_employee_addresses_tenant_delete" ON hrms_employee_addresses
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_employee_sequences
-- ========================
CREATE POLICY "hrms_employee_sequences_tenant_select" ON hrms_employee_sequences
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_employee_sequences_tenant_insert" ON hrms_employee_sequences
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_employee_sequences_tenant_update" ON hrms_employee_sequences
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_checklist_types
-- ========================
CREATE POLICY "hrms_checklist_types_tenant_select" ON hrms_checklist_types
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_checklist_types_tenant_insert" ON hrms_checklist_types
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_checklist_types_tenant_update" ON hrms_checklist_types
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_checklist_types_tenant_delete" ON hrms_checklist_types
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id() AND is_system_type = false);

-- ========================
-- hrms_checklist_templates
-- ========================
CREATE POLICY "hrms_checklist_templates_tenant_select" ON hrms_checklist_templates
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_checklist_templates_tenant_insert" ON hrms_checklist_templates
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_checklist_templates_tenant_update" ON hrms_checklist_templates
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_checklist_templates_tenant_delete" ON hrms_checklist_templates
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_checklist_groups
-- ========================
CREATE POLICY "hrms_checklist_groups_tenant_select" ON hrms_checklist_groups
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_checklist_groups_tenant_insert" ON hrms_checklist_groups
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_checklist_groups_tenant_update" ON hrms_checklist_groups
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_checklist_groups_tenant_delete" ON hrms_checklist_groups
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_checklist_items
-- ========================
CREATE POLICY "hrms_checklist_items_tenant_select" ON hrms_checklist_items
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_checklist_items_tenant_insert" ON hrms_checklist_items
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_checklist_items_tenant_update" ON hrms_checklist_items
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_checklist_items_tenant_delete" ON hrms_checklist_items
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_documents
-- ========================
CREATE POLICY "hrms_documents_tenant_select" ON hrms_documents
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_documents_tenant_insert" ON hrms_documents
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_documents_tenant_update" ON hrms_documents
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_documents_tenant_delete" ON hrms_documents
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_vendors
-- ========================
CREATE POLICY "hrms_vendors_tenant_select" ON hrms_vendors
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_vendors_tenant_insert" ON hrms_vendors
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_vendors_tenant_update" ON hrms_vendors
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_vendors_tenant_delete" ON hrms_vendors
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_projects
-- ========================
CREATE POLICY "hrms_projects_tenant_select" ON hrms_projects
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_projects_tenant_insert" ON hrms_projects
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_projects_tenant_update" ON hrms_projects
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_projects_tenant_delete" ON hrms_projects
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_project_rate_history
-- ========================
CREATE POLICY "hrms_project_rate_history_tenant_select" ON hrms_project_rate_history
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_project_rate_history_tenant_insert" ON hrms_project_rate_history
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_project_rate_history_tenant_update" ON hrms_project_rate_history
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_project_vendors
-- ========================
CREATE POLICY "hrms_project_vendors_tenant_select" ON hrms_project_vendors
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_project_vendors_tenant_insert" ON hrms_project_vendors
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_project_vendors_tenant_update" ON hrms_project_vendors
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_project_vendors_tenant_delete" ON hrms_project_vendors
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_timesheets
-- ========================
CREATE POLICY "hrms_timesheets_tenant_select" ON hrms_timesheets
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_timesheets_tenant_insert" ON hrms_timesheets
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_timesheets_tenant_update" ON hrms_timesheets
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_timesheets_tenant_delete" ON hrms_timesheets
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_timesheet_entries
-- ========================
CREATE POLICY "hrms_timesheet_entries_select" ON hrms_timesheet_entries
  FOR SELECT USING (
    timesheet_id IN (
      SELECT timesheet_id FROM hrms_timesheets 
      WHERE tenant_id = fn_get_user_tenant_id()
    )
  );

CREATE POLICY "hrms_timesheet_entries_insert" ON hrms_timesheet_entries
  FOR INSERT WITH CHECK (
    timesheet_id IN (
      SELECT timesheet_id FROM hrms_timesheets 
      WHERE tenant_id = fn_get_user_tenant_id()
    )
  );

CREATE POLICY "hrms_timesheet_entries_update" ON hrms_timesheet_entries
  FOR UPDATE USING (
    timesheet_id IN (
      SELECT timesheet_id FROM hrms_timesheets 
      WHERE tenant_id = fn_get_user_tenant_id()
    )
  );

CREATE POLICY "hrms_timesheet_entries_delete" ON hrms_timesheet_entries
  FOR DELETE USING (
    timesheet_id IN (
      SELECT timesheet_id FROM hrms_timesheets 
      WHERE tenant_id = fn_get_user_tenant_id()
    )
  );

-- ========================
-- hrms_lca_job_titles
-- ========================
CREATE POLICY "hrms_lca_job_titles_tenant_select" ON hrms_lca_job_titles
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_lca_job_titles_tenant_insert" ON hrms_lca_job_titles
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_lca_job_titles_tenant_update" ON hrms_lca_job_titles
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_lca_job_titles_tenant_delete" ON hrms_lca_job_titles
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_visa_statuses
-- ========================
CREATE POLICY "hrms_visa_statuses_tenant_select" ON hrms_visa_statuses
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_visa_statuses_tenant_insert" ON hrms_visa_statuses
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_visa_statuses_tenant_update" ON hrms_visa_statuses
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_visa_statuses_tenant_delete" ON hrms_visa_statuses
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_dependents
-- ========================
CREATE POLICY "hrms_dependents_tenant_select" ON hrms_dependents
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_dependents_tenant_insert" ON hrms_dependents
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_dependents_tenant_update" ON hrms_dependents
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_dependents_tenant_delete" ON hrms_dependents
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_compliance_items
-- ========================
CREATE POLICY "hrms_compliance_items_tenant_select" ON hrms_compliance_items
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_compliance_items_tenant_insert" ON hrms_compliance_items
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_compliance_items_tenant_update" ON hrms_compliance_items
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_compliance_items_tenant_delete" ON hrms_compliance_items
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_compliance_reminders
-- ========================
CREATE POLICY "hrms_compliance_reminders_tenant_select" ON hrms_compliance_reminders
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_compliance_reminders_tenant_insert" ON hrms_compliance_reminders
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_compliance_reminders_tenant_update" ON hrms_compliance_reminders
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_compliance_reminders_tenant_delete" ON hrms_compliance_reminders
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_employee_resumes
-- ========================
CREATE POLICY "hrms_employee_resumes_tenant_select" ON hrms_employee_resumes
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_employee_resumes_tenant_insert" ON hrms_employee_resumes
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_employee_resumes_tenant_update" ON hrms_employee_resumes
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_employee_resumes_tenant_delete" ON hrms_employee_resumes
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_background_checks
-- ========================
CREATE POLICY "hrms_background_checks_tenant_select" ON hrms_background_checks
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_background_checks_tenant_insert" ON hrms_background_checks
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_background_checks_tenant_update" ON hrms_background_checks
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_background_checks_tenant_delete" ON hrms_background_checks
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_performance_reports
-- ========================
CREATE POLICY "hrms_performance_reports_tenant_select" ON hrms_performance_reports
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_performance_reports_tenant_insert" ON hrms_performance_reports
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_performance_reports_tenant_update" ON hrms_performance_reports
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_performance_reports_tenant_delete" ON hrms_performance_reports
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_ticket_request_types
-- ========================
CREATE POLICY "hrms_ticket_request_types_tenant_select" ON hrms_ticket_request_types
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ticket_request_types_tenant_insert" ON hrms_ticket_request_types
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ticket_request_types_tenant_update" ON hrms_ticket_request_types
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ticket_request_types_tenant_delete" ON hrms_ticket_request_types
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id() AND is_system_type = false);

-- ========================
-- hrms_ticket_sequences
-- ========================
CREATE POLICY "hrms_ticket_sequences_tenant_select" ON hrms_ticket_sequences
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ticket_sequences_tenant_insert" ON hrms_ticket_sequences
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ticket_sequences_tenant_update" ON hrms_ticket_sequences
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_tickets
-- ========================
CREATE POLICY "hrms_tickets_tenant_select" ON hrms_tickets
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_tickets_tenant_insert" ON hrms_tickets
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_tickets_tenant_update" ON hrms_tickets
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_tickets_tenant_delete" ON hrms_tickets
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_ticket_comments
-- ========================
CREATE POLICY "hrms_ticket_comments_tenant_select" ON hrms_ticket_comments
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ticket_comments_tenant_insert" ON hrms_ticket_comments
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ticket_comments_tenant_update" ON hrms_ticket_comments
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ticket_comments_tenant_delete" ON hrms_ticket_comments
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_ticket_attachments
-- ========================
CREATE POLICY "hrms_ticket_attachments_tenant_select" ON hrms_ticket_attachments
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ticket_attachments_tenant_insert" ON hrms_ticket_attachments
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ticket_attachments_tenant_delete" ON hrms_ticket_attachments
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_ticket_status_history
-- ========================
CREATE POLICY "hrms_ticket_status_history_tenant_select" ON hrms_ticket_status_history
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ticket_status_history_tenant_insert" ON hrms_ticket_status_history
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_notifications
-- ========================
CREATE POLICY "hrms_notifications_tenant_select" ON hrms_notifications
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_notifications_tenant_insert" ON hrms_notifications
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_notifications_tenant_update" ON hrms_notifications
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_notifications_tenant_delete" ON hrms_notifications
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_email_templates
-- ========================
CREATE POLICY "hrms_email_templates_tenant_select" ON hrms_email_templates
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_email_templates_tenant_insert" ON hrms_email_templates
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_email_templates_tenant_update" ON hrms_email_templates
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_email_templates_tenant_delete" ON hrms_email_templates
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id() AND is_system_template = false);

-- ========================
-- hrms_newsletters
-- ========================
CREATE POLICY "hrms_newsletters_tenant_select" ON hrms_newsletters
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_newsletters_tenant_insert" ON hrms_newsletters
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_newsletters_tenant_update" ON hrms_newsletters
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_newsletters_tenant_delete" ON hrms_newsletters
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_suggestions
-- ========================
CREATE POLICY "hrms_suggestions_tenant_select" ON hrms_suggestions
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_suggestions_tenant_insert" ON hrms_suggestions
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_suggestions_tenant_update" ON hrms_suggestions
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_suggestions_tenant_delete" ON hrms_suggestions
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_issue_reports
-- ========================
CREATE POLICY "hrms_issue_reports_tenant_select" ON hrms_issue_reports
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_issue_reports_tenant_insert" ON hrms_issue_reports
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_issue_reports_tenant_update" ON hrms_issue_reports
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_issue_reports_tenant_delete" ON hrms_issue_reports
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- ========================
-- hrms_ai_prompts
-- ========================
CREATE POLICY "hrms_ai_prompts_tenant_select" ON hrms_ai_prompts
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ai_prompts_tenant_insert" ON hrms_ai_prompts
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ai_prompts_tenant_update" ON hrms_ai_prompts
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "hrms_ai_prompts_tenant_delete" ON hrms_ai_prompts
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id() AND is_system_prompt = false);

-- ========================
-- crm_hrms_contact_bridge
-- ========================
CREATE POLICY "crm_hrms_contact_bridge_tenant_select" ON crm_hrms_contact_bridge
  FOR SELECT USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "crm_hrms_contact_bridge_tenant_insert" ON crm_hrms_contact_bridge
  FOR INSERT WITH CHECK (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "crm_hrms_contact_bridge_tenant_update" ON crm_hrms_contact_bridge
  FOR UPDATE USING (tenant_id = fn_get_user_tenant_id());

CREATE POLICY "crm_hrms_contact_bridge_tenant_delete" ON crm_hrms_contact_bridge
  FOR DELETE USING (tenant_id = fn_get_user_tenant_id());

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION fn_get_user_tenant_id() IS 'Helper function to get current user tenant_id for RLS policies';
COMMENT ON FUNCTION fn_is_super_admin() IS 'Helper function to check if current user is super admin';
