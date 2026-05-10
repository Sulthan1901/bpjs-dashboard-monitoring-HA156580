'use client'
// components/supervisor/AdminPerformanceCard.js
import { TrendingUp, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

function ProgressBar({ value, max, color = '#0ea5e9' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function AdminStatRow({ admin }) {
  const progressColor = admin.progressPct >= 70 ? '#10b981'
    : admin.progressPct >= 40 ? '#f59e0b'
    : '#ef4444'

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-white/[0.02]"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', color: 'white' }}>
        {admin.adminName?.[0]?.toUpperCase() || 'A'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-white truncate">{admin.adminName}</p>
          <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: progressColor }}>
            {admin.progressPct}%
          </span>
        </div>
        <ProgressBar value={admin.sudahDihubungi} max={admin.total} color={progressColor} />
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {admin.total} perusahaan
          </span>
          <span className="text-[10px]" style={{ color: '#34d399' }}>
            ✓ {admin.sudahDihubungi}
          </span>
          {admin.followUpTerlambat > 0 && (
            <span className="text-[10px]" style={{ color: '#f87171' }}>
              ⚠ {admin.followUpTerlambat} terlambat
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminPerformanceCard({ adminStats = [], loading }) {
  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-4 w-40 mb-4 rounded" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <TrendingUp size={16} style={{ color: 'var(--brand)' }} />
          Performa Admin
        </h3>
        <span className="badge badge-brand text-[10px]">{adminStats.length} admin</span>
      </div>

      {adminStats.length === 0 ? (
        <div className="text-center py-6">
          <Users size={24} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Belum ada admin dalam group ini</p>
        </div>
      ) : (
        <div className="space-y-2">
          {adminStats.map(admin => (
            <AdminStatRow key={admin.adminId} admin={admin} />
          ))}
        </div>
      )}
    </div>
  )
}
