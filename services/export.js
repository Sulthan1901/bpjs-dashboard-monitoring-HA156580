import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function exportToExcel(data, filename = 'perusahaan_binaan') {
  const rows = data.map((row, idx) => ({
    'No': idx + 1,
    'NPP': row.npp || '',
    'Nama Perusahaan': row.nama_perusahaan || '',
    'Alamat': row.alamat || '',
    'Nama PIC': row.nama_pic || '',
    'No. Telp PIC': row.no_telp_pic || '',
    'Status Kontak': row.status_kontak || '',
    'Status SIPP': row.status_sipp || '',
    'Keterangan': row.keterangan || '',
    'Follow Up Berikutnya': row.next_follow_up_date
      ? format(new Date(row.next_follow_up_date), 'dd MMM yyyy', { locale: id })
      : '',
    'Ditugaskan Ke': row.users_profile?.name || '',
    'Dibuat': row.created_at
      ? format(new Date(row.created_at), 'dd MMM yyyy HH:mm', { locale: id })
      : '',
    'Diupdate': row.updated_at
      ? format(new Date(row.updated_at), 'dd MMM yyyy HH:mm', { locale: id })
      : '',
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Style header row
  const colWidths = [
    { wch: 5 }, { wch: 15 }, { wch: 35 }, { wch: 40 }, { wch: 20 },
    { wch: 18 }, { wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 20 },
    { wch: 20 }, { wch: 20 }, { wch: 20 }
  ]
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, 'Perusahaan Binaan')

  const dateStr = format(new Date(), 'yyyyMMdd_HHmm')
  XLSX.writeFile(wb, `${filename}_${dateStr}.xlsx`)
}

export function exportToCSV(data, filename = 'perusahaan_binaan') {
  const headers = ['No', 'NPP', 'Nama Perusahaan', 'Alamat', 'Nama PIC', 'No. Telp PIC',
    'Status Kontak', 'Status SIPP', 'Keterangan', 'Follow Up Berikutnya', 'Ditugaskan Ke']

  const rows = data.map((row, idx) => [
    idx + 1,
    row.npp || '',
    row.nama_perusahaan || '',
    row.alamat || '',
    row.nama_pic || '',
    row.no_telp_pic || '',
    row.status_kontak || '',
    row.status_sipp || '',
    row.keterangan || '',
    row.next_follow_up_date
      ? format(new Date(row.next_follow_up_date), 'dd MMM yyyy', { locale: id })
      : '',
    row.users_profile?.name || '',
  ])

  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = format(new Date(), 'yyyyMMdd_HHmm')
  a.href = url
  a.download = `${filename}_${dateStr}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
