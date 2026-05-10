'use client'
import { useState, useEffect } from 'react'
import { getActivityLogs } from '/services/activityLog'
import { useActivityRealtime } from '/hooks/useRealtime'
import ActivityTimeline from '/components/activity/ActivityTimeline'
import Pagination from '/components/ui/Pagination'
import RealtimeIndicator from '/components/ui/RealtimeIndicator'
import { useProfile } from '/hooks/useProfile'
import { ACTION_LABELS } from '/services/activityLog'
import { RefreshCw, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const ACTION_FILTER_OPTIONS = [
  { value: '', label: 'Semua Aksi' },
  { value: 'CREATE', label: 'Tambah Data' },
  { value: 'UPDATE', label: 'Edit Data' },
  { value: 'DELETE', label: 'Hapus Data' },
  { value: 'UPLOAD_LAMPIRAN', label: 'Upload Lampiran' },
  { value: 'INLINE_EDIT', label: 'Edit Inline' },
]

export default function ActivityPage() {
  const { user, profile, isSupervisor, isAdmin } = useProfile()
  const [logs, setLogs] = useState([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [realtimeActive, setRealtimeActive] = useState(false)
  const limit = 30

  const fetchLogs = async (p = page, af = actionFilter) => {
    if (!user) return
    setLoading(true)
    try {
      const supervisorId = isSupervisor ? user.id : null
      const userId = isAdmin ? user.id : null
      const result = await getActivityLogs({ supervisorId, userId, page: p, limit, actionType: af })
      setLogs(result.data)
      setCount(result.count)
    } catch (err) {
      toast.error('Gagal memuat: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchLogs()
  }, [user, isSupervisor, isAdmin])

  // Realtime: supervisor sees live updates
  useActivityRealtime({
    supervisorId: isSupervisor ? user?.id : null,
    onNewActivity: (newLog) => {
      setLogs(prev => [newLog, ...prev].slice(0, limit))
      setCount(c => c + 1)
      setRealtimeActive(true)
      setTimeout(() => setRealtimeActive(false), 3000)
    },
  })

  const handlePageChange = (p) => {
    setPage(p)
    fetchLogs(p)
  }

  const handleActionFilter = (val) => {
    setActionFilter(val)
    setPage(1)
    fetchLogs(1, val)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">Activity Log</h2>
          <RealtimeIndicator active={realtimeActive} />
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {/* Action filter */}
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }} />
            <select className="input-base pl-8 py-2 text-sm appearance-none w-44"
              value={actionFilter}
              onChange={e => handleActionFilter(e.target.value)}>
              {ACTION_FILTER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button onClick={() => fetchLogs()} disabled={loading}
            className="btn btn-ghost p-2.5" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Log card */}
      <div className="card">
        <div className="flex items-center justify-between px-1 mb-4">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Memuat...' : `${count} aktivitas tercatat`}
          </span>
          {isSupervisor && (
            <span className="badge badge-warning text-[10px]">Seluruh group</span>
          )}
        </div>

        <div className="min-h-64">
          <ActivityTimeline logs={logs} loading={loading} />
        </div>

        <div className="border-t mt-4 pt-2" style={{ borderColor: 'var(--border)' }}>
          <Pagination page={page} total={count} limit={limit} onPageChange={handlePageChange} />
        </div>
      </div>
    </div>
  )
}
