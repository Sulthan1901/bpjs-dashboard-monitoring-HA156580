'use client'

import { differenceInDays, format } from 'date-fns'
import { id } from 'date-fns/locale'
import { openWhatsApp } from '/services/whatsapp'
import { MessageCircle, AlertCircle, Clock } from 'lucide-react'

export default function PriorityList({ data, loading }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const priority = data
    .filter(row => {
      if (!row.next_follow_up_date) return false
      const d = new Date(row.next_follow_up_date)
      d.setHours(0, 0, 0, 0)
      return differenceInDays(d, today) <= 3
    })
    .sort((a, b) => new Date(a.next_follow_up_date) - new Date(b.next_follow_up_date))
    .slice(0, 8)

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-4 w-40 mb-4 rounded" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">Prioritas Follow Up</h3>
        <span className="badge badge-warning">{priority.length} data</span>
      </div>

      {priority.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(16,185,129,0.12)' }}>
            <Clock size={20} style={{ color: '#10b981' }} />
          </div>
          <p className="text-sm font-medium text-white mb-1">Tidak ada follow up mendesak</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Semua jadwal aman untuk 3 hari ke depan
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {priority.map(row => {
            const d = new Date(row.next_follow_up_date)
            d.setHours(0, 0, 0, 0)
            const diff = differenceInDays(d, today)
            const isOverdue = diff < 0
            const isToday = diff === 0

            return (
              <div key={row.id}
                className="flex items-center gap-3 p-3 rounded-lg transition-all"
                style={{
                  background: isOverdue
                    ? 'rgba(239,68,68,0.06)'
                    : isToday
                      ? 'rgba(245,158,11,0.06)'
                      : 'var(--bg-elevated)',
                  border: `1px solid ${isOverdue
                    ? 'rgba(239,68,68,0.15)'
                    : isToday
                      ? 'rgba(245,158,11,0.15)'
                      : 'var(--border)'}`
                }}>
                <div className="flex-shrink-0">
                  {isOverdue ? (
                    <AlertCircle size={16} style={{ color: '#f87171' }} />
                  ) : (
                    <Clock size={16} style={{ color: isToday ? '#fbbf24' : 'var(--text-muted)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{row.nama_perusahaan}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {row.nama_pic || '—'} ·{' '}
                    <span style={{
                      color: isOverdue ? '#f87171' : isToday ? '#fbbf24' : 'var(--text-muted)'
                    }}>
                      {isOverdue
                        ? `Terlambat ${Math.abs(diff)} hari`
                        : isToday
                          ? 'Hari ini'
                          : format(d, 'd MMM', { locale: id })}
                    </span>
                  </p>
                </div>
                {row.no_telp_pic && (
                  <button
                    onClick={() => openWhatsApp(row.no_telp_pic, row)}
                    className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-green-500/10"
                    style={{ color: 'var(--text-muted)' }}
                    title="Chat WhatsApp">
                    <MessageCircle size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
