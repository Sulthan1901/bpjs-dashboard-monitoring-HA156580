# 📘 README — Fitur Baru V2 (Improvement)

Dokumen ini khusus menjelaskan fitur-fitur baru yang ditambahkan pada **V2 Improvement**.
Baca bersama `README.md` utama.

---

## 🆕 Fitur Baru di V2

| # | Fitur | Status |
|---|---|---|
| 1 | Role Supervisor | ✅ |
| 2 | Multi Supervisor Group System | ✅ |
| 3 | Database Refactor (migration aman) | ✅ |
| 4 | Email Notification (Resend) | ✅ |
| 5 | Activity Log System | ✅ |
| 6 | Realtime Dashboard (Supabase Realtime) | ✅ |
| 7 | RLS Policy Refactor | ✅ |
| 8 | Dashboard Analytics (per admin, per group) | ✅ |
| 9 | UI/UX Improvement | ✅ |

---

## 🔐 Role System V2

| Role | Kemampuan |
|---|---|
| **Supervisor** | Lihat semua data group-nya · Kelola admin bawahan · Activity log group · Analytics per admin |
| **Admin** | CRUD data assigned ke dia · Lihat aktivitas sendiri |
| **User/ARK** | Lihat & edit data assigned ke dia saja |

### Hierarki Group
```
Supervisor A
├── Admin 1  →  Perusahaan X, Y, Z
└── Admin 2  →  Perusahaan A, B, C

Supervisor B
├── Admin 3  →  Perusahaan P, Q
└── Admin 4  →  Perusahaan R
```
Data antar supervisor **terisolasi sepenuhnya** via RLS.

---

## 🚀 Step-by-Step Migration dari V1 ke V2

### 1. Jalankan Migration SQL

Di **Supabase → SQL Editor**, jalankan isi file `migration-v2.sql`.

> ✅ Aman untuk data existing — tidak ada data yang hilang.

### 2. Buat User Supervisor

```sql
-- 1. Buat user di Supabase Auth (Dashboard → Auth → Users)
-- 2. Update profile:
UPDATE public.users_profile
SET role = 'supervisor', name = 'Nama Supervisor'
WHERE id = 'UUID_SUPERVISOR';
```

### 3. Assign Admin ke Supervisor

```sql
-- Assign semua admin existing ke supervisor pertama:
UPDATE public.users_profile
SET supervisor_id = 'UUID_SUPERVISOR'
WHERE role = 'admin';
```

### 4. Populate supervisor_id di perusahaan_binaan

```sql
-- Cara otomatis (dari relasi admin → supervisor):
SELECT populate_supervisor_id_from_admin();

-- Atau manual (jika semua data milik 1 supervisor):
UPDATE public.perusahaan_binaan
SET supervisor_id = 'UUID_SUPERVISOR'
WHERE supervisor_id IS NULL AND deleted_at IS NULL;
```

### 5. Setup Email Notification (opsional)

Daftar di [resend.com](https://resend.com) → dapatkan API key.

Tambahkan ke Vercel Environment Variables:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=BPJS Dashboard <notif@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

> Jika `RESEND_API_KEY` tidak diset, sistem akan skip email notification secara otomatis (tidak error).

### 6. Deploy Updated Code ke Vercel

```bash
git add .
git commit -m "feat: v2 improvements - supervisor, activity log, realtime, email"
git push
```
Vercel akan auto-deploy.

---

## ⚡ Realtime Setup

Realtime sudah diaktifkan via migration SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.perusahaan_binaan;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
```

Di dashboard Supabase, pastikan **Realtime** aktif:
- Buka **Database → Replication**
- Pastikan `perusahaan_binaan` dan `activity_logs` ada di list

---

## 📧 Email Notification

Email dikirim otomatis ke supervisor setiap ada perubahan data oleh admin bawahannya.

**Trigger:**
- Tambah perusahaan baru
- Edit data (termasuk inline edit)
- Hapus data
- Upload lampiran

**Tampilan email:**
- Template HTML modern dark-themed
- Menampilkan: siapa yang berubah, field apa, before vs after value
- Tombol "Lihat di Dashboard"

---

## 📁 File Baru di V2

```
app/
  supervisor/
    layout.js           → Guard: hanya supervisor
    page.js             → Server component
    SupervisorClient.js → Supervisor dashboard
  activity/
    layout.js
    page.js             → Activity log viewer
  api/
    notify/route.js     → Email notification endpoint
    activity/route.js   → Activity log API

components/
  supervisor/
    AdminPerformanceCard.js → Performa per admin
  activity/
    ActivityTimeline.js     → Timeline UI
  ui/
    RealtimeIndicator.js    → Live dot indicator

hooks/
  useRealtime.js        → Supabase Realtime hooks

services/
  activityLog.js        → CRUD activity logs
  emailNotification.js  → Resend email builder
  supervisor.js         → Supervisor-specific queries

migration-v2.sql        → Safe migration script
README-V2.md            → Dokumen ini
```

---

## 🔧 Troubleshooting V2

**Supervisor tidak bisa lihat data**
→ Pastikan `supervisor_id` di `perusahaan_binaan` sudah terisi
→ Jalankan `SELECT populate_supervisor_id_from_admin();`

**Email tidak terkirim**
→ Cek `RESEND_API_KEY` di Vercel env
→ Pastikan domain sudah diverifikasi di Resend

**Realtime tidak update**
→ Buka Supabase → Database → Replication → pastikan table sudah ditambahkan
→ Cek browser console untuk WebSocket errors

**Activity log tidak muncul**
→ Pastikan `activity_logs` RLS policy sudah dijalankan dari `migration-v2.sql`
→ Cek Supabase → Authentication → Policies → table `activity_logs`
