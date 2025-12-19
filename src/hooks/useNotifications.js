import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../api/supabaseClient'
import { useAuth } from '../contexts/AuthProvider'
import { useTenant } from '../contexts/TenantProvider'

/**
 * Custom hook for managing notifications
 * Provides functions to fetch, mark as read, delete notifications
 */
export function useNotifications() {
  const { user } = useAuth()
  const { tenant } = useTenant()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications
  const fetchNotifications = useCallback(async (filters = {}) => {
    if (!user || !tenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('hrms_notifications')
        .select('*')
        .eq('tenant_id', tenant.tenant_id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.type) {
        query = query.eq('notification_type', filters.type)
      }
      if (filters.read !== undefined) {
        query = query.eq('is_read', filters.read)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setNotifications(data || [])
      
      // Calculate unread count
      const unread = (data || []).filter(n => !n.is_read).length
      setUnreadCount(unread)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, tenant])

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    if (!user || !tenant) return

    try {
      const { count, error: countError } = await supabase
        .from('hrms_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.tenant_id)
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (countError) throw countError
      setUnreadCount(count || 0)
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }, [user, tenant])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!user || !tenant) return

    try {
      const { error: updateError } = await supabase
        .from('hrms_notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('notification_id', notificationId)
        .eq('tenant_id', tenant.tenant_id)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.notification_id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
      throw err
    }
  }, [user, tenant])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user || !tenant) return

    try {
      const { error: updateError } = await supabase
        .from('hrms_notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('tenant_id', tenant.tenant_id)
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (updateError) throw updateError

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      throw err
    }
  }, [user, tenant])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user || !tenant) return

    try {
      const { error: deleteError } = await supabase
        .from('hrms_notifications')
        .delete()
        .eq('notification_id', notificationId)
        .eq('tenant_id', tenant.tenant_id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // Update local state
      const deletedNotification = notifications.find(n => n.notification_id === notificationId)
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId))
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
      throw err
    }
  }, [user, tenant, notifications])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user || !tenant) return

    // Initial fetch
    fetchNotifications()

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hrms_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new, ...prev])
            if (!payload.new.is_read) {
              setUnreadCount(prev => prev + 1)
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n =>
                n.notification_id === payload.new.notification_id ? payload.new : n
              )
            )
            if (payload.new.is_read && !payload.old.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev =>
              prev.filter(n => n.notification_id !== payload.old.notification_id)
            )
            if (!payload.old.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, tenant, fetchNotifications])

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
}
