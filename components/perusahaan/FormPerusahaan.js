'use client'

import { useState, useEffect } from 'react'
import Modal from '/components/ui/Modal'
import { STATUS_KONTAK_OPTIONS, STATUS_SIPP_OPTIONS } from '/components/ui/StatusBadge'
import { perusahaanService } from '/services/perusahaan'
import { Upload, X, FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'

const INITIAL_FORM = {
  npp: '', nama_perusahaan: '', alamat: '', nama_pic: '',
  no_telp_pic: '', status_kontak: 'Belum Dihubungi',
  status_sipp: 'Aktif', keterangan: '', next_follow_up_date: '',
  assigned_to: '', lampiran: null
}

export default function FormPerusahaan({ isOpen, onClose, onSave, editData, isAdmin, currentUserId }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [users, setUsers] = useState([])
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (isAdmin) {
      perusahaanService.getUsers().then(setUsers).catch(() => {})
    }
  }, [isAdmin])

  useEffect(() => {
    if (editData) {
      setForm({
        npp: editData.npp || '',
        nama_perusahaan: editData.nama_perusahaan || '',
        alamat: editData.alamat || '',
        nama_pic: editData.nama_pic || '',
        no_telp_pic: editData.no_telp_pic || '',
        status_kontak: editData.status_kontak || 'Belum Dihubungi',
        status_sipp: editData.status_sipp || 'Aktif',
        keterangan: editData.keterangan || '',
        next_follow_up_date: editData.next_follow_up_date || '',
        assigned_to: editData.assigned_to || '',
        lampiran: editData.lampiran || null
      })
    } else {
      setForm({ ...INITIAL_FORM, assigned_to: isAdmin ? '' : currentUserId })
    }
    setFile(null)
  }, [editData, isOpen, currentUserId, isAdmin])

  const handleChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleFileChange = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File maksimal 10MB')
      return
    }
    setFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nama_perusahaan.trim()) {
      toast.error('Nama perusahaan wajib diisi')
      return
    }

    setLoading(true)
    try {
      let lampiranData = form.lampiran

      if (file) {
        setUploading(true)
        const tempId = editData?.id || 'temp-' + Date.now()
        const uploaded = await perusahaanService.uploadLampiran(file, tempId)
        lampiranData = uploaded
        setUploading(false)
      }

      const payload = {
        ...form,
        lampiran: lampiranData,
        assigned_to: form.assigned_to || (!isAdmin ? currentUserId : null),
        next_follow_up_date: form.next_follow_up_date || null,
      }

      await onSave(payload)
      onClose()
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const inputClass = "input-base"
  const labelClass = "block text-xs font-medium mb-1.5"

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Perusahaan' : 'Tambah Perusahaan Baru'}
      maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
              NPP <span style={{ color: 'var(--brand)' }}>*</span>
            </label>
            <input
              className={inputClass}
              value={form.npp}
              onChange={e => handleChange('npp', e.target.value)}
              placeholder="Nomor Pendaftaran Peserta"
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
              Nama Perusahaan <span style={{ color: 'var(--brand)' }}>*</span>
            </label>
            <input
              className={inputClass}
              value={form.nama_perusahaan}
              onChange={e => handleChange('nama_perusahaan', e.target.value)}
              placeholder="PT / CV / UD..."
              required
            />
          </div>
        </div>

        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Alamat</label>
          <textarea
            className={inputClass}
            value={form.alamat}
            onChange={e => handleChange('alamat', e.target.value)}
            placeholder="Alamat lengkap perusahaan"
            rows={2}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Nama PIC</label>
            <input
              className={inputClass}
              value={form.nama_pic}
              onChange={e => handleChange('nama_pic', e.target.value)}
              placeholder="Nama penanggung jawab"
            />
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>No. Telp PIC</label>
            <input
              className={inputClass}
              value={form.no_telp_pic}
              onChange={e => handleChange('no_telp_pic', e.target.value)}
              placeholder="08xxxxxxxxxx"
              type="tel"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Status Kontak</label>
            <select
              className={inputClass}
              value={form.status_kontak}
              onChange={e => handleChange('status_kontak', e.target.value)}>
              {STATUS_KONTAK_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Status SIPP</label>
            <select
              className={inputClass}
              value={form.status_sipp}
              onChange={e => handleChange('status_sipp', e.target.value)}>
              {STATUS_SIPP_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>
              Follow Up Berikutnya
            </label>
            <input
              className={inputClass}
              type="date"
              value={form.next_follow_up_date}
              onChange={e => handleChange('next_follow_up_date', e.target.value)}
            />
          </div>
          {isAdmin && (
            <div>
              <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Ditugaskan Ke</label>
              <select
                className={inputClass}
                value={form.assigned_to}
                onChange={e => handleChange('assigned_to', e.target.value)}>
                <option value="">— Pilih ARK —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Keterangan</label>
          <textarea
            className={inputClass}
            value={form.keterangan}
            onChange={e => handleChange('keterangan', e.target.value)}
            placeholder="Catatan hasil kontak, informasi tambahan..."
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* File upload */}
        <div>
          <label className={labelClass} style={{ color: 'var(--text-secondary)' }}>Lampiran</label>

          {form.lampiran && !file && (
            <div className="flex items-center gap-3 p-3 rounded-lg mb-2"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <FileText size={16} style={{ color: 'var(--brand)' }} />
              <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                {form.lampiran.name || 'Lampiran tersedia'}
              </span>
              <a href={form.lampiran.url} target="_blank" rel="noopener noreferrer"
                className="btn btn-ghost py-1 px-2 text-xs">
                <Download size={12} /> Lihat
              </a>
              <button type="button"
                onClick={() => handleChange('lampiran', null)}
                className="p-1 rounded hover:bg-red-500/10" style={{ color: '#f87171' }}>
                <X size={14} />
              </button>
            </div>
          )}

          <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
            style={{
              border: '2px dashed var(--border)',
              background: 'transparent'
            }}
            onDragOver={e => e.preventDefault()}>
            <Upload size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {file ? file.name : 'Klik atau drag file (maks. 10MB)'}
            </span>
            <input type="file" className="hidden" onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" />
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary">
            {loading
              ? (uploading ? 'Mengupload...' : 'Menyimpan...')
              : (editData ? 'Simpan Perubahan' : 'Tambah Perusahaan')
            }
          </button>
        </div>
      </form>
    </Modal>
  )
}
