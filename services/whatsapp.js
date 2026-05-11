export function formatWANumber(phone) {
  if (!phone) return null
  let clean = phone.replace(/\D/g, '')
  if (clean.startsWith('0')) clean = '62' + clean.slice(1)
  else if (!clean.startsWith('62')) clean = '62' + clean
  return clean
}

export function buildWAMessage(perusahaan) {
  const nama = perusahaan.nama_perusahaan || '-'
  const npp = perusahaan.npp || '-'
  const pic = perusahaan.nama_pic || '-'

  return encodeURIComponent(
`Halo Bapak/Ibu ${pic},\n\n` +
`Saya dari BPJS Ketenagakerjaan ingin menyampaikan informasi terkait kepesertaan perusahaan *${nama}* (NPP: ${npp}).\n\n` +
`Kami ingin mengingatkan kembali agar Bapak/Ibu dapat berkunjung ke kantor kami untuk mendapatkan panduan penggunaan aplikasi SIPP.\n\n` +
`SIPP merupakan aplikasi berbasis Web BPJS Ketenagakerjaan yang digunakan perusahaan untuk mengelola kepesertaan tenaga kerja secara mandiri, seperti melakukan pembayaran iuran, menambah atau mengurangi tenaga kerja, serta pengelolaan data perusahaan tanpa harus datang langsung ke kantor.\n\n` +
`Dengan adanya panduan ini, diharapkan Bapak/Ibu dapat lebih mudah memahami penggunaan aplikasi tersebut.\n\n` +
`Mohon kesediaan waktunya sebentar agar dapat kami koordinasikan lebih lanjut.\n\n` +
`Terima kasih`
  )
}

export function openWhatsApp(phone, perusahaan) {
  const waNumber = formatWANumber(phone)
  if (!waNumber) {
    alert('Nomor telepon tidak tersedia atau tidak valid')
    return
  }
  const message = buildWAMessage(perusahaan)
  const url = `https://wa.me/${waNumber}?text=${message}`
  window.open(url, '_blank', 'noopener,noreferrer')
}
