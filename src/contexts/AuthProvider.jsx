import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../api/supabaseClient'
import { logger } from '../utils/logger'

export const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

const TENANT_STORAGE_KEY = 'hrms::tenant_id'
const PROFILE_STORAGE_KEY = 'hrms::profile_cache'

const safeParseJson = (value) => {
  try {
    return value ? JSON.parse(value) : null
  } catch (error) {
    logger.warn?.('Failed to parse profile cache', error)
    return null
  }
}

const getInitialProfile = () => {
  if (typeof window === 'undefined') return null
  const cachedProfile = safeParseJson(window.localStorage.getItem(PROFILE_STORAGE_KEY))
  return cachedProfile || null
}

const getInitialTenantId = (initialProfile) => {
  if (initialProfile?.tenant_id) return initialProfile.tenant_id
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TENANT_STORAGE_KEY)
}

const persistTenantContext = (tenantId, profile) => {
  if (typeof window === 'undefined') return
  try {
    if (tenantId) {
      window.localStorage.setItem(TENANT_STORAGE_KEY, tenantId)
    } else {
      window.localStorage.removeItem(TENANT_STORAGE_KEY)
    }

    if (profile) {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    } else {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY)
    }
  } catch (error) {
    logger.warn?.('Failed to persist tenant context', error)
  }
}

export function AuthProvider({ children }) {
  const initialState = useMemo(() => {
    const profileFromCache = getInitialProfile()
    return {
      profile: profileFromCache,
      tenantId: getInitialTenantId(profileFromCache),
    }
  }, [])

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(initialState.profile)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [tenantId, setTenantId] = useState(initialState.tenantId)

  useEffect(() => {
    // Track if this is the initial load to prevent duplicate profile fetches
    let isInitialLoad = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        isInitialLoad = false
      } else {
        setLoading(false)
        isInitialLoad = false
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isInitialLoad && _event === 'SIGNED_IN') {
        isInitialLoad = false
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setTenantId(null)
        persistTenantContext(null, null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
      setTenantId(data?.tenant_id || null)
      persistTenantContext(data?.tenant_id || null, data)
    } catch (error) {
      logger.error('Error fetching profile:', error)
      setProfile(null)
      setTenantId(null)
      persistTenantContext(null, null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
      setTenantId(null)
      persistTenantContext(null, null)
    }
    return { error }
  }

  const resetPassword = async (email) => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin
    const redirectUrl = `${frontendUrl}/reset-password`

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })
    return { data, error }
  }

  const updatePassword = async (newPassword) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) throw sessionError

      if (!sessionData?.session) {
        return {
          data: null,
          error: new Error('No active session. Please request a new password reset link.')
        }
      }

      const isRecentAuth = sessionData.session.expires_at &&
        (new Date(sessionData.session.expires_at * 1000) - new Date()) > 0

      if (!isRecentAuth) {
        return {
          data: null,
          error: new Error('Session expired. Please request a new password reset link.')
        }
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      return { data, error }
    } catch (err) {
      logger.error('Password update error:', err)
      return { data: null, error: err }
    }
  }

  const refreshProfile = () => {
    if (user) {
      fetchProfile(user.id)
    }
  }

  const valueTenantId = tenantId || profile?.tenant_id || null

  const setTenantOverride = (nextTenantId) => {
    setTenantId(nextTenantId)
    persistTenantContext(nextTenantId, profile)
  }

  const value = {
    user,
    profile,
    session,
    loading,
    tenantId: valueTenantId,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
    setTenantId: setTenantOverride,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
