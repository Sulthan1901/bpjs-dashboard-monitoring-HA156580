// services/supervisor.js
import { createClient } from '/lib/supabase'

/**
 * Get all admins under a supervisor.
 */
export async function getSupervisorAdmins(supervisorId) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users_profile')
    .select('id, name, email, role, created_at')
    .eq('supervisor_id', supervisorId)
    .order('name')

  if (error) throw error
  return data || []
}

/**
 * Get stats for each admin under supervisor (perusahaan counts).
 */
export async function getAdminStats(supervisorId) {
  const supabase = createClient()

  // Get all admins first
  const { data: admins, error: adminsErr } = await supabase
    .from('users_profile')
    .select('id, name, email, role')
    .eq('supervisor_id', supervisorId)

  if (adminsErr) throw adminsErr
  if (!admins?.length) return []

  const adminIds = admins.map(a => a.id)
  const today = new Date().toISOString().split('T')[0]

  // Run parallel count queries for each metric
  const results = await Promise.all(
    adminIds.map(async (adminId) => {
      const base = () =>
        supabase
          .from('perusahaan_binaan')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', adminId)
          .is('deleted_at', null)

      const [total, sudah, belum, tidakBisa, terlambat] = await Promise.all([
        base(),
        base().eq('status_kontak', 'Sudah Dihubungi'),
        base().eq('status_kontak', 'Belum Dihubungi'),
        base().eq('status_kontak', 'Tidak Bisa Dihubungi'),
        base().lt('next_follow_up_date', today).not('next_follow_up_date', 'is', null),
      ])

      const admin = admins.find(a => a.id === adminId)
      return {
        adminId,
        adminName: admin?.name || '—',
        adminEmail: admin?.email || '',
        total: total.count || 0,
        sudahDihubungi: sudah.count || 0,
        belumDihubungi: belum.count || 0,
        tidakBisaDihubungi: tidakBisa.count || 0,
        followUpTerlambat: terlambat.count || 0,
        progressPct: total.count
          ? Math.round(((sudah.count || 0) / total.count) * 100)
          : 0,
      }
    })
  )

  return results.sort((a, b) => b.progressPct - a.progressPct)
}

/**
 * Get overall group stats for supervisor.
 */
export async function getSupervisorGroupStats(supervisorId) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const base = () =>
    supabase
      .from('perusahaan_binaan')
      .select('*', { count: 'exact', head: true })
      .eq('supervisor_id', supervisorId)
      .is('deleted_at', null)

  const [total, sudah, belum, tidakBisa, aktif, nonAktif, terlambat, hariIni] =
    await Promise.all([
      base(),
      base().eq('status_kontak', 'Sudah Dihubungi'),
      base().eq('status_kontak', 'Belum Dihubungi'),
      base().eq('status_kontak', 'Tidak Bisa Dihubungi'),
      base().eq('status_sipp', 'Aktif'),
      base().eq('status_sipp', 'Non Aktif'),
      base().lt('next_follow_up_date', today).not('next_follow_up_date', 'is', null),
      base().eq('next_follow_up_date', today),
    ])

  return {
    total: total.count || 0,
    sudahDihubungi: sudah.count || 0,
    belumDihubungi: belum.count || 0,
    tidakBisaDihubungi: tidakBisa.count || 0,
    aktif: aktif.count || 0,
    nonAktif: nonAktif.count || 0,
    followUpTerlambat: terlambat.count || 0,
    followUpHariIni: hariIni.count || 0,
  }
}

/**
 * Assign an admin to a supervisor group.
 */
export async function assignAdminToGroup(adminId, supervisorId) {
  const supabase = createClient()
  const { error } = await supabase
    .from('users_profile')
    .update({ supervisor_id: supervisorId })
    .eq('id', adminId)

  if (error) throw error
}

/**
 * Get all perusahaan for supervisor (batched, bypass 1000-row limit).
 */
export async function getSupervisorPerusahaan({
  supervisorId,
  search = '',
  status = '',
  adminId = '',
  page = 1,
  limit = 20,
} = {}) {
  const supabase = createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('perusahaan_binaan')
    .select('*, users_profile!assigned_to(name, id)', { count: 'exact' })
    .eq('supervisor_id', supervisorId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(
      `nama_perusahaan.ilike.%${search}%,npp.ilike.%${search}%,nama_pic.ilike.%${search}%`
    )
  }
  if (status) query = query.eq('status_kontak', status)
  if (adminId) query = query.eq('assigned_to', adminId)

  const { data, error, count } = await query
  if (error) throw error
  return { data: data || [], count: count || 0 }
}
