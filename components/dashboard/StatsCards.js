'use client'

import { Building2, CheckCircle2, XCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color, bgColor, trend }) {
  return (
    <div className="card relative overflow-hidden group hover:border-opacity-30 transition-all duration-300"
      style={{ borderColor: `${color}22` }}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-4 translate-x-4"
        style={{ background: color }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend !== undefined && (
            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <TrendingUp size={11} />
              <span>{trend}</span>
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: bgColor }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function StatsCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="skeleton h-4 w-24 mb-3 rounded" />
            <div className="skeleton h-8 w-16 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      icon: Building2,
      label: 'Total Perusahaan',
      value: stats?.total ?? 0,
      color: '#0ea5e9',
      bgColor: 'rgba(14,165,233,0.12)',
    },
    {
      icon: CheckCircle2,
      label: 'Sudah Dihubungi',
      value: stats?.sudahDihubungi ?? 0,
      color: '#10b981',
      bgColor: 'rgba(16,185,129,0.12)',
      trend: stats?.total ? `${Math.round((stats.sudahDihubungi / stats.total) * 100)}% dari total` : undefined,
    },
    {
      icon: AlertCircle,
      label: 'Follow Up Terlambat',
      value: stats?.followUpTerlambat ?? 0,
      color: '#ef4444',
      bgColor: 'rgba(239,68,68,0.12)',
    },
    {
      icon: Clock,
      label: 'Follow Up Hari Ini',
      value: stats?.followUpHariIni ?? 0,
      color: '#f59e0b',
      bgColor: 'rgba(245,158,11,0.12)',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <StatCard key={i} {...card} />
      ))}
    </div>
  )
}
