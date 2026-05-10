'use client'

export default function StatusBreakdown({ stats, loading }) {
  if (loading) {
    return (
      <div className="card h-full">
        <div className="skeleton h-4 w-36 mb-4 rounded" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <div className="skeleton h-3 w-full rounded-full mb-1" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const total = stats?.total || 1

  const items = [
    {
      label: 'Sudah Dihubungi',
      value: stats?.sudahDihubungi ?? 0,
      color: '#10b981',
      bg: 'rgba(16,185,129,0.15)',
    },
    {
      label: 'Belum Dihubungi',
      value: stats?.belumDihubungi ?? 0,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.15)',
    },
    {
      label: 'Tidak Bisa Dihubungi',
      value: stats?.tidakBisaDihubungi ?? 0,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.15)',
    },
  ]

  const sippItems = [
    { label: 'SIPP Aktif', value: stats?.aktif ?? 0, color: '#0ea5e9' },
    { label: 'SIPP Non Aktif', value: stats?.nonAktif ?? 0, color: '#64748b' },
  ]

  return (
    <div className="card h-full">
      <h3 className="text-sm font-semibold text-white mb-5">Distribusi Status Kontak</h3>

      <div className="space-y-4 mb-6">
        {items.map(item => {
          const pct = Math.round((item.value / total) * 100)
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{item.value}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: item.color }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
        <h4 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
          Status SIPP
        </h4>
        <div className="flex gap-4">
          {sippItems.map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.label}:</span>
              <span className="text-xs font-bold text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
