// services/emailNotification.js
// Email notification via Resend API (atau Nodemailer sebagai fallback)

const FIELD_LABELS = {
  nama_perusahaan: 'Nama Perusahaan',
  npp: 'NPP',
  alamat: 'Alamat',
  nama_pic: 'Nama PIC',
  no_telp_pic: 'No. Telp PIC',
  status_kontak: 'Status Kontak',
  status_sipp: 'Status SIPP',
  keterangan: 'Keterangan',
  next_follow_up_date: 'Follow Up Berikutnya',
  assigned_to: 'Ditugaskan Ke',
  lampiran: 'Lampiran',
}

const ACTION_META = {
  CREATE: { label: 'Tambah Data Baru', color: '#10b981', icon: '✅' },
  UPDATE: { label: 'Edit Data', color: '#0ea5e9', icon: '✏️' },
  DELETE: { label: 'Hapus Data', color: '#ef4444', icon: '🗑️' },
  UPLOAD_LAMPIRAN: { label: 'Upload Lampiran', color: '#8b5cf6', icon: '📎' },
  INLINE_EDIT: { label: 'Edit Inline', color: '#f59e0b', icon: '⚡' },
}

/**
 * Build modern HTML email template
 */
function buildEmailHTML({
  actionType,
  actorName,
  perusahaanNama,
  perusahaanId,
  changedFields = [],
  oldData = null,
  newData = null,
  timestamp,
  appUrl,
}) {
  const meta = ACTION_META[actionType] || ACTION_META.UPDATE
  const dateStr = new Date(timestamp).toLocaleString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })

  const changesHTML = changedFields.length > 0
    ? changedFields.map(field => {
        const label = FIELD_LABELS[field] || field
        const oldVal = oldData?.[field] ?? '—'
        const newVal = newData?.[field] ?? '—'
        const formatVal = (v) => {
          if (v === null || v === undefined || v === '') return '<em style="color:#64748b">kosong</em>'
          if (typeof v === 'object') return JSON.stringify(v)
          return String(v)
        }
        return `
          <tr>
            <td style="padding:10px 16px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:12px;width:160px;vertical-align:top;">${label}</td>
            <td style="padding:10px 16px;border-bottom:1px solid #1e293b;font-size:12px;vertical-align:top;">
              ${actionType === 'CREATE'
                ? `<span style="color:#f1f5f9">${formatVal(newVal)}</span>`
                : `
                  <span style="color:#f87171;text-decoration:line-through">${formatVal(oldVal)}</span>
                  <span style="color:#64748b;margin:0 6px">→</span>
                  <span style="color:#34d399">${formatVal(newVal)}</span>
                `
              }
            </td>
          </tr>`
      }).join('')
    : `<tr><td colspan="2" style="padding:12px 16px;color:#64748b;font-size:12px;font-style:italic;">Tidak ada field yang berubah terdeteksi</td></tr>`

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notifikasi BPJS Dashboard</title>
</head>
<body style="margin:0;padding:0;background-color:#070d1a;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#0ea5e9,#8b5cf6);padding:10px 20px;border-radius:12px;">
        <span style="color:white;font-size:14px;font-weight:700;letter-spacing:0.5px;">BPJS TK · Dashboard Monitoring</span>
      </div>
    </div>

    <!-- Main card -->
    <div style="background:#111827;border:1px solid rgba(148,163,184,0.1);border-radius:16px;overflow:hidden;">

      <!-- Action banner -->
      <div style="background:${meta.color}18;border-bottom:1px solid ${meta.color}33;padding:20px 24px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:28px;">${meta.icon}</span>
          <div>
            <p style="margin:0;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Notifikasi Aktivitas</p>
            <p style="margin:4px 0 0;color:#f1f5f9;font-size:18px;font-weight:700;">${meta.label}</p>
          </div>
        </div>
      </div>

      <!-- Info grid -->
      <div style="padding:24px;border-bottom:1px solid rgba(148,163,184,0.08);">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:12px;width:130px;">Dilakukan oleh</td>
            <td style="padding:6px 0;color:#f1f5f9;font-size:13px;font-weight:600;">${actorName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:12px;">Perusahaan</td>
            <td style="padding:6px 0;color:#38bdf8;font-size:13px;font-weight:600;">${perusahaanNama}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#64748b;font-size:12px;">Waktu</td>
            <td style="padding:6px 0;color:#f1f5f9;font-size:12px;">${dateStr} WIB</td>
          </tr>
        </table>
      </div>

      <!-- Changes table -->
      <div style="padding:0 0 8px;">
        <p style="margin:16px 24px 8px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Detail Perubahan</p>
        <table style="width:100%;border-collapse:collapse;">
          ${changesHTML}
        </table>
      </div>

      <!-- CTA Button -->
      ${appUrl && perusahaanId ? `
      <div style="padding:20px 24px;border-top:1px solid rgba(148,163,184,0.08);text-align:center;">
        <a href="${appUrl}/perusahaan"
           style="display:inline-block;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;text-decoration:none;
                  padding:12px 28px;border-radius:8px;font-size:13px;font-weight:600;letter-spacing:0.3px;">
          Lihat di Dashboard →
        </a>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#1e293b;font-size:11px;margin:0;">Email ini dikirim otomatis oleh sistem BPJS TK Dashboard.</p>
      <p style="color:#1e293b;font-size:11px;margin:4px 0 0;">Jangan balas email ini.</p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Send email via Resend API
 */
async function sendViaResend({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'BPJS Dashboard <jekibpjs123@gmail.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }
  return await res.json()
}

/**
 * Main function: build and send notification email.
 * Called from API route handler (server-side only).
 */
export async function sendNotificationEmail({
  supervisorEmail,
  supervisorName,
  actionType,
  actorName,
  perusahaanNama,
  perusahaanId,
  changedFields = [],
  oldData = null,
  newData = null,
}) {
  if (!supervisorEmail) return { skipped: true, reason: 'No supervisor email' }
  if (!process.env.RESEND_API_KEY) return { skipped: true, reason: 'No RESEND_API_KEY' }

  const meta = ACTION_META[actionType] || ACTION_META.UPDATE
  const timestamp = new Date().toISOString()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'

  const html = buildEmailHTML({
    actionType,
    actorName,
    perusahaanNama,
    perusahaanId,
    changedFields,
    oldData,
    newData,
    timestamp,
    appUrl,
  })

  const subject = `${meta.icon} [BPJS TK] ${meta.label} — ${perusahaanNama}`

  return await sendViaResend({ to: supervisorEmail, subject, html })
}
