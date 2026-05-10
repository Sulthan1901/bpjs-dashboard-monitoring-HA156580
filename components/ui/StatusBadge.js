export const STATUS_KONTAK_OPTIONS = [
  'Sudah Dihubungi',
  'Belum Dihubungi',
  'Tidak Bisa Dihubungi',
]

export const STATUS_SIPP_OPTIONS = [
  'Aktif',
  'Non Aktif',
  'Suspend',
]

export function getStatusKontakStyle(status) {
  switch (status) {
    case 'Sudah Dihubungi': return 'badge-success'
    case 'Belum Dihubungi': return 'badge-warning'
    case 'Tidak Bisa Dihubungi': return 'badge-danger'
    default: return 'badge-gray'
  }
}

export function getStatusSIPPStyle(status) {
  switch (status) {
    case 'Aktif': return 'badge-brand'
    case 'Non Aktif': return 'badge-gray'
    case 'Suspend': return 'badge-danger'
    default: return 'badge-gray'
  }
}

export function StatusBadge({ status, type = 'kontak' }) {
  const className = type === 'sipp'
    ? getStatusSIPPStyle(status)
    : getStatusKontakStyle(status)

  return (
    <span className={`badge ${className}`}>
      {status || '—'}
    </span>
  )
}
