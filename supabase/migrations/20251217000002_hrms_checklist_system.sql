-- =====================================================
-- HRMS Universal Checklist System Migration
-- =====================================================
-- Tables: hrms_checklist_types, hrms_checklist_templates, 
--         hrms_checklist_groups, hrms_checklist_items, hrms_documents
-- =====================================================

-- =====================================================
-- 1. hrms_checklist_types (Admin-Configurable Checklist Types)
-- =====================================================
CREATE TABLE hrms_checklist_types (
  checklist_type_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  
  -- Type Definition
  type_code VARCHAR(100) NOT NULL,
  type_name VARCHAR(255) NOT NULL,
  type_description TEXT,
  
  -- Entity Mapping Configuration
  target_entity_type VARCHAR(100) NOT NULL,
  target_table_name VARCHAR(100) NOT NULL,
  target_id_column VARCHAR(100) NOT NULL,
  
  -- Display Configuration
  icon VARCHAR(50),
  color_code VARCHAR(20),
  display_order INTEGER DEFAULT 0,
  
  -- Behavior Flags
  allow_multiple_templates BOOLEAN DEFAULT true,
  require_employee_type BOOLEAN DEFAULT false,
  enable_ai_parsing BOOLEAN DEFAULT true,
  enable_compliance_tracking BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_system_type BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_target_entity CHECK (target_entity_type IN ('employee', 'project', 'timesheet', 'compliance', 'visa', 'background_check', 'performance', 'custom')),
  CONSTRAINT unique_type_code_per_tenant UNIQUE (tenant_id, type_code)
);

CREATE INDEX idx_hrms_checklist_types_tenant ON hrms_checklist_types(tenant_id);
CREATE INDEX idx_hrms_checklist_types_code ON hrms_checklist_types(type_code);
CREATE INDEX idx_hrms_checklist_types_entity ON hrms_checklist_types(target_entity_type);
CREATE INDEX idx_hrms_checklist_types_active ON hrms_checklist_types(is_active) WHERE is_active = true;

-- =====================================================
-- 2. hrms_checklist_templates (Universal Checklist Templates)
-- =====================================================
CREATE TABLE hrms_checklist_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE SET NULL,
  
  template_name VARCHAR(255) NOT NULL,
  
  -- Link to Checklist Type (Dynamic, Admin-Defined)
  checklist_type_id UUID NOT NULL REFERENCES hrms_checklist_types(checklist_type_id) ON DELETE CASCADE,
  
  -- Optional: Employee Type (required if checklist_type.require_employee_type = true)
  employee_type VARCHAR(50),
  
  description TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT valid_employee_type CHECK (employee_type IS NULL OR employee_type IN ('internal_india', 'internal_usa', 'it_usa', 'nonit_usa', 'healthcare_usa'))
);

CREATE INDEX idx_hrms_checklist_templates_tenant ON hrms_checklist_templates(tenant_id);
CREATE INDEX idx_hrms_checklist_templates_business ON hrms_checklist_templates(business_id);
CREATE INDEX idx_hrms_checklist_templates_type ON hrms_checklist_templates(checklist_type_id);
CREATE INDEX idx_hrms_checklist_templates_employee_type ON hrms_checklist_templates(employee_type);
CREATE INDEX idx_hrms_checklist_templates_active ON hrms_checklist_templates(is_active) WHERE is_active = true;

-- =====================================================
-- 3. hrms_checklist_groups (Document Groups)
-- =====================================================
CREATE TABLE hrms_checklist_groups (
  group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES hrms_checklist_templates(template_id) ON DELETE CASCADE,
  
  group_name VARCHAR(255) NOT NULL,
  group_description TEXT,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_checklist_groups_tenant ON hrms_checklist_groups(tenant_id);
CREATE INDEX idx_hrms_checklist_groups_template ON hrms_checklist_groups(template_id);

-- =====================================================
-- 4. hrms_checklist_items (Checklist Item Definitions)
-- =====================================================
CREATE TABLE hrms_checklist_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES hrms_checklist_templates(template_id) ON DELETE CASCADE,
  group_id UUID REFERENCES hrms_checklist_groups(group_id) ON DELETE SET NULL,
  
  item_name VARCHAR(255),
  item_description TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Flags
  is_required BOOLEAN DEFAULT false,
  compliance_tracking_flag BOOLEAN DEFAULT false,
  visible_to_employee_flag BOOLEAN DEFAULT true,
  
  -- AI Document Parsing
  enable_ai_parsing BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hrms_checklist_items_tenant ON hrms_checklist_items(tenant_id);
CREATE INDEX idx_hrms_checklist_items_template ON hrms_checklist_items(template_id);
CREATE INDEX idx_hrms_checklist_items_group ON hrms_checklist_items(group_id);
CREATE INDEX idx_hrms_checklist_items_compliance ON hrms_checklist_items(compliance_tracking_flag) WHERE compliance_tracking_flag = true;

-- =====================================================
-- 5. hrms_documents (Universal Document Storage)
-- =====================================================
CREATE TABLE hrms_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(business_id) ON DELETE SET NULL,
  
  -- Universal Context References (polymorphic)
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Checklist Association
  checklist_item_id UUID REFERENCES hrms_checklist_items(item_id) ON DELETE SET NULL,
  
  -- Document Info
  document_name VARCHAR(255) NOT NULL,
  document_description TEXT,
  document_type VARCHAR(100),
  
  -- File Storage
  file_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(100),
  size_bytes BIGINT,
  
  -- Validity Dates (AI-parsed or manually entered)
  start_date DATE,
  expiry_date DATE,
  
  -- Flags
  compliance_tracking_flag BOOLEAN DEFAULT false,
  visible_to_employee_flag BOOLEAN DEFAULT true,
  is_current_version BOOLEAN DEFAULT true,
  
  -- AI Parsing Results (OpenRouter Claude)
  ai_parsed_data JSONB,
  ai_parsed_at TIMESTAMPTZ,
  ai_confidence_score DECIMAL(3,2),
  ai_model_used VARCHAR(100),
  
  -- Version Control
  version_number INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES hrms_documents(document_id) ON DELETE SET NULL,
  
  -- Additional Metadata (JSONB for flexibility)
  metadata JSONB,
  
  -- Status
  document_status VARCHAR(50) DEFAULT 'active',
  
  -- Audit
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_expiry_date CHECK (expiry_date IS NULL OR start_date IS NULL OR expiry_date >= start_date),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('employee', 'project', 'timesheet', 'compliance', 'custom')),
  CONSTRAINT valid_document_status CHECK (document_status IN ('active', 'expired', 'superseded', 'archived'))
);

CREATE INDEX idx_hrms_docs_tenant ON hrms_documents(tenant_id);
CREATE INDEX idx_hrms_docs_business ON hrms_documents(business_id);
CREATE INDEX idx_hrms_docs_entity ON hrms_documents(entity_type, entity_id);
CREATE INDEX idx_hrms_docs_checklist ON hrms_documents(checklist_item_id);
CREATE INDEX idx_hrms_docs_type ON hrms_documents(document_type);
CREATE INDEX idx_hrms_docs_expiry ON hrms_documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_hrms_docs_compliance ON hrms_documents(compliance_tracking_flag, expiry_date) WHERE compliance_tracking_flag = true;
CREATE INDEX idx_hrms_docs_current ON hrms_documents(is_current_version) WHERE is_current_version = true;

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE TRIGGER trg_hrms_checklist_types_updated_at
  BEFORE UPDATE ON hrms_checklist_types
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_checklist_templates_updated_at
  BEFORE UPDATE ON hrms_checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_checklist_groups_updated_at
  BEFORE UPDATE ON hrms_checklist_groups
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_checklist_items_updated_at
  BEFORE UPDATE ON hrms_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

CREATE TRIGGER trg_hrms_documents_updated_at
  BEFORE UPDATE ON hrms_documents
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_hrms_timestamp();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE hrms_checklist_types IS 'Admin-configurable checklist type definitions with entity mapping';
COMMENT ON TABLE hrms_checklist_templates IS 'Universal checklist templates linked to checklist types';
COMMENT ON TABLE hrms_checklist_groups IS 'Grouping mechanism for organizing checklist items';
COMMENT ON TABLE hrms_checklist_items IS 'Individual checklist items within groups';
COMMENT ON TABLE hrms_documents IS 'Universal document storage with polymorphic entity reference';
