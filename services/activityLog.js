import { createClient } from '/lib/supabase'

export const ACTION_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  UPLOAD_LAMPIRAN: 'UPLOAD_LAMPIRAN',
  INLINE_EDIT: 'INLINE_EDIT',
}

export const ACTION_LABELS = {
  CREATE: 'Tambah Perusahaan',
  UPDATE: 'Edit Data',
  DELETE: 'Hapus Data',
  UPLOAD_LAMPIRAN: 'Upload Lampiran',
  INLINE_EDIT: 'Edit Inline',
}

export const ACTION_COLORS = {
  CREATE: '#10b981',
  UPDATE: '#0ea5e9',
  DELETE: '#ef4444',
  UPLOAD_LAMPIRAN: '#8b5cf6',
  INLINE_EDIT: '#f59e0b',
}

/**
 * Log an activity to the activity_logs table.
 * Fire-and-forget — does not throw to avoid blocking UI.
 */
export async function logActivity({
  userId,
  userName,
  supervisorId,
  perusahaanId,
  perusahaanNama,
  actionType,
  oldData = null,
  newData = null,
  changedFields = [],
}) {
  try {
    const supabase = createClient()
    await supabase.from('activity_logs').insert([{
      user_id: userId,
      user_name: userName,
      supervisor_id: supervisorId,
      perusahaan_id: perusahaanId,
      perusahaan_nama: perusahaanNama,
      action_type: actionType,
      old_data: oldData,
      new_data: newData,
      changed_fields: changedFields,
    }])
  } catch (err) {
    // Never block the main flow
    console.warn('[ActivityLog] Failed to log:', err.message)
  }
}

/**
 * Detect which fields changed between old and new data objects.
 */
export function detectChangedFields(oldData, newData) {
  if (!oldData) return Object.keys(newData || {})
  const keys = new Set([...Object.keys(oldData), ...Object.keys(newData || {})])
  const changed = []
  for (const key of keys) {
    const ignoredKeys = ['created_at', 'updated_at', 'deleted_at', 'id']
    if (ignoredKeys.includes(key)) continue
    const oldVal = JSON.stringify(oldData[key] ?? null)
    const newVal = JSON.stringify(newData?.[key] ?? null)
    if (oldVal !== newVal) changed.push(key)
  }
  return changed
}

/**
 * Fetch activity logs for supervisor view.
 */
export async function getActivityLogs({
  supervisorId = null,
  userId = null,
  limit = 50,
  page = 1,
  actionType = '',
} = {}) {
  const supabase = createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (supervisorId) query = query.eq('supervisor_id', supervisorId)
  if (userId) query = query.eq('user_id', userId)
  if (actionType) query = query.eq('action_type', actionType)

  const { data, error, count } = await query
  if (error) throw error
  return { data: data || [], count: count || 0 }
}

/**
 * Fetch recent activities (last N).
 */
export async function getRecentActivities({ limit = 20, supervisorId = null } = {}) {
  const supabase = createClient()
  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (supervisorId) query = query.eq('supervisor_id', supervisorId)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * Get activity summary stats per admin (for supervisor analytics).
 */
export async function getActivityStatsByAdmin(supervisorId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('activity_logs')
    .select('user_id, user_name, action_type')
    .eq('supervisor_id', supervisorId)

  if (error) throw error

  // Aggregate client-side
  const statsMap = {}
  for (const log of data || []) {
    if (!statsMap[log.user_id]) {
      statsMap[log.user_id] = {
        userId: log.user_id,
        userName: log.user_name,
        total: 0,
        CREATE: 0,
        UPDATE: 0,
        DELETE: 0,
        UPLOAD_LAMPIRAN: 0,
        INLINE_EDIT: 0,
      }
    }
    statsMap[log.user_id].total++
    statsMap[log.user_id][log.action_type] = (statsMap[log.user_id][log.action_type] || 0) + 1
  }

  return Object.values(statsMap).sort((a, b) => b.total - a.total)
}
