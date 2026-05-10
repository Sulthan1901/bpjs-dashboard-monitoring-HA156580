'use client'
// hooks/useRealtime.js
import { useEffect, useRef } from 'react'
import { createClient } from '/lib/supabase'

/**
 * Subscribe to Supabase Realtime changes on perusahaan_binaan.
 * Calls onInsert/onUpdate/onDelete/onChange callbacks.
 */
export function usePerusahaanRealtime({ onInsert, onUpdate, onDelete, onChange, supervisorId, assignedTo }) {
  const channelRef = useRef(null)

  useEffect(() => {
    const supabase = createClient()
    const channelName = `perusahaan-${supervisorId || assignedTo || 'all'}-${Date.now()}`

    let filter = 'deleted_at=is.null'
    if (supervisorId) filter = `supervisor_id=eq.${supervisorId}`
    else if (assignedTo) filter = `assigned_to=eq.${assignedTo}`

    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perusahaan_binaan',
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload
          if (eventType === 'INSERT' && onInsert) onInsert(newRecord)
          if (eventType === 'UPDATE' && onUpdate) onUpdate(newRecord, oldRecord)
          if (eventType === 'DELETE' && onDelete) onDelete(oldRecord)
          if (onChange) onChange({ eventType, newRecord, oldRecord })
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [supervisorId, assignedTo])
}

/**
 * Subscribe to activity_logs realtime.
 */
export function useActivityRealtime({ onNewActivity, supervisorId }) {
  const channelRef = useRef(null)

  useEffect(() => {
    if (!supervisorId) return
    const supabase = createClient()

    channelRef.current = supabase
      .channel(`activity-${supervisorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `supervisor_id=eq.${supervisorId}`,
        },
        (payload) => {
          if (onNewActivity) onNewActivity(payload.new)
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [supervisorId])
}
