import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../api/supabaseClient'
import { useAuth } from './AuthProvider'
import { logger } from '../utils/logger'

export const TenantContext = createContext({})

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}

const TENANT_DATA_STORAGE_KEY = 'hrms::tenant_data'
const SUBSCRIPTION_STORAGE_KEY = 'hrms::tenant_subscription'

const safeParse = (value) => {
  try {
    return value ? JSON.parse(value) : null
  } catch (error) {
    logger.warn?.('Failed to parse tenant cache', error)
    return null
  }
}

const getInitialTenantState = () => {
  if (typeof window === 'undefined') {
    return { tenant: null, subscription: null }
  }

  return {
    tenant: safeParse(window.localStorage.getItem(TENANT_DATA_STORAGE_KEY)),
    subscription: safeParse(window.localStorage.getItem(SUBSCRIPTION_STORAGE_KEY)),
  }
}

const persistTenantState = (tenantData, subscriptionData) => {
  if (typeof window === 'undefined') return
  try {
    if (tenantData) {
      window.localStorage.setItem(TENANT_DATA_STORAGE_KEY, JSON.stringify(tenantData))
    } else {
      window.localStorage.removeItem(TENANT_DATA_STORAGE_KEY)
    }

    if (subscriptionData) {
      window.localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscriptionData))
    } else {
      window.localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY)
    }
  } catch (error) {
    logger.warn?.('Failed to persist tenant state', error)
  }
}

export function TenantProvider({ children }) {
  const { profile, tenantId: authTenantId, setTenantId: setAuthTenantId } = useAuth()
  const initialState = useMemo(() => getInitialTenantState(), [])
  const [tenant, setTenant] = useState(initialState.tenant)
  const [subscription, setSubscription] = useState(initialState.subscription)
  const [loading, setLoading] = useState(true)

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef(null)

  const effectiveTenantId = profile?.tenant_id || authTenantId || tenant?.tenant_id || null

  useEffect(() => {
    if (!isMountedRef.current) return () => {}

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (effectiveTenantId) {
      abortControllerRef.current = new AbortController()
      fetchTenantData(effectiveTenantId, abortControllerRef.current.signal)
    } else {
      if (isMountedRef.current) {
        setTenant(null)
        setSubscription(null)
        persistTenantState(null, null)
        setLoading(false)
      }
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [effectiveTenantId])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchTenantData = async (tenantId) => {
    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      if (tenantError) throw tenantError

      if (isMountedRef.current) {
        setTenant(tenantData)
      }

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (subError && subError.code !== 'PGRST116') throw subError

      if (isMountedRef.current) {
        setSubscription(subData)
        persistTenantState(tenantData, subData || null)
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        logger.error('Error fetching tenant data:', error)
      }

      if (isMountedRef.current) {
        setTenant(null)
        setSubscription(null)
        persistTenantState(null, null)
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const refreshTenantData = () => {
    if (effectiveTenantId) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()
      fetchTenantData(effectiveTenantId, abortControllerRef.current.signal)
    }
  }

  const setTenantOverride = (nextTenant, nextSubscription = null) => {
    setTenant(nextTenant)
    setSubscription(nextSubscription)
    persistTenantState(nextTenant, nextSubscription)

    if (nextTenant?.tenant_id) {
      setAuthTenantId(nextTenant.tenant_id)
    }
  }

  const hasActivePlan = () => {
    return subscription && subscription.status === 'ACTIVE'
  }

  const getPlanName = () => {
    return subscription?.plan_name || 'FREE'
  }

  const value = {
    tenant,
    subscription,
    loading,
    tenantId: effectiveTenantId,
    refreshTenantData,
    hasActivePlan,
    getPlanName,
    setTenantOverride,
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}
