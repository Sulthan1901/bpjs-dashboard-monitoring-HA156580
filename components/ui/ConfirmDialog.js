'use client'

import Modal from './Modal'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-sm">
      <div className="text-center py-2">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--danger-dim)' }}>
          <AlertTriangle size={24} style={{ color: '#f87171' }} />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="btn btn-ghost px-5">
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn px-5"
            style={{
              background: '#ef4444',
              color: 'white',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}>
            {loading ? 'Menghapus...' : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
