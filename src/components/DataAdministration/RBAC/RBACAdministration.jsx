import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../api/supabaseClient';
import { useAuth } from '../../../contexts/AuthProvider';
import './RBACAdministration.css';

/**
 * RBAC Administration Component
 * Comprehensive interface for managing Role-Based Access Control
 * Only accessible by CEO (Super Admin) - role_level = 5
 * 
 * HRMS Tier 2 - Application-Scoped Roles
 * These roles are specific to HRMS and do NOT affect CRM access.
 * Both systems share the same database tables (user_roles, role_menu_permissions)
 * but are filtered by application_code ('HRMS' vs 'CRM').
 * 
 * HRMS Role Hierarchy:
 * - Level 5: CEO (Super Admin) - Full system access
 * - Level 4: Read Only User - View only access
 * - Level 3: HR Specialist / Immigration Specialist - Operations & compliance
 * - Level 2: HR Manager / Immigration Manager - Full department management
 */
function RBACAdministration() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('user-roles');
  const [roles, setRoles] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Menu item form state
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [menuItemForm, setMenuItemForm] = useState({
    item_code: '',
    item_name: '',
    item_path: '',
    icon: '',
    display_order: 1,
    is_active: true
  });

  // User Role form state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    role_name: '',
    role_code: '',
    role_level: 2,
    description: '',
    can_create_records: false,
    can_edit_own_records: false,
    can_edit_peer_records: false,
    can_edit_subordinate_records: false,
    can_edit_all_records: false,
    can_delete_own_records: false,
    can_delete_peer_records: false,
    can_delete_subordinate_records: false,
    can_delete_all_records: false,
    can_view_own_records: true,
    can_view_peer_records: false,
    can_view_subordinate_records: false,
    can_view_all_records: false,
    can_assign_roles: false,
    can_manage_users: false,
    can_manage_businesses: false,
    can_manage_roles: false,
  });
  const [selectedMenuItems, setSelectedMenuItems] = useState([]);

  // Application Access state
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [userAppAccess, setUserAppAccess] = useState({});
  const [loadingAppAccess, setLoadingAppAccess] = useState(false);
  const [tenantId, setTenantId] = useState(null);

  // HRMS application code - roles are scoped to this application
  const APPLICATION_CODE = 'HRMS';

  const loadRoles = useCallback(async () => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('application_code', APPLICATION_CODE)
      .order('role_level', { ascending: false });

    if (error) throw error;
    return data || [];
  }, []);

  const loadMenuItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('application_code', APPLICATION_CODE)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }, []);

  const loadRolePermissions = useCallback(async () => {
    const { data, error } = await supabase
      .from('role_menu_permissions')
      .select('*');

    if (error) throw error;
    
    // Transform into a map: { roleId: { menuItemId: canAccess } }
    const permissionsMap = {};
    (data || []).forEach(p => {
      if (!permissionsMap[p.role_id]) {
        permissionsMap[p.role_id] = {};
      }
      permissionsMap[p.role_id][p.menu_item_id] = p.can_access;
    });
    return permissionsMap;
  }, []);

  // Load applications for Application Access tab
  const loadApplications = useCallback(async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }, []);

  // Load tenant users for Application Access tab
  const loadTenantUsers = useCallback(async (currentTenantId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, status')
      .eq('tenant_id', currentTenantId)
      .eq('status', 'ACTIVE')
      .order('email');

    if (error) throw error;
    return data || [];
  }, []);

  // Load user application access mappings
  const loadUserAppAccess = useCallback(async (currentTenantId) => {
    const { data, error } = await supabase
      .from('user_application_access')
      .select('user_id, application_id, is_active')
      .eq('tenant_id', currentTenantId)
      .eq('is_active', true);

    if (error) throw error;
    
    // Transform into a map: { userId: { appId: true } }
    const accessMap = {};
    (data || []).forEach(a => {
      if (!accessMap[a.user_id]) {
        accessMap[a.user_id] = {};
      }
      accessMap[a.user_id][a.application_id] = true;
    });
    return accessMap;
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [rolesData, menuItemsData, permissionsData, appsData] = await Promise.all([
        loadRoles(),
        loadMenuItems(),
        loadRolePermissions(),
        loadApplications()
      ]);

      setRoles(rolesData);
      setMenuItems(menuItemsData);
      setRolePermissions(permissionsData);
      setApplications(appsData);
    } catch (err) {
      console.error('Error loading RBAC data:', err);
      setError('Failed to load RBAC data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [loadRoles, loadMenuItems, loadRolePermissions, loadApplications]);

  // Load application access data when switching to that tab
  const loadAppAccessData = useCallback(async () => {
    if (!profile?.tenant_id) return;
    
    try {
      setLoadingAppAccess(true);
      setTenantId(profile.tenant_id);
      
      const [usersData, accessData] = await Promise.all([
        loadTenantUsers(profile.tenant_id),
        loadUserAppAccess(profile.tenant_id)
      ]);
      
      setUsers(usersData);
      setUserAppAccess(accessData);
    } catch (err) {
      console.error('Error loading app access data:', err);
      setError('Failed to load application access data: ' + err.message);
    } finally {
      setLoadingAppAccess(false);
    }
  }, [profile?.tenant_id, loadTenantUsers, loadUserAppAccess]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Load app access data when switching to app-access tab
  useEffect(() => {
    if (activeTab === 'app-access') {
      loadAppAccessData();
    }
  }, [activeTab, loadAppAccessData]);

  const getRoleLevelName = (level) => {
    const names = {
      2: 'Level 2 - HR Manager / Immigration Manager',
      3: 'Level 3 - HR Specialist / Immigration Specialist',
      4: 'Level 4 - Read Only User',
      5: 'Level 5 - CEO (Super Admin)'
    };
    return names[level] || `Level ${level}`;
  };

  const getRoleLevelColor = (level) => {
    const colors = {
      1: '#94a3b8',
      2: '#60a5fa',
      3: '#34d399',
      4: '#fbbf24',
      5: '#f472b6'
    };
    return colors[level] || '#94a3b8';
  };

  const handlePermissionToggle = async (roleId, menuItemId) => {
    try {
      setSaving(true);
      setError(null);

      const currentValue = rolePermissions[roleId]?.[menuItemId] || false;
      const newValue = !currentValue;

      // Check if permission record exists
      const { data: existing } = await supabase
        .from('role_menu_permissions')
        .select('permission_id')
        .eq('role_id', roleId)
        .eq('menu_item_id', menuItemId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('role_menu_permissions')
          .update({ can_access: newValue })
          .eq('permission_id', existing.permission_id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('role_menu_permissions')
          .insert({
            role_id: roleId,
            menu_item_id: menuItemId,
            can_access: newValue
          });

        if (error) throw error;
      }

      // Update local state
      setRolePermissions(prev => ({
        ...prev,
        [roleId]: {
          ...prev[roleId],
          [menuItemId]: newValue
        }
      }));

      setSuccess('Permission updated successfully');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error updating permission:', err);
      setError('Failed to update permission: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGrantAllForRole = async (roleId) => {
    try {
      setSaving(true);
      setError(null);

      for (const menuItem of menuItems) {
        if (!rolePermissions[roleId]?.[menuItem.menu_item_id]) {
          const { data: existing } = await supabase
            .from('role_menu_permissions')
            .select('permission_id')
            .eq('role_id', roleId)
            .eq('menu_item_id', menuItem.menu_item_id)
            .single();

          if (existing) {
            await supabase
              .from('role_menu_permissions')
              .update({ can_access: true })
              .eq('permission_id', existing.permission_id);
          } else {
            await supabase
              .from('role_menu_permissions')
              .insert({
                role_id: roleId,
                menu_item_id: menuItem.menu_item_id,
                can_access: true
              });
          }
        }
      }

      // Reload permissions
      const newPermissions = await loadRolePermissions();
      setRolePermissions(newPermissions);

      setSuccess('All permissions granted for this role');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error granting all permissions:', err);
      setError('Failed to grant permissions: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeAllForRole = async (roleId) => {
    try {
      setSaving(true);
      setError(null);

      const { error } = await supabase
        .from('role_menu_permissions')
        .update({ can_access: false })
        .eq('role_id', roleId);

      if (error) throw error;

      // Reload permissions
      const newPermissions = await loadRolePermissions();
      setRolePermissions(newPermissions);

      setSuccess('All permissions revoked for this role');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error revoking permissions:', err);
      setError('Failed to revoke permissions: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle toggling application access for a user
  const handleAppAccessToggle = async (userId, appId) => {
    try {
      setSaving(true);
      setError(null);

      const hasAccess = userAppAccess[userId]?.[appId] || false;

      if (hasAccess) {
        // Revoke access - update is_active to false
        const { error } = await supabase
          .from('user_application_access')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('application_id', appId)
          .eq('tenant_id', tenantId);

        if (error) throw error;

        // Update local state
        setUserAppAccess(prev => {
          const newAccess = { ...prev };
          if (newAccess[userId]) {
            delete newAccess[userId][appId];
          }
          return newAccess;
        });
      } else {
        // Grant access - upsert
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase
          .from('user_application_access')
          .upsert({
            user_id: userId,
            application_id: appId,
            tenant_id: tenantId,
            granted_by: user?.id,
            is_active: true
          }, {
            onConflict: 'user_id,application_id,tenant_id'
          });

        if (error) throw error;

        // Update local state
        setUserAppAccess(prev => ({
          ...prev,
          [userId]: {
            ...prev[userId],
            [appId]: true
          }
        }));
      }

      setSuccess('Application access updated successfully');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error updating application access:', err);
      setError('Failed to update application access: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Grant all apps to a user
  const handleGrantAllApps = async (userId) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      for (const app of applications) {
        if (!userAppAccess[userId]?.[app.id]) {
          await supabase
            .from('user_application_access')
            .upsert({
              user_id: userId,
              application_id: app.id,
              tenant_id: tenantId,
              granted_by: user?.id,
              is_active: true
            }, {
              onConflict: 'user_id,application_id,tenant_id'
            });
        }
      }

      // Reload access data
      const newAccess = await loadUserAppAccess(tenantId);
      setUserAppAccess(newAccess);

      setSuccess('All applications granted to user');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error granting all apps:', err);
      setError('Failed to grant applications: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Revoke all apps from a user
  const handleRevokeAllApps = async (userId) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('user_application_access')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Reload access data
      const newAccess = await loadUserAppAccess(tenantId);
      setUserAppAccess(newAccess);

      setSuccess('All applications revoked from user');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error revoking all apps:', err);
      setError('Failed to revoke applications: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Menu Items Management
  const openCreateMenuItemModal = () => {
    setEditingMenuItem(null);
    setMenuItemForm({
      item_code: '',
      item_name: '',
      item_path: '',
      icon: '',
      display_order: menuItems.length + 1,
      is_active: true
    });
    setShowMenuItemModal(true);
  };

  const openEditMenuItemModal = (item) => {
    setEditingMenuItem(item);
    setMenuItemForm({
      item_code: item.item_code,
      item_name: item.item_name,
      item_path: item.item_path || '',
      icon: item.icon || '',
      display_order: item.display_order || 1,
      is_active: item.is_active
    });
    setShowMenuItemModal(true);
  };

  const handleMenuItemFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMenuItemForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitMenuItem = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const menuItemData = {
        item_code: menuItemForm.item_code.toUpperCase().replace(/\s+/g, '_'),
        item_name: menuItemForm.item_name,
        item_path: menuItemForm.item_path || null,
        icon: menuItemForm.icon || null,
        display_order: parseInt(menuItemForm.display_order, 10),
        is_active: menuItemForm.is_active
      };

      if (editingMenuItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(menuItemData)
          .eq('menu_item_id', editingMenuItem.menu_item_id);

        if (error) throw error;
        setSuccess('Menu item updated successfully');
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert(menuItemData);

        if (error) throw error;
        setSuccess('Menu item created successfully');
      }

      setShowMenuItemModal(false);
      loadAllData();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error saving menu item:', err);
      setError('Failed to save menu item: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMenuItem = async (item) => {
    if (item.is_system_item) {
      setError('Cannot delete system menu items');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the menu item "${item.item_name}"?`)) {
      return;
    }

    try {
      setSaving(true);

      // First delete all permissions for this menu item
      await supabase
        .from('role_menu_permissions')
        .delete()
        .eq('menu_item_id', item.menu_item_id);

      // Then delete the menu item
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('menu_item_id', item.menu_item_id);

      if (error) throw error;

      setSuccess('Menu item deleted successfully');
      loadAllData();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error deleting menu item:', err);
      setError('Failed to delete menu item: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleMenuItemActive = async (item) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('menu_items')
        .update({ is_active: !item.is_active })
        .eq('menu_item_id', item.menu_item_id);

      if (error) throw error;

      loadAllData();
      setSuccess(`Menu item ${!item.is_active ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error toggling menu item:', err);
      setError('Failed to update menu item: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ============ User Roles Management Functions ============
  const handleRoleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoleFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMenuItemToggle = (menuItemId) => {
    setSelectedMenuItems(prev => {
      if (prev.includes(menuItemId)) {
        return prev.filter(id => id !== menuItemId);
      } else {
        return [...prev, menuItemId];
      }
    });
  };

  const handleSelectAllMenus = () => {
    setSelectedMenuItems(menuItems.map(item => item.menu_item_id));
  };

  const handleDeselectAllMenus = () => {
    setSelectedMenuItems([]);
  };

  const openCreateRoleModal = () => {
    setEditingRole(null);
    setRoleFormData({
      role_name: '',
      role_code: '',
      role_level: 2,
      description: '',
      can_create_records: false,
      can_edit_own_records: false,
      can_edit_peer_records: false,
      can_edit_subordinate_records: false,
      can_edit_all_records: false,
      can_delete_own_records: false,
      can_delete_peer_records: false,
      can_delete_subordinate_records: false,
      can_delete_all_records: false,
      can_view_own_records: true,
      can_view_peer_records: false,
      can_view_subordinate_records: false,
      can_view_all_records: false,
      can_assign_roles: false,
      can_manage_users: false,
      can_manage_businesses: false,
      can_manage_roles: false,
    });
    setSelectedMenuItems([]);
    setShowRoleModal(true);
  };

  const openEditRoleModal = async (role) => {
    setEditingRole(role);
    setRoleFormData({
      role_name: role.role_name,
      role_code: role.role_code,
      role_level: role.role_level,
      description: role.description || '',
      can_create_records: role.can_create_records,
      can_edit_own_records: role.can_edit_own_records,
      can_edit_peer_records: role.can_edit_peer_records || false,
      can_edit_subordinate_records: role.can_edit_subordinate_records,
      can_edit_all_records: role.can_edit_all_records,
      can_delete_own_records: role.can_delete_own_records,
      can_delete_peer_records: role.can_delete_peer_records || false,
      can_delete_subordinate_records: role.can_delete_subordinate_records,
      can_delete_all_records: role.can_delete_all_records,
      can_view_own_records: role.can_view_own_records,
      can_view_peer_records: role.can_view_peer_records || false,
      can_view_subordinate_records: role.can_view_subordinate_records,
      can_view_all_records: role.can_view_all_records,
      can_assign_roles: role.can_assign_roles,
      can_manage_users: role.can_manage_users,
      can_manage_businesses: role.can_manage_businesses,
      can_manage_roles: role.can_manage_roles,
    });
    
    // Load existing menu permissions
    const { data, error } = await supabase
      .from('role_menu_permissions')
      .select('menu_item_id')
      .eq('role_id', role.role_id)
      .eq('can_access', true);
    
    if (!error && data) {
      setSelectedMenuItems(data.map(p => p.menu_item_id));
    }
    
    setShowRoleModal(true);
  };

  const handlePresetRole = (level) => {
    // HRMS Role Presets:
    // Level 2: HR Manager / Immigration Manager - Full department management, manage teams
    // Level 3: HR Specialist / Immigration Specialist - Operations & compliance, create/edit records
    // Level 4: Read Only User - View only access, no modifications
    // Level 5: CEO (Super Admin) - Full system access
    const presets = {
      2: { // HR Manager / Immigration Manager
        can_create_records: true, can_edit_own_records: true, can_edit_peer_records: true, can_edit_subordinate_records: true,
        can_edit_all_records: true, can_delete_own_records: true, can_delete_peer_records: true, can_delete_subordinate_records: true,
        can_delete_all_records: false, can_view_own_records: true, can_view_peer_records: true, can_view_subordinate_records: true,
        can_view_all_records: true, can_assign_roles: true, can_manage_users: true,
        can_manage_businesses: false, can_manage_roles: false,
      },
      3: { // HR Specialist / Immigration Specialist
        can_create_records: true, can_edit_own_records: true, can_edit_peer_records: true, can_edit_subordinate_records: false,
        can_edit_all_records: false, can_delete_own_records: true, can_delete_peer_records: false, can_delete_subordinate_records: false,
        can_delete_all_records: false, can_view_own_records: true, can_view_peer_records: true, can_view_subordinate_records: false,
        can_view_all_records: true, can_assign_roles: false, can_manage_users: false,
        can_manage_businesses: false, can_manage_roles: false,
      },
      4: { // Read Only User
        can_create_records: false, can_edit_own_records: false, can_edit_peer_records: false, can_edit_subordinate_records: false,
        can_edit_all_records: false, can_delete_own_records: false, can_delete_peer_records: false, can_delete_subordinate_records: false,
        can_delete_all_records: false, can_view_own_records: true, can_view_peer_records: true, can_view_subordinate_records: true,
        can_view_all_records: true, can_assign_roles: false, can_manage_users: false,
        can_manage_businesses: false, can_manage_roles: false,
      },
      5: { // CEO (Super Admin)
        can_create_records: true, can_edit_own_records: true, can_edit_peer_records: true, can_edit_subordinate_records: true,
        can_edit_all_records: true, can_delete_own_records: true, can_delete_peer_records: true, can_delete_subordinate_records: true,
        can_delete_all_records: true, can_view_own_records: true, can_view_peer_records: true, can_view_subordinate_records: true,
        can_view_all_records: true, can_assign_roles: true, can_manage_users: true,
        can_manage_businesses: true, can_manage_roles: true,
      },
    };
    if (presets[level]) {
      setRoleFormData(prev => ({ ...prev, ...presets[level] }));
    }
  };

  const handleSubmitRole = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setSaving(true);
      let roleId;

      if (editingRole) {
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ ...roleFormData, application_code: APPLICATION_CODE, updated_by: profile?.id })
          .eq('role_id', editingRole.role_id);
        if (updateError) throw updateError;
        roleId = editingRole.role_id;

        await supabase.from('role_menu_permissions').delete().eq('role_id', roleId);
      } else {
        const { data: newRole, error: insertError } = await supabase
          .from('user_roles')
          .insert([{ ...roleFormData, application_code: APPLICATION_CODE, created_by: profile?.id }])
          .select()
          .single();
        if (insertError) throw insertError;
        roleId = newRole.role_id;
      }

      if (selectedMenuItems.length > 0) {
        const menuPermissions = selectedMenuItems.map(menuItemId => ({
          role_id: roleId, menu_item_id: menuItemId, can_access: true,
        }));
        const { error: permError } = await supabase.from('role_menu_permissions').insert(menuPermissions);
        if (permError) throw permError;
      }

      setShowRoleModal(false);
      setSuccess(editingRole ? 'Role updated successfully' : 'Role created successfully');
      loadAllData();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error saving role:', err);
      setError(err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (role.is_system_role) {
      setError('System roles cannot be deleted');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the role "${role.role_name}"?`)) return;

    try {
      setSaving(true);
      const { error } = await supabase.from('user_roles').delete().eq('role_id', role.role_id);
      if (error) throw error;
      setSuccess('Role deleted successfully');
      loadAllData();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error('Error deleting role:', err);
      setError('Failed to delete role: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading Access Control configuration...</div>;
  }

  return (
    <div className="rbac-administration">
      <div style={{ marginBottom: '16px' }}>
        <button 
          className="btn-secondary"
          onClick={() => navigate('/hrms/data-admin')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '14px',
            padding: '8px 16px'
          }}
        >
          ← Back to All Tables
        </button>
      </div>

      <div className="page-header">
        <div>
          <h1>🛡️ Access Control</h1>
          <p className="page-description">
            Manage Role-Based Access Control - Configure which menu items and features each role can access
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>✅ {success}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="rbac-tabs">
        <button
          className={`rbac-tab ${activeTab === 'user-roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('user-roles')}
        >
          🔐 User Roles
        </button>
        <button
          className={`rbac-tab ${activeTab === 'app-access' ? 'active' : ''}`}
          onClick={() => setActiveTab('app-access')}
        >
          📱 Application Access
        </button>
        <button
          className={`rbac-tab ${activeTab === 'permissions-matrix' ? 'active' : ''}`}
          onClick={() => setActiveTab('permissions-matrix')}
        >
          📊 Permissions Matrix
        </button>
        <button
          className={`rbac-tab ${activeTab === 'menu-items' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu-items')}
        >
          📋 Menu Items
        </button>
        <button
          className={`rbac-tab ${activeTab === 'role-summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('role-summary')}
        >
          📈 Role Summary
        </button>
      </div>

      {/* User Roles Tab */}
      {activeTab === 'user-roles' && (
        <div className="user-roles-section">
          <div className="section-header">
            <h2>User Roles Management</h2>
            <button className="btn-primary" onClick={openCreateRoleModal}>
              ➕ Create New Role
            </button>
          </div>

          <div className="roles-grid">
            {roles.map(role => (
              <div key={role.role_id} className="role-card">
                <div className="role-card-header">
                  <div>
                    <h3>{role.role_name}</h3>
                    <span 
                      className="role-level-badge"
                      style={{ backgroundColor: getRoleLevelColor(role.role_level) }}
                    >
                      {getRoleLevelName(role.role_level)}
                    </span>
                    {role.is_system_role && (
                      <span className="system-role-badge">System Role</span>
                    )}
                  </div>
                  <div className="role-actions">
                    <button 
                      className="btn-icon" 
                      onClick={() => openEditRoleModal(role)}
                      title="Edit Role"
                    >
                      ✏️
                    </button>
                    {!role.is_system_role && (
                      <button 
                        className="btn-icon btn-danger" 
                        onClick={() => handleDeleteRole(role)}
                        title="Delete Role"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                
                {role.description && (
                  <p className="role-description">{role.description}</p>
                )}

                <div className="role-permissions-summary">
                  <h4>Permissions:</h4>
                  <div className="permission-tags">
                    {role.can_create_records && <span className="tag tag-success">Create</span>}
                    {role.can_edit_own_records && <span className="tag tag-info">Edit Own</span>}
                    {role.can_edit_subordinate_records && <span className="tag tag-info">Edit Subordinates</span>}
                    {role.can_edit_all_records && <span className="tag tag-warning">Edit All</span>}
                    {role.can_delete_own_records && <span className="tag tag-danger">Delete Own</span>}
                    {role.can_delete_subordinate_records && <span className="tag tag-danger">Delete Subordinates</span>}
                    {role.can_delete_all_records && <span className="tag tag-danger">Delete All</span>}
                    {role.can_view_all_records && <span className="tag tag-primary">View All</span>}
                    {role.can_assign_roles && <span className="tag tag-special">Assign Roles</span>}
                    {role.can_manage_users && <span className="tag tag-special">Manage Users</span>}
                    {role.can_manage_businesses && <span className="tag tag-special">Manage Businesses</span>}
                    {role.can_manage_roles && <span className="tag tag-special">Manage Roles</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Access Tab */}
      {activeTab === 'app-access' && (
        <div className="app-access-section">
          <div className="section-header">
            <h2>Application Access Management</h2>
            <p>Control which applications each user can access (Two-Tier Permission System - Tier 1)</p>
          </div>

          {loadingAppAccess ? (
            <div className="loading-state">Loading users and applications...</div>
          ) : (
            <div className="matrix-container">
              <table className="permissions-matrix app-access-matrix">
                <thead>
                  <tr>
                    <th className="user-header">User</th>
                    {applications.map(app => (
                      <th key={app.id} className="app-header">
                        <div className="app-header-content">
                          <span className="app-icon">{app.icon_name === 'users' ? '👥' : app.icon_name === 'briefcase' ? '💼' : '💰'}</span>
                          <span className="app-name">{app.app_name}</span>
                        </div>
                      </th>
                    ))}
                    <th className="actions-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="user-cell">
                        <div className="user-info">
                          <span className="user-name">{user.full_name || user.email}</span>
                          <span className="user-email">{user.email}</span>
                        </div>
                      </td>
                      {applications.map(app => (
                        <td key={app.id} className="access-cell">
                          <label className="access-toggle">
                            <input
                              type="checkbox"
                              checked={userAppAccess[user.id]?.[app.id] || false}
                              onChange={() => handleAppAccessToggle(user.id, app.id)}
                              disabled={saving}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </td>
                      ))}
                      <td className="actions-cell">
                        <button
                          className="btn-mini btn-grant"
                          onClick={() => handleGrantAllApps(user.id)}
                          disabled={saving}
                          title="Grant all applications"
                        >
                          ✓ All
                        </button>
                        <button
                          className="btn-mini btn-revoke"
                          onClick={() => handleRevokeAllApps(user.id)}
                          disabled={saving}
                          title="Revoke all applications"
                        >
                          ✗ None
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="app-access-info">
            <h3>📋 How Application Access Works</h3>
            <ul>
              <li><strong>Tier 1 (Application Access):</strong> Controls which applications a user can see on their dashboard</li>
              <li><strong>Tier 2 (User Roles):</strong> Controls what actions a user can perform within each application</li>
              <li>Users must have both application access AND appropriate role permissions to use features</li>
              <li>New users are automatically granted CRM access when assigned a role</li>
            </ul>
          </div>
        </div>
      )}

      {/* Permissions Matrix Tab */}
      {activeTab === 'permissions-matrix' && (
        <div className="permissions-matrix-section">
          <div className="section-header">
            <h2>Role Permissions Matrix</h2>
            <p>Click on cells to toggle access permissions for each role</p>
          </div>

          <div className="matrix-container">
            <table className="permissions-matrix">
              <thead>
                <tr>
                  <th className="menu-item-header">Menu Item</th>
                  {roles.map(role => (
                    <th key={role.role_id} className="role-header">
                      <div className="role-header-content">
                        <span 
                          className="role-level-badge"
                          style={{ backgroundColor: getRoleLevelColor(role.role_level) }}
                        >
                          L{role.role_level}
                        </span>
                        <span className="role-name">{role.role_name}</span>
                        <div className="role-actions-mini">
                          <button 
                            className="btn-mini btn-grant"
                            onClick={() => handleGrantAllForRole(role.role_id)}
                            title="Grant all permissions"
                            disabled={saving}
                          >
                            ✓ All
                          </button>
                          <button 
                            className="btn-mini btn-revoke"
                            onClick={() => handleRevokeAllForRole(role.role_id)}
                            title="Revoke all permissions"
                            disabled={saving}
                          >
                            ✗ None
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {menuItems.filter(m => m.is_active).map(menuItem => (
                  <tr key={menuItem.menu_item_id}>
                    <td className="menu-item-cell">
                      <div className="menu-item-info">
                        <span className="menu-icon">{menuItem.icon || '📄'}</span>
                        <div>
                          <div className="menu-name">{menuItem.item_name}</div>
                          <div className="menu-path">{menuItem.item_path || 'No path'}</div>
                        </div>
                      </div>
                    </td>
                    {roles.map(role => {
                      const hasAccess = rolePermissions[role.role_id]?.[menuItem.menu_item_id] || false;
                      return (
                        <td 
                          key={role.role_id} 
                          className={`permission-cell ${hasAccess ? 'granted' : 'denied'}`}
                          onClick={() => !saving && handlePermissionToggle(role.role_id, menuItem.menu_item_id)}
                          title={`Click to ${hasAccess ? 'revoke' : 'grant'} access`}
                        >
                          <span className="permission-indicator">
                            {hasAccess ? '✅' : '❌'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="matrix-legend">
            <h4>Legend:</h4>
            <div className="legend-items">
              <div className="legend-item">
                <span className="permission-indicator">✅</span>
                <span>Access Granted</span>
              </div>
              <div className="legend-item">
                <span className="permission-indicator">❌</span>
                <span>Access Denied</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Tab */}
      {activeTab === 'menu-items' && (
        <div className="menu-items-section">
          <div className="section-header">
            <h2>Menu Items Management</h2>
            <button className="btn-primary" onClick={openCreateMenuItemModal}>
              ➕ Add Menu Item
            </button>
          </div>

          <div className="menu-items-grid">
            {menuItems.map(item => (
              <div key={item.menu_item_id} className={`menu-item-card ${!item.is_active ? 'inactive' : ''}`}>
                <div className="menu-item-card-header">
                  <div className="menu-item-icon-large">{item.icon || '📄'}</div>
                  <div className="menu-item-details">
                    <h3>{item.item_name}</h3>
                    <span className="menu-item-code">{item.item_code}</span>
                  </div>
                  <div className="menu-item-badges">
                    {item.is_system_item && <span className="badge badge-system">System</span>}
                    <span className={`badge ${item.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="menu-item-info-row">
                  <span className="label">Path:</span>
                  <span className="value">{item.item_path || 'N/A'}</span>
                </div>
                
                <div className="menu-item-info-row">
                  <span className="label">Order:</span>
                  <span className="value">{item.display_order}</span>
                </div>

                <div className="menu-item-info-row">
                  <span className="label">Roles with Access:</span>
                  <span className="value">
                    {roles.filter(r => rolePermissions[r.role_id]?.[item.menu_item_id]).length} / {roles.length}
                  </span>
                </div>

                <div className="menu-item-actions">
                  <button 
                    className="btn-icon"
                    onClick={() => openEditMenuItemModal(item)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    className={`btn-icon ${item.is_active ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => toggleMenuItemActive(item)}
                    title={item.is_active ? 'Deactivate' : 'Activate'}
                    disabled={saving}
                  >
                    {item.is_active ? '🚫' : '✅'}
                  </button>
                  {!item.is_system_item && (
                    <button 
                      className="btn-icon btn-danger"
                      onClick={() => handleDeleteMenuItem(item)}
                      title="Delete"
                      disabled={saving}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Summary Tab */}
      {activeTab === 'role-summary' && (
        <div className="role-summary-section">
          <div className="section-header">
            <h2>Role Summary & Statistics</h2>
            <p>Overview of all roles and their permission levels</p>
          </div>

          <div className="role-summary-grid">
            {roles.map(role => {
              const accessibleMenus = menuItems.filter(m => 
                m.is_active && rolePermissions[role.role_id]?.[m.menu_item_id]
              );
              const totalActiveMenus = menuItems.filter(m => m.is_active).length;
              const accessPercentage = totalActiveMenus > 0 
                ? Math.round((accessibleMenus.length / totalActiveMenus) * 100) 
                : 0;

              return (
                <div key={role.role_id} className="role-summary-card">
                  <div className="role-summary-header">
                    <div 
                      className="role-level-indicator"
                      style={{ backgroundColor: getRoleLevelColor(role.role_level) }}
                    >
                      {role.role_level}
                    </div>
                    <div className="role-summary-title">
                      <h3>{role.role_name}</h3>
                      <span className="role-code">{role.role_code}</span>
                    </div>
                  </div>

                  <p className="role-description">{role.description}</p>

                  <div className="access-progress">
                    <div className="access-label">
                      <span>Menu Access</span>
                      <span>{accessibleMenus.length}/{totalActiveMenus} ({accessPercentage}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${accessPercentage}%`,
                          backgroundColor: getRoleLevelColor(role.role_level)
                        }}
                      />
                    </div>
                  </div>

                  <div className="role-capabilities">
                    <h4>Capabilities:</h4>
                    <div className="capability-tags">
                      {role.can_create_records && <span className="cap-tag create">Create</span>}
                      {role.can_edit_own_records && <span className="cap-tag edit">Edit Own</span>}
                      {role.can_edit_subordinate_records && <span className="cap-tag edit">Edit Team</span>}
                      {role.can_edit_all_records && <span className="cap-tag edit-all">Edit All</span>}
                      {role.can_delete_own_records && <span className="cap-tag delete">Delete Own</span>}
                      {role.can_delete_all_records && <span className="cap-tag delete-all">Delete All</span>}
                      {role.can_view_all_records && <span className="cap-tag view">View All</span>}
                      {role.can_assign_roles && <span className="cap-tag admin">Assign Roles</span>}
                      {role.can_manage_users && <span className="cap-tag admin">Manage Users</span>}
                      {role.can_manage_businesses && <span className="cap-tag admin">Manage Businesses</span>}
                      {role.can_manage_roles && <span className="cap-tag admin">Manage Roles</span>}
                    </div>
                  </div>

                  <div className="accessible-menus">
                    <h4>Accessible Menus:</h4>
                    <div className="menu-tags">
                      {accessibleMenus.length > 0 ? (
                        accessibleMenus.map(menu => (
                          <span key={menu.menu_item_id} className="menu-tag">
                            {menu.icon} {menu.item_name}
                          </span>
                        ))
                      ) : (
                        <span className="no-access">No menu access configured</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Menu Item Modal */}
      {showMenuItemModal && (
        <div className="modal-overlay" onClick={() => setShowMenuItemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMenuItem ? '✏️ Edit Menu Item' : '➕ Add Menu Item'}</h2>
              <button className="btn-close" onClick={() => setShowMenuItemModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmitMenuItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="item_name">Item Name *</label>
                  <input
                    type="text"
                    id="item_name"
                    name="item_name"
                    value={menuItemForm.item_name}
                    onChange={handleMenuItemFormChange}
                    required
                    placeholder="e.g., Dashboard"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="item_code">Item Code *</label>
                  <input
                    type="text"
                    id="item_code"
                    name="item_code"
                    value={menuItemForm.item_code}
                    onChange={handleMenuItemFormChange}
                    required
                    placeholder="e.g., DASHBOARD"
                    disabled={editingMenuItem?.is_system_item}
                  />
                  <small>Uppercase letters and underscores only</small>
                </div>

                <div className="form-group">
                  <label htmlFor="item_path">Path</label>
                  <input
                    type="text"
                    id="item_path"
                    name="item_path"
                    value={menuItemForm.item_path}
                    onChange={handleMenuItemFormChange}
                    placeholder="e.g., /dashboard"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="icon">Icon</label>
                  <input
                    type="text"
                    id="icon"
                    name="icon"
                    value={menuItemForm.icon}
                    onChange={handleMenuItemFormChange}
                    placeholder="e.g., dashboard or 📊"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="display_order">Display Order</label>
                  <input
                    type="number"
                    id="display_order"
                    name="display_order"
                    value={menuItemForm.display_order}
                    onChange={handleMenuItemFormChange}
                    min="1"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={menuItemForm.is_active}
                      onChange={handleMenuItemFormChange}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowMenuItemModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingMenuItem ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Role Modal */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingRole ? '✏️ Edit Role' : '➕ Create New Role'}</h2>
              <button className="btn-close" onClick={() => setShowRoleModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmitRole}>
              <div className="modal-body">
                <section className="form-section">
                  <h3>Basic Information</h3>
                  <div className="form-group">
                    <label htmlFor="role_name">Role Name *</label>
                    <input type="text" id="role_name" name="role_name" value={roleFormData.role_name}
                      onChange={handleRoleInputChange} required placeholder="e.g., Senior Recruiter" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role_code">Role Code *</label>
                    <input type="text" id="role_code" name="role_code" value={roleFormData.role_code}
                      onChange={handleRoleInputChange} required placeholder="e.g., SENIOR_RECRUITER"
                      disabled={editingRole?.is_system_role} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role_level">Role Level *</label>
                    <select id="role_level" name="role_level" value={roleFormData.role_level}
                      onChange={(e) => { handleRoleInputChange(e); handlePresetRole(parseInt(e.target.value)); }}
                      required disabled={editingRole?.is_system_role}>
                      <option value={2}>Level 2 - HR Manager / Immigration Manager</option>
                      <option value={3}>Level 3 - HR Specialist / Immigration Specialist</option>
                      <option value={4}>Level 4 - Read Only User</option>
                      <option value={5}>Level 5 - CEO (Super Admin)</option>
                    </select>
                    <small>Selecting a level applies default permissions.</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea id="description" name="description" value={roleFormData.description}
                      onChange={handleRoleInputChange} rows={2} placeholder="Role description" />
                  </div>
                </section>

                <section className="form-section">
                  <h3>Data Permissions</h3>
                  <div className="permission-grid">
                    <div className="permission-category">
                      <h4>📝 Create</h4>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_create_records" checked={roleFormData.can_create_records} onChange={handleRoleInputChange} />
                        <span>Can create records</span>
                      </label>
                    </div>
                    <div className="permission-category">
                      <h4>👁️ View</h4>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_view_own_records" checked={roleFormData.can_view_own_records} onChange={handleRoleInputChange} />
                        <span>View own</span>
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_view_peer_records" checked={roleFormData.can_view_peer_records} onChange={handleRoleInputChange} />
                        <span>View peers (same level)</span>
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_view_subordinate_records" checked={roleFormData.can_view_subordinate_records} onChange={handleRoleInputChange} />
                        <span>View subordinates</span>
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_view_all_records" checked={roleFormData.can_view_all_records} onChange={handleRoleInputChange} />
                        <span>View all</span>
                      </label>
                    </div>
                    <div className="permission-category">
                      <h4>✏️ Edit</h4>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_edit_own_records" checked={roleFormData.can_edit_own_records} onChange={handleRoleInputChange} />
                        <span>Edit own</span>
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_edit_peer_records" checked={roleFormData.can_edit_peer_records} onChange={handleRoleInputChange} />
                        <span>Edit peers (same level)</span>
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_edit_subordinate_records" checked={roleFormData.can_edit_subordinate_records} onChange={handleRoleInputChange} />
                        <span>Edit subordinates</span>
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_edit_all_records" checked={roleFormData.can_edit_all_records} onChange={handleRoleInputChange} />
                        <span>Edit all</span>
                      </label>
                    </div>
                    <div className="permission-category">
                      <h4>🗑️ Delete</h4>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_delete_own_records" checked={roleFormData.can_delete_own_records} onChange={handleRoleInputChange} />
                        <span>Delete own</span>
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_delete_peer_records" checked={roleFormData.can_delete_peer_records} onChange={handleRoleInputChange} />
                        <span>Delete peers (same level)</span>
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_delete_subordinate_records" checked={roleFormData.can_delete_subordinate_records} onChange={handleRoleInputChange} />
                        <span>Delete subordinates</span>
                      </label>
                      <label className="checkbox-label">
                        <input type="checkbox" name="can_delete_all_records" checked={roleFormData.can_delete_all_records} onChange={handleRoleInputChange} />
                        <span>Delete all</span>
                      </label>
                    </div>
                  </div>
                </section>

                <section className="form-section">
                  <h3>Management Permissions</h3>
                  <div className="permission-list">
                    <label className="checkbox-label">
                      <input type="checkbox" name="can_assign_roles" checked={roleFormData.can_assign_roles} onChange={handleRoleInputChange} />
                      <span>Can assign roles</span>
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" name="can_manage_users" checked={roleFormData.can_manage_users} onChange={handleRoleInputChange} />
                      <span>Can manage users</span>
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" name="can_manage_businesses" checked={roleFormData.can_manage_businesses} onChange={handleRoleInputChange} />
                      <span>Can manage businesses</span>
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" name="can_manage_roles" checked={roleFormData.can_manage_roles} onChange={handleRoleInputChange} />
                      <span>Can manage roles</span>
                    </label>
                  </div>
                </section>

                <section className="form-section">
                  <h3>Page Access</h3>
                  <div className="menu-actions">
                    <button type="button" className="btn-secondary" onClick={handleSelectAllMenus}>Select All</button>
                    <button type="button" className="btn-secondary" onClick={handleDeselectAllMenus}>Deselect All</button>
                  </div>
                  <div className="menu-items-list">
                    {menuItems.filter(m => m.is_active).map(item => (
                      <label key={item.menu_item_id} className="checkbox-label menu-item-checkbox">
                        <input type="checkbox" checked={selectedMenuItems.includes(item.menu_item_id)}
                          onChange={() => handleMenuItemToggle(item.menu_item_id)} />
                        <span>{item.icon} {item.item_name} {item.item_path && <code className="menu-path">{item.item_path}</code>}</span>
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowRoleModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : (editingRole ? 'Update Role' : 'Create Role')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RBACAdministration;
