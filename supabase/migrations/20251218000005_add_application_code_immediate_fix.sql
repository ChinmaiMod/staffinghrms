-- Immediate fix: Add application_code column to user_roles and menu_items
-- This migration can be run directly in Supabase SQL Editor if the previous migration wasn't applied

-- Add application_code to user_roles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'user_roles' 
    AND column_name = 'application_code'
  ) THEN
    ALTER TABLE user_roles 
    ADD COLUMN application_code VARCHAR(10) DEFAULT 'CRM';
    
    -- Create index for faster filtering
    CREATE INDEX IF NOT EXISTS idx_user_roles_application_code 
    ON user_roles(application_code);
    
    -- Update existing roles to be CRM-scoped
    UPDATE user_roles SET application_code = 'CRM' WHERE application_code IS NULL;
    
    -- Add NOT NULL constraint
    ALTER TABLE user_roles 
    ALTER COLUMN application_code SET NOT NULL;
  END IF;
END $$;

-- Add application_code to menu_items if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'menu_items' 
    AND column_name = 'application_code'
  ) THEN
    ALTER TABLE menu_items 
    ADD COLUMN application_code VARCHAR(10) DEFAULT 'CRM';
    
    -- Create index for faster filtering
    CREATE INDEX IF NOT EXISTS idx_menu_items_application_code 
    ON menu_items(application_code);
    
    -- Update existing menu items to be CRM-scoped
    UPDATE menu_items SET application_code = 'CRM' WHERE application_code IS NULL;
    
    -- Add NOT NULL constraint
    ALTER TABLE menu_items 
    ALTER COLUMN application_code SET NOT NULL;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN user_roles.application_code IS 'Application scope: CRM, HRMS, etc.';
COMMENT ON COLUMN menu_items.application_code IS 'Application scope: CRM, HRMS, etc.';

