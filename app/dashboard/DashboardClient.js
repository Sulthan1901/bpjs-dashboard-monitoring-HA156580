'use client'
import { useState, useEffect } from 'react'
import { perusahaanService } from '/services/perusahaan'
import { getAllForExport } from '/services/perusahaan'
import StatsCards from '/components/dashboard/StatsCards'
import StatusBreakdown from '/components/dashboard/StatusBreakdown'
import PriorityList from '/components/dashboard/PriorityList'
import RealtimeIndicator from '/components/ui/RealtimeIndicator'
import { usePerusahaanRealtime } from '/hooks/useRealtime'
import { RefreshCw, ExternalLink, Crown } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export default function DashboardClient({ user, profile }) {
  const [stats, setStats] = useState(null)
  const [recentData, setRecentData] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingRecent, setLoadingRecent] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [realtimeFlash, setRealtimeFlash] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const isSupervisor = profile?.role === 'supervisor'
  const supervisorId = isSupervisor ? user.id : (profile?.supervisor_id || null)

  const fetchData = async () => {
    setLoadingStats(true)
    setLoadingRecent(true)
    try {
      const [statsResult, recentResult] = await Promise.all([
        perusahaanService.getStats({ userId: user.id, isAdmin, isSupervisor, supervisorId }),
        getAllForExport({ userId: user.id, isAdmin, isSupervisor, supervisorId }),
      ])
      setStats(statsResult)
      setRecentData(recentResult)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoadingStats(false)
      setLoadingRecent(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Realtime subscription
  usePerusahaanRealtime({
    supervisorId: isSupervisor ? user.id : null,
    assignedTo: isAdmin ? user.id : null,
    onChange: () => {
      setRealtimeFlash(true)
      setTimeout(() => setRealtimeFlash(false), 3000)
      // Silently refresh stats
      perusahaanService.getStats({ userId: user.id, isAdmin, isSupervisor, supervisorId })
        .then(setStats).catch(() => {})
    },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: isSupervisor
            ? 'linear-gradient(135deg,rgba(245,158,11,0.12) 0%,rgba(239,68,68,0.08) 100%)'
            : 'linear-gradient(135deg,rgba(14,165,233,0.15) 0%,rgba(139,92,246,0.1) 100%)',
          border: `1px solid ${isSupervisor ? 'rgba(245,158,11,0.2)' : 'rgba(14,165,233,0.2)'}`
        }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: isSupervisor ? '#fbbf24' : 'var(--brand)' }}>
              {format(new Date(), "EEEE, d MMMM yyyy", { locale: id })}
            </p>
            <h2 className="text-xl font-bold text-white mb-1">
              Selamat datang, {profile?.name || 'User'} 👋
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isSupervisor
                ? 'Anda masuk sebagai Supervisor — monitoring seluruh group.'
                : isAdmin
                  ? 'Anda masuk sebagai Admin — kelola data binaan Anda.'
                  : 'Berikut ringkasan data perusahaan binaan yang Anda kelola.'}
            </p>
          </div>
          <RealtimeIndicator active={realtimeFlash} label="Realtime" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Ringkasan
        </h3>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Update: {format(lastUpdated, 'HH:mm:ss')}
            </span>
          )}
          <button onClick={fetchData} disabled={loadingStats}
            className="btn btn-ghost py-1.5 px-3 text-xs gap-1.5">
            <RefreshCw size={12} className={loadingStats ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <StatsCards stats={stats} loading={loadingStats} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <StatusBreakdown stats={stats} loading={loadingStats} />
        </div>
        <div className="lg:col-span-2">
          <PriorityList data={recentData} loading={loadingRecent} />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/perusahaan"
          className="card flex items-center justify-between group hover:border-blue-500/30 transition-all">
          <div>
            <p className="text-sm font-semibold text-white mb-1">Kelola Perusahaan Binaan</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lihat, tambah, dan edit data</p>
          </div>
          <ExternalLink size={18} className="group-hover:text-blue-400 transition-colors"
            style={{ color: 'var(--text-muted)' }} />
        </Link>

        {isSupervisor && (
          <Link href="/supervisor"
            className="card flex items-center justify-between group hover:border-yellow-500/30 transition-all"
            style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Supervisor Panel</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Performa admin & activity log group
              </p>
            </div>
            <Crown size={18} style={{ color: '#fbbf24' }} className="group-hover:scale-110 transition-transform" />
          </Link>
        )}

        {isAdmin && (
          <Link href="/activity"
            className="card flex items-center justify-between group hover:border-purple-500/30 transition-all">
            <div>
              <p className="text-sm font-semibold text-white mb-1">Aktivitas Saya</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Histori perubahan data</p>
            </div>
            <ExternalLink size={18} className="group-hover:text-purple-400 transition-colors"
              style={{ color: 'var(--text-muted)' }} />
          </Link>
        )}
      </div>
    </div>
  )
}
