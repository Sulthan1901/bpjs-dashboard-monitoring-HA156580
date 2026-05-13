// services/perusahaan.js
import { createClient } from '/lib/supabase'
import { logActivity, detectChangedFields, ACTION_TYPES } from './activityLog'

const TABLE = 'perusahaan_binaan'

export const perusahaanService = {
  async getAll({ page = 1, limit = 20, search = '', status = '', sipp = '', adminId = '', userId = null, isAdmin = false, isSupervisor = false, supervisorId = null } = {}) {
    const supabase = createClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from(TABLE)
      .select('*, users_profile!assigned_to(name)', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (isSupervisor && supervisorId) {
      query = query.eq('supervisor_id', supervisorId)
    } else if (isAdmin && supervisorId) {
      query = query.eq('supervisor_id', supervisorId)
    } else if (userId) {
      query = query.eq('assigned_to', userId)
    }

    if (search) query = query.or(`nama_perusahaan.ilike.%${search}%,npp.ilike.%${search}%,nama_pic.ilike.%${search}%`)
    if (status) query = query.eq('status_kontak', status)
    if (sipp) query = query.eq('status_sipp', sipp)
    if (adminId) query = query.eq('assigned_to', adminId)

    const { data, error, count } = await query
    if (error) throw error
    return { data: data || [], count: count || 0 }
  },

  async getById(id) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, users_profile!assigned_to(name, id)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getStats({ userId = null, isAdmin = false, isSupervisor = false, supervisorId = null } = {}) {
    const supabase = createClient()
    const todayStr = new Date().toISOString().split('T')[0]

    const baseFilter = (q) => {
      q = q.is('deleted_at', null)
      if (isSupervisor && supervisorId) q = q.eq('supervisor_id', supervisorId)
      else if (isAdmin && supervisorId) q = q.eq('supervisor_id', supervisorId)
      else if (userId) q = q.eq('assigned_to', userId)
      return q
    }

    const [total, sudah, belum, tidakBisa, aktif, nonAktif, terlambat, hariIni] =
      await Promise.all([
        baseFilter(supabase.from(TABLE).select('*', { count: 'exact', head: true })),
        baseFilter(supabase.from(TABLE).select('*', { count: 'exact', head: true })).eq('status_kontak', 'Sudah Dihubungi'),
        baseFilter(supabase.from(TABLE).select('*', { count: 'exact', head: true })).eq('status_kontak', 'Belum Dihubungi'),
        baseFilter(supabase.from(TABLE).select('*', { count: 'exact', head: true })).eq('status_kontak', 'Tidak Bisa Dihubungi'),
        baseFilter(supabase.from(TABLE).select('*', { count: 'exact', head: true })).eq('status_sipp', 'Aktif'),
        baseFilter(supabase.from(TABLE).select('*', { count: 'exact', head: true })).eq('status_sipp', 'Non Aktif'),
        baseFilter(supabase.from(TABLE).select('*', { count: 'exact', head: true })).lt('next_follow_up_date', todayStr).not('next_follow_up_date', 'is', null),
        baseFilter(supabase.from(TABLE).select('*', { count: 'exact', head: true })).eq('next_follow_up_date', todayStr),
      ])

    return {
      total: total.count ?? 0,
      sudahDihubungi: sudah.count ?? 0,
      belumDihubungi: belum.count ?? 0,
      tidakBisaDihubungi: tidakBisa.count ?? 0,
      aktif: aktif.count ?? 0,
      nonAktif: nonAktif.count ?? 0,
      followUpTerlambat: terlambat.count ?? 0,
      followUpHariIni: hariIni.count ?? 0,
    }
  },

  async create(payload, actorInfo = null) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from(TABLE)
      .insert([{ ...payload, created_at: new Date().toISOString() }])
      .select()
      .single()
    if (error) throw error

    if (actorInfo) {
      logActivity({ userId: actorInfo.userId, userName: actorInfo.userName, supervisorId: payload.supervisor_id || actorInfo.supervisorId, perusahaanId: data.id, perusahaanNama: data.nama_perusahaan, actionType: ACTION_TYPES.CREATE, newData: payload, changedFields: Object.keys(payload) })
      triggerEmailNotification({ actionType: ACTION_TYPES.CREATE, actorInfo, perusahaanId: data.id, perusahaanNama: data.nama_perusahaan, newData: payload, changedFields: Object.keys(payload), supervisorId: payload.supervisor_id || actorInfo.supervisorId })
    }
    return data
  },

  async update(id, payload, actorInfo = null) {
    const supabase = createClient()
    let oldData = null
    if (actorInfo) {
      const { data: old } = await supabase.from(TABLE).select('*').eq('id', id).single()
      oldData = old
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    if (actorInfo && oldData) {
      const changed = detectChangedFields(oldData, payload)
      logActivity({ userId: actorInfo.userId, userName: actorInfo.userName, supervisorId: oldData.supervisor_id || actorInfo.supervisorId, perusahaanId: id, perusahaanNama: oldData.nama_perusahaan, actionType: ACTION_TYPES.UPDATE, oldData, newData: { ...oldData, ...payload }, changedFields: changed })
      triggerEmailNotification({ actionType: ACTION_TYPES.UPDATE, actorInfo, perusahaanId: id, perusahaanNama: oldData.nama_perusahaan, oldData, newData: { ...oldData, ...payload }, changedFields: changed, supervisorId: oldData.supervisor_id || actorInfo.supervisorId })
    }
    return data
  },

  async softDelete(id, actorInfo = null) {
    const supabase = createClient()
    let perusahaanNama = ''
    let supervisorId = actorInfo?.supervisorId
    if (actorInfo) {
      const { data: old } = await supabase.from(TABLE).select('nama_perusahaan, supervisor_id').eq('id', id).single()
      perusahaanNama = old?.nama_perusahaan || ''
      supervisorId = old?.supervisor_id || supervisorId
    }
    // Gunakan RPC SECURITY DEFINER untuk bypass RLS issue pada soft delete
    const { error } = await supabase.rpc('soft_delete_perusahaan', { p_id: id })
    if (error) throw error

    if (actorInfo) {
      logActivity({ userId: actorInfo.userId, userName: actorInfo.userName, supervisorId, perusahaanId: id, perusahaanNama, actionType: ACTION_TYPES.DELETE })
      triggerEmailNotification({ actionType: ACTION_TYPES.DELETE, actorInfo, perusahaanId: id, perusahaanNama, changedFields: [], supervisorId })
    }
  },

  async uploadLampiran(file, perusahaanId) {
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const fileName = `${perusahaanId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('lampiran').upload(fileName, file, { upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('lampiran').getPublicUrl(fileName)
    return { path: fileName, url: data.publicUrl, name: file.name }
  },

  async deleteLampiran(path) {
    const supabase = createClient()
    const { error } = await supabase.storage.from('lampiran').remove([path])
    if (error) throw error
  },

  async getUsers({ supervisorId = null } = {}) {
    const supabase = createClient()
    let query = supabase.from('users_profile').select('id, name, role, email, supervisor_id').order('name')
    if (supervisorId) query = query.eq('supervisor_id', supervisorId)
    const { data, error } = await query
    if (error) throw error
    return data || []
  },
}

function triggerEmailNotification(payload) {
  try {
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})
  } catch {}
}

export async function getAllForExport({ search = '', status = '', sipp = '', adminId = '', userId = null, isAdmin = false, isSupervisor = false, supervisorId = null } = {}) {
  const supabase = createClient()
  const BATCH = 1000
  let allData = []
  let from = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase
      .from(TABLE)
      .select('*, users_profile!assigned_to(name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, from + BATCH - 1)

    if (isSupervisor && supervisorId) query = query.eq('supervisor_id', supervisorId)
    else if (isAdmin && supervisorId) query = query.eq('supervisor_id', supervisorId)
    else if (userId) query = query.eq('assigned_to', userId)

    if (adminId) query = query.eq('assigned_to', adminId)
    if (search) query = query.or(`nama_perusahaan.ilike.%${search}%,npp.ilike.%${search}%,nama_pic.ilike.%${search}%`)
    if (status) query = query.eq('status_kontak', status)
    if (sipp) query = query.eq('status_sipp', sipp)

    const { data, error } = await query
    if (error) throw error
    allData = allData.concat(data || [])
    hasMore = data && data.length === BATCH
    from += BATCH
  }
  return allData
}
