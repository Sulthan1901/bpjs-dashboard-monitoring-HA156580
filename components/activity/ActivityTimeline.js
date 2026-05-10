'use client'
// components/activity/ActivityTimeline.js
import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'
import { ACTION_LABELS, ACTION_COLORS, ACTION_TYPES } from '/services/activityLog'
import { Plus, Edit2, Trash2, Upload, Zap, RefreshCw } from 'lucide-react'

const ACTION_ICONS = {
  CREATE: Plus,
  UPDATE: Edit2,
  DELETE: Trash2,
  UPLOAD_LAMPIRAN: Upload,
  INLINE_EDIT: Zap,
}

const FIELD_LABELS = {
  nama_perusahaan: 'Nama Perusahaan', npp: 'NPP', alamat: 'Alamat',
  nama_pic: 'Nama PIC', no_telp_pic: 'No. Telp PIC',
  status_kontak: 'Status Kontak', status_sipp: 'Status SIPP',
  keterangan: 'Keterangan', next_follow_up_date: 'Follow Up',
  assigned_to: 'Ditugaskan Ke', lampiran: 'Lampiran',
}

function ActivityItem({ log, compact = false }) {
  const color = ACTION_COLORS[log.action_type] || '#64748b'
  const Icon = ACTION_ICONS[log.action_type] || Edit2
  const label = ACTION_LABELS[log.action_type] || log.action_type

  const timeAgo = formatDistanceToNow(new Date(log.created_at), {
    addSuffix: true, locale: id
  })
  const timeExact = format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: id })

  const changedFields = log.changed_fields || []

  return (
    <div className="flex gap-3 group">
      {/* Icon */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center z-10"
          style={{ background: `${color}20`, border: `1.5px solid ${color}40` }}>
          <Icon size={14} style={{ color }} />
        </div>
        {!compact && <div className="w-px flex-1 mt-1" style={{ background: 'var(--border)', minHeight: '16px' }} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
          <span className="text-xs font-semibold text-white">{log.user_name || '—'}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>melakukan</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: `${color}15`, color }}>
            {label}
          </span>
        </div>

        {log.perusahaan_nama && (
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            📋 {log.perusahaan_nama}
          </p>
        )}

        {!compact && changedFields.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {changedFields.slice(0, 5).map(f => (
              <span key={f} className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {FIELD_LABELS[f] || f}
              </span>
            ))}
            {changedFields.length > 5 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                +{changedFields.length - 5} lainnya
              </span>
            )}
          </div>
        )}

        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }} title={timeExact}>
          {timeAgo}
        </p>
      </div>
    </div>
  )
}

export default function ActivityTimeline({ logs = [], loading, compact = false, onRefresh }) {
  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-40 rounded" />
              <div className="skeleton h-3 w-60 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!logs.length) {
    return (
      <div className="text-center py-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
          style={{ background: 'var(--bg-elevated)' }}>
          <RefreshCw size={18} style={{ color: 'var(--text-muted)' }} />
        </div>
        <p className="text-sm font-medium text-white mb-1">Belum ada aktivitas</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Aktivitas akan muncul di sini secara realtime
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {logs.map(log => (
        <ActivityItem key={log.id} log={log} compact={compact} />
      ))}
    </div>
  )
}
