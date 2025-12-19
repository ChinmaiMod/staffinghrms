-- =====================================================
-- Update HRMS Notifications RLS Policies
-- =====================================================
-- Scope notifications to authenticated user (user_id)
-- Users can only see notifications sent to them
-- =====================================================

-- Drop existing tenant-only policies
DROP POLICY IF EXISTS "hrms_notifications_tenant_select" ON hrms_notifications;
DROP POLICY IF EXISTS "hrms_notifications_tenant_insert" ON hrms_notifications;
DROP POLICY IF EXISTS "hrms_notifications_tenant_update" ON hrms_notifications;
DROP POLICY IF EXISTS "hrms_notifications_tenant_delete" ON hrms_notifications;

-- Create user-scoped SELECT policy
-- Users can only see notifications where user_id matches their auth.uid()
CREATE POLICY "hrms_notifications_user_select" ON hrms_notifications
  FOR SELECT USING (
    tenant_id = fn_get_user_tenant_id() 
    AND user_id = auth.uid()
  );

-- Create INSERT policy (system can create notifications for users in same tenant)
CREATE POLICY "hrms_notifications_user_insert" ON hrms_notifications
  FOR INSERT WITH CHECK (
    tenant_id = fn_get_user_tenant_id()
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

-- Create UPDATE policy (users can only update their own notifications)
CREATE POLICY "hrms_notifications_user_update" ON hrms_notifications
  FOR UPDATE USING (
    tenant_id = fn_get_user_tenant_id() 
    AND user_id = auth.uid()
  )
  WITH CHECK (
    tenant_id = fn_get_user_tenant_id() 
    AND user_id = auth.uid()
  );

-- Create DELETE policy (users can only delete their own notifications)
CREATE POLICY "hrms_notifications_user_delete" ON hrms_notifications
  FOR DELETE USING (
    tenant_id = fn_get_user_tenant_id() 
    AND user_id = auth.uid()
  );

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON POLICY "hrms_notifications_user_select" ON hrms_notifications IS 
  'Users can only view notifications sent to them (user_id = auth.uid())';
COMMENT ON POLICY "hrms_notifications_user_insert" ON hrms_notifications IS 
  'System can create notifications for users in the same tenant';
COMMENT ON POLICY "hrms_notifications_user_update" ON hrms_notifications IS 
  'Users can only update their own notifications (e.g., mark as read)';
COMMENT ON POLICY "hrms_notifications_user_delete" ON hrms_notifications IS 
  'Users can only delete their own notifications';
