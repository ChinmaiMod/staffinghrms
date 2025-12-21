import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../api/supabaseClient'
import { useAuth } from './AuthProvider'
import { logger } from '../utils/logger'

const PermissionsContext = createContext(null)

const defaultClientPermissions = {
  canViewSection: false,
  canAccessDashboard: false,
  canAccessInfo: false,
  canAccessJobOrders: false,
  canViewLinkedContacts: false,
  canCreateClients: false,
  canEditClients: false,
  canDeleteClients: false,
  canCreateJobOrders: false,
  canEditJobOrders: false,
  canDeleteJobOrders: false,
}

const deriveClientPermissions = (permissions) => {
  if (!permissions) {
    return defaultClientPermissions
  }

  const hasViewAccess = Boolean(
    permissions.can_view_all_records ||
      permissions.can_view_subordinate_records ||
      permissions.can_view_own_records
  )

  const hasEditAccess = Boolean(
    permissions.can_edit_all_records ||
      permissions.can_edit_subordinate_records ||
      permissions.can_edit_own_records
  )

  const hasDeleteAccess = Boolean(
    permissions.can_delete_all_records ||
      permissions.can_delete_subordinate_records ||
      permissions.can_delete_own_records
  )

  const hasCreateAccess = Boolean(permissions.can_create_records)

  return {
    canViewSection: hasViewAccess,
    canAccessDashboard: hasViewAccess,
    canAccessInfo: hasViewAccess,
    canAccessJobOrders: hasViewAccess,
    canViewLinkedContacts: hasViewAccess,
    canCreateClients: hasCreateAccess,
    canEditClients: hasEditAccess,
    canDeleteClients: hasDeleteAccess,
    canCreateJobOrders: hasCreateAccess,
    canEditJobOrders: hasEditAccess,
    canDeleteJobOrders: hasDeleteAccess,
  }
}

export const usePermissions = () => {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider')
  }
  return context
}

export function PermissionsProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState({
    loading: Boolean(user),
    error: null,
    permissions: null,
    menuPermissions: null, // Map of menu_item_id -> can_access
    menuItems: null, // List of menu items with their paths/codes
  })

  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      setState({ loading: false, error: null, permissions: null, menuPermissions: null, menuItems: null })
      return
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      // Fetch user permissions (role-level permissions)
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (permissionsError) throw permissionsError

      if (!permissionsData) {
        throw new Error('No active role assignment found for this user.')
      }

      // Fetch menu permissions for the user's role
      // Get role_id from user_permissions
      const roleId = permissionsData.role_id
      
      let menuPermissionsMap = {}
      let menuItemsList = []

      if (roleId) {
        // Fetch menu items for HRMS application
        const { data: menuItemsData, error: menuItemsError } = await supabase
          .from('menu_items')
          .select('menu_item_id, item_code, item_path, item_name, icon, display_order, is_active')
          .eq('application_code', 'HRMS')
          .eq('is_active', true)
          .order('display_order')

        if (menuItemsError) {
          logger.warn('Failed to load menu items', menuItemsError)
        } else {
          menuItemsList = menuItemsData || []
        }

        // Fetch role menu permissions
        const { data: roleMenuPerms, error: menuPermsError } = await supabase
          .from('role_menu_permissions')
          .select('menu_item_id, can_access')
          .eq('role_id', roleId)
          .eq('can_access', true)

        if (menuPermsError) {
          logger.warn('Failed to load menu permissions', menuPermsError)
        } else {
          // Create a map: menu_item_id -> can_access
          menuPermissionsMap = (roleMenuPerms || []).reduce((acc, perm) => {
            acc[perm.menu_item_id] = perm.can_access
            return acc
          }, {})
        }
      }

      setState({ 
        loading: false, 
        error: null, 
        permissions: permissionsData,
        menuPermissions: menuPermissionsMap,
        menuItems: menuItemsList,
      })
    } catch (error) {
      logger.error('Failed to load permissions', error)
      setState({ loading: false, error, permissions: null, menuPermissions: null, menuItems: null })
    }
  }, [user?.id])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  const clientPermissions = useMemo(
    () => deriveClientPermissions(state.permissions),
    [state.permissions]
  )

  // Helper function to check if user has access to a menu item by path or code
  const hasMenuAccess = useCallback((pathOrCode) => {
    if (!state.menuItems || !state.menuPermissions) {
      return false
    }

    // If user is super admin (level 5), grant access to all menus
    if (state.permissions?.role_level === 5) {
      return true
    }

    // Find menu item by path or code
    const menuItem = state.menuItems.find(
      item => item.item_path === pathOrCode || item.item_code === pathOrCode.toUpperCase()
    )

    if (!menuItem) {
      // If menu item not found in database, default to false for security
      return false
    }

    // Check if user has permission for this menu item
    return Boolean(state.menuPermissions[menuItem.menu_item_id])
  }, [state.menuItems, state.menuPermissions, state.permissions?.role_level])

  const value = useMemo(
    () => ({
      loading: state.loading,
      error: state.error,
      permissions: state.permissions,
      roleLevel: state.permissions?.role_level ?? null,
      roleCode: state.permissions?.role_code ?? null,
      clientPermissions,
      menuPermissions: state.menuPermissions,
      menuItems: state.menuItems,
      hasMenuAccess,
      refresh: fetchPermissions,
    }),
    [state.loading, state.error, state.permissions, state.menuPermissions, state.menuItems, clientPermissions, hasMenuAccess, fetchPermissions]
  )

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}
