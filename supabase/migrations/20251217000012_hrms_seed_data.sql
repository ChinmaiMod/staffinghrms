-- =====================================================
-- HRMS Seed Data Migration
-- =====================================================
-- Seeds: Checklist types, Ticket request types, LCA job titles, AI prompts
-- =====================================================

-- =====================================================
-- 1. Seed Default Checklist Types
-- =====================================================
-- Note: These will be inserted per-tenant when a tenant is created
-- This is a template for initial system types

INSERT INTO hrms_checklist_types (
  tenant_id, type_code, type_name, type_description, 
  target_entity_type, target_table_name, target_id_column, 
  icon, color_code, require_employee_type, is_system_type, is_active
) 
SELECT 
  t.tenant_id,
  type_code,
  type_name,
  type_description,
  target_entity_type,
  target_table_name,
  target_id_column,
  icon,
  color_code,
  require_employee_type,
  true as is_system_type,
  true as is_active
FROM tenants t
CROSS JOIN (VALUES
  ('immigration', 'Immigration Documents', 'Employee immigration and visa documents', 'employee', 'hrms_employees', 'employee_id', 'passport', '#3B82F6', true),
  ('project', 'Project Documents', 'Project-related documents (MSA, PO, COI, SOW)', 'project', 'hrms_projects', 'project_id', 'briefcase', '#10B981', false),
  ('timesheet', 'Timesheet Documents', 'Timesheet supporting documents and attachments', 'timesheet', 'hrms_timesheets', 'timesheet_id', 'clock', '#F59E0B', false),
  ('compliance', 'Compliance Documents', 'Regulatory and compliance documents', 'compliance', 'hrms_compliance_items', 'compliance_id', 'shield-check', '#EF4444', false),
  ('onboarding', 'Employee Onboarding', 'New hire onboarding documents', 'employee', 'hrms_employees', 'employee_id', 'user-plus', '#8B5CF6', false),
  ('offboarding', 'Employee Offboarding', 'Employee exit and offboarding documents', 'employee', 'hrms_employees', 'employee_id', 'user-minus', '#6B7280', false),
  ('background_check', 'Background Checks', 'Background verification documents', 'employee', 'hrms_background_checks', 'background_check_id', 'search', '#EC4899', false),
  ('performance', 'Performance Reviews', 'Performance review supporting documents', 'employee', 'hrms_performance_reports', 'report_id', 'chart-bar', '#14B8A6', false)
) AS seed(type_code, type_name, type_description, target_entity_type, target_table_name, target_id_column, icon, color_code, require_employee_type)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. Seed Default Ticket Request Types
-- =====================================================
-- HR Department Request Types
INSERT INTO hrms_ticket_request_types (
  tenant_id, type_code, type_name, type_description, department, display_order, is_system_type, is_active
)
SELECT 
  t.tenant_id,
  type_code,
  type_name,
  type_description,
  department,
  display_order,
  true as is_system_type,
  true as is_active
FROM tenants t
CROSS JOIN (VALUES
  -- HR Request Types
  ('offer_letter', 'Offer Letter', 'Request for new/updated offer letter', 'HR', 1),
  ('employment_verification', 'Employment Verification', 'Letter for background check, mortgage, etc.', 'HR', 2),
  ('payroll_discrepancy', 'Payroll Discrepancy', 'Issue with pay, deductions, overtime', 'HR', 3),
  ('benefits_inquiry', 'Benefits Inquiry', 'Health insurance, 401k, PTO questions', 'HR', 4),
  ('leave_request', 'Leave Request', 'FMLA, personal leave, extended absence', 'HR', 5),
  ('tax_forms', 'Tax Forms', 'W2, W4 updates, tax withholding', 'HR', 6),
  ('address_change', 'Address Change', 'Update personal/mailing address', 'HR', 7),
  ('direct_deposit_change', 'Direct Deposit Change', 'Update bank account information', 'HR', 8),
  ('policy_clarification', 'Policy Clarification', 'Questions about company policies', 'HR', 9),
  ('other_hr', 'Other HR Request', 'General HR-related requests', 'HR', 99),
  
  -- Immigration Request Types
  ('gc_processing', 'GC Processing', 'Green Card application status/questions', 'Immigration', 1),
  ('h1b_transfer', 'H1B Transfer', 'H1B visa transfer inquiry', 'Immigration', 2),
  ('h1b_extension', 'H1B Extension', 'H1B extension filing request', 'Immigration', 3),
  ('h1b_amendment', 'H1B Amendment', 'H1B amendment for job/location change', 'Immigration', 4),
  ('i9_reverification', 'I-9 Reverification', 'I-9 document update/reverification', 'Immigration', 5),
  ('visa_stamping', 'Visa Stamping', 'Visa stamping appointment assistance', 'Immigration', 6),
  ('travel_authorization', 'Travel Authorization', 'AP/EAD travel document request', 'Immigration', 7),
  ('lca_questions', 'LCA Questions', 'Labor Condition Application inquiries', 'Immigration', 8),
  ('perm_processing', 'PERM Processing', 'PERM labor certification questions', 'Immigration', 9),
  ('dependent_visa', 'Dependent Visa', 'H4/L2 dependent visa questions', 'Immigration', 10),
  ('status_update', 'Status Update', 'General case status inquiry', 'Immigration', 11),
  ('other_immigration', 'Other Immigration', 'General immigration-related requests', 'Immigration', 99)
) AS seed(type_code, type_name, type_description, department, display_order)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. Seed LCA Job Titles
-- =====================================================
INSERT INTO hrms_lca_job_titles (
  tenant_id, lca_job_title, soc_code, soc_title, wage_level, wage_level_description, is_active
)
SELECT 
  t.tenant_id,
  lca_job_title,
  soc_code,
  soc_title,
  wage_level,
  wage_level_description,
  true as is_active
FROM tenants t
CROSS JOIN (VALUES
  -- Software Development
  ('Software Developer', '15-1252', 'Software Developers', 2, 'Level 2 - Qualified'),
  ('Senior Software Developer', '15-1252', 'Software Developers', 3, 'Level 3 - Experienced'),
  ('Lead Software Developer', '15-1252', 'Software Developers', 4, 'Level 4 - Fully Competent'),
  ('Software Engineer', '15-1252', 'Software Developers', 2, 'Level 2 - Qualified'),
  ('Senior Software Engineer', '15-1252', 'Software Developers', 3, 'Level 3 - Experienced'),
  ('Principal Software Engineer', '15-1252', 'Software Developers', 4, 'Level 4 - Fully Competent'),
  
  -- Systems Analysis
  ('Computer Systems Analyst', '15-1211', 'Computer Systems Analysts', 2, 'Level 2 - Qualified'),
  ('Senior Systems Analyst', '15-1211', 'Computer Systems Analysts', 3, 'Level 3 - Experienced'),
  ('Business Systems Analyst', '15-1211', 'Computer Systems Analysts', 2, 'Level 2 - Qualified'),
  ('Technical Business Analyst', '15-1211', 'Computer Systems Analysts', 3, 'Level 3 - Experienced'),
  
  -- Database
  ('Database Administrator', '15-1242', 'Database Administrators and Architects', 2, 'Level 2 - Qualified'),
  ('Senior Database Administrator', '15-1242', 'Database Administrators and Architects', 3, 'Level 3 - Experienced'),
  ('Database Architect', '15-1242', 'Database Administrators and Architects', 4, 'Level 4 - Fully Competent'),
  
  -- Network/Infrastructure
  ('Network Engineer', '15-1244', 'Network and Computer Systems Administrators', 2, 'Level 2 - Qualified'),
  ('Senior Network Engineer', '15-1244', 'Network and Computer Systems Administrators', 3, 'Level 3 - Experienced'),
  ('Systems Administrator', '15-1244', 'Network and Computer Systems Administrators', 2, 'Level 2 - Qualified'),
  ('Senior Systems Administrator', '15-1244', 'Network and Computer Systems Administrators', 3, 'Level 3 - Experienced'),
  
  -- Security
  ('Information Security Analyst', '15-1212', 'Information Security Analysts', 2, 'Level 2 - Qualified'),
  ('Senior Security Analyst', '15-1212', 'Information Security Analysts', 3, 'Level 3 - Experienced'),
  ('Cybersecurity Engineer', '15-1212', 'Information Security Analysts', 3, 'Level 3 - Experienced'),
  ('Security Architect', '15-1212', 'Information Security Analysts', 4, 'Level 4 - Fully Competent'),
  
  -- Data Science/Analytics
  ('Data Scientist', '15-2051', 'Data Scientists', 2, 'Level 2 - Qualified'),
  ('Senior Data Scientist', '15-2051', 'Data Scientists', 3, 'Level 3 - Experienced'),
  ('Data Analyst', '15-2051', 'Data Scientists', 2, 'Level 2 - Qualified'),
  ('Business Intelligence Analyst', '15-2051', 'Data Scientists', 2, 'Level 2 - Qualified'),
  ('Machine Learning Engineer', '15-2051', 'Data Scientists', 3, 'Level 3 - Experienced'),
  
  -- Web Development
  ('Web Developer', '15-1254', 'Web Developers and Digital Interface Designers', 2, 'Level 2 - Qualified'),
  ('Senior Web Developer', '15-1254', 'Web Developers and Digital Interface Designers', 3, 'Level 3 - Experienced'),
  ('Full Stack Developer', '15-1254', 'Web Developers and Digital Interface Designers', 3, 'Level 3 - Experienced'),
  ('Frontend Developer', '15-1254', 'Web Developers and Digital Interface Designers', 2, 'Level 2 - Qualified'),
  ('UI/UX Designer', '15-1254', 'Web Developers and Digital Interface Designers', 2, 'Level 2 - Qualified'),
  
  -- Management/Other
  ('IT Project Manager', '15-1299', 'Computer Occupations, All Other', 3, 'Level 3 - Experienced'),
  ('Technical Lead', '15-1299', 'Computer Occupations, All Other', 3, 'Level 3 - Experienced'),
  ('DevOps Engineer', '15-1299', 'Computer Occupations, All Other', 3, 'Level 3 - Experienced'),
  ('Cloud Engineer', '15-1299', 'Computer Occupations, All Other', 3, 'Level 3 - Experienced'),
  ('Site Reliability Engineer', '15-1299', 'Computer Occupations, All Other', 3, 'Level 3 - Experienced'),
  
  -- QA/Testing
  ('QA Engineer', '15-1253', 'Software Quality Assurance Analysts and Testers', 2, 'Level 2 - Qualified'),
  ('Senior QA Engineer', '15-1253', 'Software Quality Assurance Analysts and Testers', 3, 'Level 3 - Experienced'),
  ('Test Automation Engineer', '15-1253', 'Software Quality Assurance Analysts and Testers', 3, 'Level 3 - Experienced'),
  ('QA Lead', '15-1253', 'Software Quality Assurance Analysts and Testers', 3, 'Level 3 - Experienced')
) AS seed(lca_job_title, soc_code, soc_title, wage_level, wage_level_description)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. Seed Default AI Prompts
-- =====================================================
INSERT INTO hrms_ai_prompts (
  tenant_id, prompt_name, prompt_key, prompt_description, system_prompt, 
  prompt_category, is_system_prompt, is_active, available_variables
)
SELECT 
  t.tenant_id,
  prompt_name,
  prompt_key,
  prompt_description,
  system_prompt,
  prompt_category,
  true as is_system_prompt,
  true as is_active,
  available_variables::jsonb
FROM tenants t
CROSS JOIN (VALUES
  (
    'Monthly Company Update',
    'monthly_company_update',
    'Generate a polished monthly newsletter for company-wide updates',
    'You are a professional corporate communications writer. Generate a polished, engaging monthly newsletter based on the provided topic and description. Use a friendly yet professional tone. Include an engaging introduction, clear sections with headers, and a warm closing. Format the output as clean HTML suitable for email.',
    'newsletter',
    '[{"name": "topic", "description": "Newsletter Topic/Theme", "required": true}, {"name": "key_points", "description": "Key Points to Cover", "required": true}, {"name": "company_name", "description": "Company Name", "required": false}]'
  ),
  (
    'Weekly Team Digest',
    'weekly_team_digest',
    'Generate a brief weekly summary for team communications',
    'You are a professional corporate communications writer. Create a concise weekly digest newsletter. Keep it brief and scannable. Use bullet points for updates. Include a quick summary at the top. Format as clean HTML.',
    'newsletter',
    '[{"name": "week_highlights", "description": "Week Highlights", "required": true}, {"name": "upcoming_events", "description": "Upcoming Events", "required": false}]'
  ),
  (
    'Holiday Announcement',
    'holiday_announcement',
    'Generate holiday schedule announcements',
    'You are a professional HR communications writer. Create a warm, festive holiday announcement newsletter. Include holiday schedule details, office closure information, and appropriate seasonal greetings. Format as clean HTML.',
    'newsletter',
    '[{"name": "holiday_name", "description": "Holiday Name", "required": true}, {"name": "closure_dates", "description": "Office Closure Dates", "required": true}]'
  ),
  (
    'New Employee Welcome',
    'new_employee_welcome',
    'Generate welcome message for new employees',
    'You are a friendly HR representative. Create a warm, welcoming message for a new employee. Include team introduction, first day information, and express excitement about them joining. Keep it personal and encouraging. Format as clean HTML.',
    'email',
    '[{"name": "employee_name", "description": "New Employee Name", "required": true}, {"name": "start_date", "description": "Start Date", "required": true}, {"name": "department", "description": "Department", "required": false}, {"name": "manager_name", "description": "Manager Name", "required": false}]'
  ),
  (
    'Performance Review Summary',
    'performance_review_summary',
    'Generate performance review summary from notes',
    'You are an HR professional. Based on the provided performance notes, create a professional performance review summary. Include sections for strengths, areas for improvement, and goals. Be constructive and specific. Format as clean HTML.',
    'document',
    '[{"name": "employee_name", "description": "Employee Name", "required": true}, {"name": "review_notes", "description": "Performance Notes", "required": true}, {"name": "rating", "description": "Overall Rating", "required": false}]'
  ),
  (
    'Policy Update Announcement',
    'policy_update_announcement',
    'Generate announcement for policy updates',
    'You are an HR communications specialist. Create a clear, professional announcement about a policy update. Explain what is changing, why it is changing, when it takes effect, and any actions employees need to take. Format as clean HTML.',
    'newsletter',
    '[{"name": "policy_name", "description": "Policy Name", "required": true}, {"name": "changes", "description": "Summary of Changes", "required": true}, {"name": "effective_date", "description": "Effective Date", "required": true}]'
  )
) AS seed(prompt_name, prompt_key, prompt_description, system_prompt, prompt_category, available_variables)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. Seed Default Email Templates
-- =====================================================
INSERT INTO hrms_email_templates (
  tenant_id, template_name, template_key, template_category,
  subject, body_html, is_system_template, is_active, available_variables
)
SELECT 
  t.tenant_id,
  template_name,
  template_key,
  template_category,
  subject,
  body_html,
  true as is_system_template,
  true as is_active,
  available_variables::jsonb
FROM tenants t
CROSS JOIN (VALUES
  (
    'Welcome Email',
    'employee_welcome',
    'onboarding',
    'Welcome to {{company_name}}!',
    '<h1>Welcome to {{company_name}}, {{employee_name}}!</h1><p>We are excited to have you join our team. Your start date is {{start_date}}.</p><p>Please complete your onboarding documents before your first day.</p><p>Best regards,<br>HR Team</p>',
    '[{"name": "company_name"}, {"name": "employee_name"}, {"name": "start_date"}]'
  ),
  (
    'Document Expiry Reminder',
    'document_expiry_reminder',
    'compliance',
    'Action Required: {{document_name}} Expiring Soon',
    '<h2>Document Expiry Reminder</h2><p>Dear {{employee_name}},</p><p>Your {{document_name}} is expiring on {{expiry_date}}.</p><p>Please upload a renewed copy to avoid compliance issues.</p><p>Thank you,<br>HR Team</p>',
    '[{"name": "employee_name"}, {"name": "document_name"}, {"name": "expiry_date"}]'
  ),
  (
    'Ticket Created Confirmation',
    'ticket_created',
    'ticket',
    'Ticket #{{ticket_number}} Created: {{subject}}',
    '<h2>Your Support Ticket Has Been Created</h2><p>Dear {{employee_name}},</p><p>Your support ticket has been created and assigned to the {{assigned_team}} team.</p><p><strong>Ticket Number:</strong> {{ticket_number}}<br><strong>Subject:</strong> {{subject}}</p><p>We will respond as soon as possible.</p>',
    '[{"name": "employee_name"}, {"name": "ticket_number"}, {"name": "subject"}, {"name": "assigned_team"}]'
  ),
  (
    'Timesheet Reminder',
    'timesheet_reminder',
    'timesheet',
    'Reminder: Submit Your Timesheet for {{period}}',
    '<h2>Timesheet Submission Reminder</h2><p>Dear {{employee_name}},</p><p>This is a reminder to submit your timesheet for the period {{period}}.</p><p>Please submit by {{due_date}} to ensure timely processing.</p><p>Thank you,<br>HR Team</p>',
    '[{"name": "employee_name"}, {"name": "period"}, {"name": "due_date"}]'
  ),
  (
    'Performance Review Scheduled',
    'performance_review_scheduled',
    'performance',
    'Your Performance Review is Scheduled for {{review_date}}',
    '<h2>Performance Review Scheduled</h2><p>Dear {{employee_name}},</p><p>Your performance review has been scheduled for {{review_date}} with {{reviewer_name}}.</p><p>Please prepare by reviewing your goals and accomplishments for the review period.</p><p>Best regards,<br>HR Team</p>',
    '[{"name": "employee_name"}, {"name": "review_date"}, {"name": "reviewer_name"}]'
  )
) AS seed(template_name, template_key, template_category, subject, body_html, available_variables)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON COLUMN hrms_checklist_types.is_system_type IS 'System types are seeded defaults that cannot be deleted';
COMMENT ON COLUMN hrms_ticket_request_types.is_system_type IS 'System types are seeded defaults that cannot be deleted';
COMMENT ON COLUMN hrms_ai_prompts.is_system_prompt IS 'System prompts are seeded defaults that cannot be deleted';
COMMENT ON COLUMN hrms_email_templates.is_system_template IS 'System templates are seeded defaults that cannot be deleted';
