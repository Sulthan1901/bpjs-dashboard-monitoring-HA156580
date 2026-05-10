'use client'
import { useState, useEffect } from 'react'
import { usePerusahaan } from '/hooks/usePerusahaan'
import { useProfile } from '/hooks/useProfile'
import PerusahaanTable from '/components/perusahaan/PerusahaanTable'
import FormPerusahaan from '/components/perusahaan/FormPerusahaan'
import ConfirmDialog from '/components/ui/ConfirmDialog'
import Pagination from '/components/ui/Pagination'
import RealtimeIndicator from '/components/ui/RealtimeIndicator'
import { usePerusahaanRealtime } from '/hooks/useRealtime'
import { exportToExcel, exportToCSV } from '/services/export'
import { getAllForExport } from '/services/perusahaan'
import toast from 'react-hot-toast'
import {
  Plus, Search, Filter, Download, RefreshCw,
  FileSpreadsheet, FileText, ChevronDown, X
} from 'lucide-react'

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'Sudah Dihubungi', label: 'Sudah Dihubungi' },
  { value: 'Belum Dihubungi', label: 'Belum Dihubungi' },
  { value: 'Tidak Bisa Dihubungi', label: 'Tidak Bisa Dihubungi' },
]

export default function PerusahaanClient({ user, profile }) {
  const { actorInfo } = useProfile()
  const isAdmin = profile?.role === 'admin'
  const isSupervisor = profile?.role === 'supervisor'
  const supervisorId = isSupervisor ? user.id : (profile?.supervisor_id || null)

  const {
    data, count, loading, page, search, statusFilter, limit,
    fetch, create, update, remove,
    handleSearch, handleStatusFilter, handlePageChange,
  } = usePerusahaan({ userId: user.id, isAdmin, isSupervisor, supervisorId })

  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [realtimeFlash, setRealtimeFlash] = useState(false)

  useEffect(() => { fetch() }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => handleSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  // Realtime: refresh table on any change
  usePerusahaanRealtime({
    supervisorId: isSupervisor ? user.id : null,
    assignedTo: isAdmin ? user.id : null,
    onChange: () => {
      setRealtimeFlash(true)
      setTimeout(() => setRealtimeFlash(false), 3000)
      fetch()
    },
  })

  const handleEdit = (row) => { setEditData(row); setShowForm(true) }
  const handleCloseForm = () => { setShowForm(false); setEditData(null) }

  const handleSave = async (payload) => {
    const actor = actorInfo || {
      userId: user.id,
      userName: profile?.name || user.email,
      supervisorId,
    }
    if (editData) {
      await update(editData.id, payload, actor)
    } else {
      await create({ ...payload, supervisor_id: supervisorId }, actor)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const actor = actorInfo || { userId: user.id, userName: profile?.name, supervisorId }
      await remove(deleteTarget.id, actor)
      setDeleteTarget(null)
    } catch (err) {
      toast.error('Gagal menghapus: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = async (format) => {
    setExporting(true)
    setShowExportMenu(false)
    try {
      toast.loading('Mengambil semua data...', { id: 'export-toast' })
      const allData = await getAllForExport({
        search, status: statusFilter,
        userId: user.id, isAdmin, isSupervisor, supervisorId
      })
      toast.dismiss('export-toast')
      if (format === 'excel') {
        exportToExcel(allData)
        toast.success(`Export Excel berhasil! (${allData.length} data)`)
      } else {
        exportToCSV(allData)
        toast.success(`Export CSV berhasil! (${allData.length} data)`)
      }
    } catch (err) {
      toast.dismiss('export-toast')
      toast.error('Export gagal: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="input-base pl-9 pr-8" placeholder="Cari perusahaan, NPP, PIC..."
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          {searchInput && (
            <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}><X size={13} /></button>
          )}
        </div>

        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <select className="input-base pl-8 pr-8 py-2 text-sm appearance-none w-48"
            value={statusFilter} onChange={e => handleStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <RealtimeIndicator active={realtimeFlash} />
          <button onClick={() => fetch()} disabled={loading} className="btn btn-ghost p-2.5" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={exporting}
              className="btn btn-ghost gap-1.5">
              <Download size={14} /><span className="hidden sm:inline">Export</span><ChevronDown size={12} />
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-xl overflow-hidden w-44"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <button onClick={() => handleExport('excel')}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left transition-colors hover:bg-white/5">
                    <FileSpreadsheet size={14} style={{ color: '#10b981' }} />
                    <span style={{ color: 'var(--text-primary)' }}>Export Excel</span>
                  </button>
                  <button onClick={() => handleExport('csv')}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-left transition-colors hover:bg-white/5">
                    <FileText size={14} style={{ color: '#0ea5e9' }} />
                    <span style={{ color: 'var(--text-primary)' }}>Export CSV</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button onClick={() => { setEditData(null); setShowForm(true) }} className="btn btn-primary gap-1.5">
            <Plus size={15} /><span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Active filters */}
      {(search || statusFilter) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Filter aktif:</span>
          {search && <span className="badge badge-brand cursor-pointer" onClick={() => setSearchInput('')}>"{search}" <X size={10} className="ml-1" /></span>}
          {statusFilter && <span className="badge badge-warning cursor-pointer" onClick={() => handleStatusFilter('')}>{statusFilter} <X size={10} className="ml-1" /></span>}
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Memuat...' : `${count} perusahaan ditemukan`}
          </span>
          <div className="flex items-center gap-2">
            {isSupervisor && <span className="badge text-[10px]" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>Supervisor View</span>}
            {isAdmin && <span className="badge badge-warning text-[10px]">Mode Admin</span>}
          </div>
        </div>

        <PerusahaanTable
          data={data} loading={loading}
          isAdmin={isAdmin || isSupervisor}
          isSupervisor={isSupervisor}
          currentUserId={user.id}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onUpdate={(id, payload) => {
            const actor = actorInfo || { userId: user.id, userName: profile?.name, supervisorId }
            update(id, payload, actor)
          }}
        />

        <div className="px-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <Pagination page={page} total={count} limit={limit} onPageChange={handlePageChange} />
        </div>
      </div>

      <FormPerusahaan
        isOpen={showForm} onClose={handleCloseForm} onSave={handleSave}
        editData={editData} isAdmin={isAdmin || isSupervisor}
        currentUserId={user.id} supervisorId={supervisorId}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Hapus Perusahaan?"
        message={`Data "${deleteTarget?.nama_perusahaan}" akan dihapus. Tindakan ini tidak bisa dibatalkan.`}
      />
    </div>
  )
}