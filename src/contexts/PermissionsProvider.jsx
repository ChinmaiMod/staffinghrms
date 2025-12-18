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
  })

  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      setState({ loading: false, error: null, permissions: null })
      return
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        throw new Error('No active role assignment found for this user.')
      }

      setState({ loading: false, error: null, permissions: data })
    } catch (error) {
      logger.error('Failed to load permissions', error)
      setState({ loading: false, error, permissions: null })
    }
  }, [user?.id])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  const clientPermissions = useMemo(
    () => deriveClientPermissions(state.permissions),
    [state.permissions]
  )

  const value = useMemo(
    () => ({
      loading: state.loading,
      error: state.error,
      permissions: state.permissions,
      roleLevel: state.permissions?.role_level ?? null,
      roleCode: state.permissions?.role_code ?? null,
      clientPermissions,
      refresh: fetchPermissions,
    }),
    [state.loading, state.error, state.permissions, clientPermissions, fetchPermissions]
  )

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}
