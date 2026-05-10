'use client'

import { useState } from 'react'
import { StatusBadge, STATUS_KONTAK_OPTIONS } from '/components/ui/StatusBadge'
import { openWhatsApp } from '/services/whatsapp'
import {
  Phone, Edit2, Trash2, Check, X, MessageCircle,
  FileText, Download, ChevronUp, ChevronDown, AlertCircle
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { id } from 'date-fns/locale'

function FollowUpIndicator({ date }) {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const diff = differenceInDays(d, today)

  if (diff < 0) {
    return (
      <span className="flex items-center gap-1 text-xs" style={{ color: '#f87171' }}>
        <AlertCircle size={11} /> Terlambat {Math.abs(diff)}h
      </span>
    )
  }
  if (diff === 0) {
    return <span className="text-xs font-medium" style={{ color: '#fbbf24' }}>Hari ini</span>
  }
  return (
    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
      {format(d, 'd MMM', { locale: id })}
    </span>
  )
}

function InlineEditCell({ value, options, onSave, onCancel }) {
  const [val, setVal] = useState(value)
  return (
    <div className="flex items-center gap-1">
      <select
        className="input-base py-1 text-xs"
        value={val}
        onChange={e => setVal(e.target.value)}
        autoFocus>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <button onClick={() => onSave(val)}
        className="p-1 rounded" style={{ color: '#34d399' }}>
        <Check size={14} />
      </button>
      <button onClick={onCancel}
        className="p-1 rounded" style={{ color: '#f87171' }}>
        <X size={14} />
      </button>
    </div>
  )
}

export default function PerusahaanTable({
  data, loading, isAdmin, isSupervisor, currentUserId, onEdit, onDelete, onUpdate
}) {
  const [inlineEdit, setInlineEdit] = useState(null) // { id, field }
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={12} style={{ opacity: 0.3 }} />
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortField] || ''
    const bv = b[sortField] || ''
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  const handleInlineSave = async (row, field, val) => {
    await onUpdate(row.id, { [field]: val })
    setInlineEdit(null)
  }

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--bg-elevated)' }}>
          <FileText size={28} style={{ color: 'var(--text-muted)' }} />
        </div>
        <p className="text-sm font-medium text-white mb-1">Tidak ada data</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Coba ubah filter atau tambah data baru
        </p>
      </div>
    )
  }

  const thClass = "px-4 py-3 text-left text-xs font-semibold cursor-pointer select-none group"

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {[
              { key: 'npp', label: 'NPP' },
              { key: 'nama_perusahaan', label: 'Perusahaan' },
              { key: 'nama_pic', label: 'PIC' },
              { key: 'status_kontak', label: 'Status Kontak' },
              { key: 'status_sipp', label: 'SIPP' },
              { key: 'next_follow_up_date', label: 'Follow Up' },
            ].map(col => (
              <th key={col.key}
                className={thClass}
                style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
                onClick={() => handleSort(col.key)}>
                <div className="flex items-center gap-1">
                  {col.label}
                  <SortIcon field={col.key} />
                </div>
              </th>
            ))}
            {isAdmin && (
              <th className={thClass}
                style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
                ARK
              </th>
            )}
            <th className="px-4 py-3 text-right text-xs font-semibold"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => {
            const isPriority = row.next_follow_up_date && (() => {
              const d = new Date(row.next_follow_up_date)
              d.setHours(0, 0, 0, 0)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return differenceInDays(d, today) <= 0
            })()

            // Supervisor bisa edit semua, admin hanya bisa edit yang di-assign ke dia
            const canEdit = isSupervisor || (row.assigned_to === currentUserId)

            return (
              <tr
                key={row.id}
                className={`table-row-hover transition-colors ${isPriority ? 'priority-row' : ''}`}
                style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {row.npp || '—'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-white truncate max-w-[200px]">
                      {row.nama_perusahaan}
                    </p>
                    {row.alamat && (
                      <p className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>
                        {row.alamat}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-white">{row.nama_pic || '—'}</p>
                  {row.no_telp_pic && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.no_telp_pic}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {inlineEdit?.id === row.id && inlineEdit?.field === 'status_kontak' ? (
                    <InlineEditCell
                      value={row.status_kontak}
                      options={STATUS_KONTAK_OPTIONS}
                      onSave={val => handleInlineSave(row, 'status_kontak', val)}
                      onCancel={() => setInlineEdit(null)}
                    />
                  ) : (
                    <div
                      className={canEdit ? 'cursor-pointer inline-flex items-center gap-1 group' : 'inline-flex'}
                      onClick={() => canEdit && setInlineEdit({ id: row.id, field: 'status_kontak' })}>
                      <StatusBadge status={row.status_kontak} type="kontak" />
                      {canEdit && <Edit2 size={10} className="opacity-0 group-hover:opacity-50 transition-opacity"
                        style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status_sipp} type="sipp" />
                </td>
                <td className="px-4 py-3">
                  <FollowUpIndicator date={row.next_follow_up_date} />
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {row.users_profile?.name || '—'}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {row.lampiran?.url && (
                      <a href={row.lampiran.url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        title="Unduh lampiran">
                        <Download size={14} />
                      </a>
                    )}
                    {row.no_telp_pic && (
                      <button
                        onClick={() => openWhatsApp(row.no_telp_pic, row)}
                        className="p-1.5 rounded-lg transition-colors hover:text-green-400"
                        style={{ color: 'var(--text-muted)' }}
                        title="WhatsApp">
                        <MessageCircle size={14} />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1.5 rounded-lg transition-colors hover:text-blue-400"
                        style={{ color: 'var(--text-muted)' }}
                        title="Edit">
                        <Edit2 size={14} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(row)}
                        className="p-1.5 rounded-lg transition-colors hover:text-red-400"
                        style={{ color: 'var(--text-muted)' }}
                        title="Hapus">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}