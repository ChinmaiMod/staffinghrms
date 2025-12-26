-- Migration: Fix super admin role level to 5
-- Updates the fn_is_super_admin function to check for role_level >= 5
-- This aligns with the corrected role hierarchy:
-- Level 1: Read Only User
-- Level 2: HR Specialist / Immigration Specialist
-- Level 3: HR Manager / Immigration Manager
-- Level 4: HR Administrator
-- Level 5: CEO (Super Admin)

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

