'use client'
import { useState, useEffect } from 'react'
import { getAdminStats, getSupervisorGroupStats } from '/services/supervisor'
import { getRecentActivities } from '/services/activityLog'
import { useActivityRealtime } from '/hooks/useRealtime'
import AdminPerformanceCard from '/components/supervisor/AdminPerformanceCard'
import ActivityTimeline from '/components/activity/ActivityTimeline'
import StatsCards from '/components/dashboard/StatsCards'
import RealtimeIndicator from '/components/ui/RealtimeIndicator'
import { RefreshCw, Crown, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SupervisorClient({ user, profile }) {
  const [groupStats, setGroupStats] = useState(null)
  const [adminStats, setAdminStats] = useState([])
  const [activities, setActivities] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [realtimeActive, setRealtimeActive] = useState(false)

  const fetchAll = async () => {
    setLoadingStats(true)
    setLoadingActivity(true)
    try {
      const [gs, as, acts] = await Promise.all([
        getSupervisorGroupStats(user.id),
        getAdminStats(user.id),
        getRecentActivities({ limit: 30, supervisorId: user.id }),
      ])
      setGroupStats(gs)
      setAdminStats(as)
      setActivities(acts)
    } catch (err) {
      toast.error('Gagal memuat data: ' + err.message)
    } finally {
      setLoadingStats(false)
      setLoadingActivity(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // Realtime subscription for new activities
  useActivityRealtime({
    supervisorId: user.id,
    onNewActivity: (newLog) => {
      setActivities(prev => [newLog, ...prev].slice(0, 30))
      setRealtimeActive(true)
      // Refresh stats silently
      getSupervisorGroupStats(user.id).then(setGroupStats).catch(() => {})
      getAdminStats(user.id).then(setAdminStats).catch(() => {})
      // Flash realtime indicator
      setTimeout(() => setRealtimeActive(false), 3000)
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.12) 0%,rgba(239,68,68,0.08) 100%)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={16} style={{ color: '#fbbf24' }} />
              <p className="text-xs font-medium" style={{ color: '#fbbf24' }}>Supervisor Panel</p>
            </div>
            <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Monitoring seluruh data group Anda secara realtime
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RealtimeIndicator active={realtimeActive} label="Auto Update" />
            <button onClick={fetchAll} disabled={loadingStats}
              className="btn btn-ghost py-1.5 px-3 text-xs gap-1.5">
              <RefreshCw size={12} className={loadingStats ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Group Stats */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          Ringkasan Group
        </p>
        <StatsCards stats={groupStats} loading={loadingStats} />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Admin Performance */}
        <div className="lg:col-span-2">
          <AdminPerformanceCard adminStats={adminStats} loading={loadingStats} />
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Activity Log</span>
                <RealtimeIndicator active={realtimeActive} />
              </h3>
              <span className="badge badge-brand text-[10px]">{activities.length} entri</span>
            </div>
            <div className="max-h-96 overflow-y-auto pr-1">
              <ActivityTimeline logs={activities} loading={loadingActivity} />
            </div>
          </div>
        </div>
      </div>

      {/* Admin count summary */}
      <div className="card flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(14,165,233,0.12)' }}>
          <Users size={20} style={{ color: 'var(--brand)' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {adminStats.length} Admin dalam group Anda
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Total {groupStats?.total ?? '—'} perusahaan binaan ·{' '}
            {groupStats?.sudahDihubungi ?? '—'} sudah dihubungi ·{' '}
            {groupStats?.followUpTerlambat ?? 0} terlambat
          </p>
        </div>
      </div>
    </div>
  )
}
