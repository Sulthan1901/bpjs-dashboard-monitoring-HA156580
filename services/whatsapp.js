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
  `Kami ingin mengingatkan kembali untuk dapat berkunjung ke kantor kami guna melakukan panduan penggunaan SIPP.\n\n` +
  `Kehadiran Bapak/Ibu sangat kami harapkan agar proses penggunaan aplikasi dapat dipahami dengan lebih mudah dan jelas.\n\n` +
  `Mohon waktunya sebentar untuk kami koordinasikan.\n\n` +
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
