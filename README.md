# 🏢 BPJS Ketenagakerjaan — Dashboard Monitoring Binaan

Aplikasi web untuk monitoring perusahaan binaan BPJS Ketenagakerjaan, dibangun dengan **Next.js 14 (App Router)**, **Supabase**, dan **Tailwind CSS**. Siap deploy ke Vercel.

---

## ✨ Fitur Utama

| Fitur | Keterangan |
|---|---|
| 🔐 Autentikasi | Login email/password via Supabase Auth |
| 👑 Role System | Admin (full access) & ARK/User (data sendiri) |
| 📊 Dashboard | Statistik real-time, breakdown status, prioritas follow-up |
| 🏭 CRUD | Tambah, edit (inline + modal), hapus (soft delete) |
| 💬 WhatsApp | Tombol chat langsung ke PIC via wa.me |
| 📎 Upload Lampiran | Upload ke Supabase Storage, preview & download |
| 📅 Follow-up Reminder | Highlight otomatis data jatuh tempo |
| 📥 Export | Export ke Excel (.xlsx) dan CSV |
| 🔍 Search & Filter | Pencarian live + filter status |
| 📄 Pagination | Server-side pagination |
| 🌙 Dark Mode | UI modern dark theme |
| 📱 Responsive | Mobile-friendly sidebar |

---

## 🚀 Cara Install & Menjalankan

### 1. Clone Repository

```bash
git clone https://github.com/username/bpjs-dashboard.git
cd bpjs-dashboard
```

### 2. Install Dependensi

```bash
npm install
```

### 3. Setup Environment Variables

Salin file contoh dan isi dengan kredensial Supabase Anda:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> 💡 Temukan kredensial ini di: **Supabase Dashboard → Project Settings → API**

### 4. Setup Database Supabase

Buka **Supabase Dashboard → SQL Editor**, lalu jalankan isi file `supabase-setup.sql` secara berurutan.

File tersebut akan membuat:
- Tabel `users_profile`
- Tabel `perusahaan_binaan`
- Index untuk performa
- Row Level Security (RLS) policies
- Storage bucket `lampiran`
- Trigger auto-create profile saat user register

### 5. Buat User Admin

Setelah menjalankan SQL setup:

1. Buka **Supabase Dashboard → Authentication → Users**
2. Klik **Add User** → isi email & password
3. Salin UUID user yang baru dibuat
4. Jalankan SQL berikut untuk menjadikannya admin:

```sql
UPDATE public.users_profile
SET role = 'admin', name = 'Nama Admin'
WHERE id = 'uuid-user-anda-di-sini';
```

### 6. Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 🌐 Deployment ke Vercel

### Cara 1: Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Cara 2: Via Vercel Dashboard

1. Push kode ke GitHub/GitLab
2. Buka [vercel.com](https://vercel.com) → **New Project**
3. Import repository Anda
4. Tambahkan **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` → URL Supabase project Anda
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Anon key Supabase Anda
5. Klik **Deploy**

---

## 📁 Struktur Folder

```
bpjs-dashboard/
├── app/                          # Next.js App Router
│   ├── auth/
│   │   └── login/
│   │       └── page.js           # Halaman login
│   ├── dashboard/
│   │   ├── layout.js             # Layout dengan auth check
│   │   ├── page.js               # Dashboard server component
│   │   └── DashboardClient.js    # Dashboard client component
│   ├── perusahaan/
│   │   ├── layout.js             # Layout perusahaan
│   │   ├── page.js               # Perusahaan server component
│   │   └── PerusahaanClient.js   # CRUD interface client
│   ├── globals.css               # Global styles & CSS variables
│   ├── layout.js                 # Root layout
│   └── page.js                   # Redirect ke /dashboard
│
├── components/
│   ├── layout/
│   │   ├── DashboardShell.js     # Shell wrapper (sidebar + topbar)
│   │   ├── Sidebar.js            # Navigasi sidebar
│   │   └── Topbar.js             # Header atas
│   ├── dashboard/
│   │   ├── StatsCards.js         # Kartu statistik
│   │   ├── StatusBreakdown.js    # Bar chart distribusi status
│   │   └── PriorityList.js       # Daftar follow-up prioritas
│   ├── perusahaan/
│   │   ├── FormPerusahaan.js     # Modal form tambah/edit
│   │   └── PerusahaanTable.js    # Tabel dengan inline edit
│   └── ui/
│       ├── ConfirmDialog.js      # Dialog konfirmasi hapus
│       ├── Modal.js              # Base modal component
│       ├── Pagination.js         # Komponen pagination
│       └── StatusBadge.js        # Badge status kontak & SIPP
│
├── hooks/
│   ├── usePerusahaan.js          # Hook CRUD perusahaan
│   └── useProfile.js             # Hook user profile
│
├── lib/
│   ├── supabase.js               # Supabase browser client
│   └── supabase-server.js        # Supabase server client (SSR)
│
├── services/
│   ├── export.js                 # Export Excel & CSV
│   ├── perusahaan.js             # API calls ke Supabase
│   └── whatsapp.js               # WhatsApp handler
│
├── middleware.js                 # Auth middleware (route protection)
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── supabase-setup.sql            # SQL setup lengkap
└── .env.local.example            # Template environment variables
```

---

## 🔐 Role System

### Admin
- ✅ Melihat **semua** data perusahaan binaan
- ✅ CRUD semua data
- ✅ Menghapus data (soft delete)
- ✅ Assign data ke user (ARK) tertentu
- ✅ Melihat siapa yang mengelola tiap perusahaan

### User / ARK
- ✅ Melihat **hanya** data yang di-assign ke dia
- ✅ Edit data yang di-assign ke dia
- ✅ Upload lampiran
- ✅ Chat WhatsApp ke PIC
- ❌ Tidak bisa delete data
- ❌ Tidak bisa lihat data milik ARK lain

> Implementasi menggunakan **Supabase Row Level Security (RLS)** — keamanan berlapis di level database.

---

## 🛠 Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14 (App Router, JavaScript) |
| Styling | Tailwind CSS + Custom CSS Variables |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Export | SheetJS (xlsx) |
| Date | date-fns |
| Icons | Lucide React |
| Toast | React Hot Toast |
| Deploy | Vercel |

---

## 📋 Model Data

### `users_profile`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | FK ke auth.users |
| name | TEXT | Nama lengkap |
| role | TEXT | `admin` / `user` |
| created_at | TIMESTAMPTZ | - |
| updated_at | TIMESTAMPTZ | - |

### `perusahaan_binaan`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGSERIAL | Primary key |
| npp | VARCHAR | Nomor Pendaftaran Peserta (unique) |
| nama_perusahaan | TEXT | Nama perusahaan |
| alamat | TEXT | Alamat lengkap |
| nama_pic | TEXT | Nama PIC |
| no_telp_pic | VARCHAR | Nomor HP PIC |
| status_kontak | TEXT | Sudah/Belum/Tidak Bisa Dihubungi |
| status_sipp | TEXT | Aktif / Non Aktif / Suspend |
| keterangan | TEXT | Catatan |
| lampiran | JSONB | `{ url, path, name }` |
| next_follow_up_date | DATE | Jadwal follow-up berikutnya |
| assigned_to | UUID | FK ke auth.users |
| deleted_at | TIMESTAMPTZ | Soft delete timestamp |
| created_at | TIMESTAMPTZ | - |
| updated_at | TIMESTAMPTZ | - |

---

## 💡 Tips Penggunaan

1. **Inline Edit Status**: Klik badge status kontak di tabel untuk langsung mengubah tanpa buka modal
2. **WhatsApp**: Klik ikon chat hijau untuk langsung buka WhatsApp ke PIC dengan template pesan otomatis
3. **Follow-up Priority**: Baris dengan jadwal follow-up yang sudah lewat/hari ini akan di-highlight otomatis
4. **Export**: Filter data terlebih dahulu sebelum export untuk mendapat data yang relevan

---

## 🐛 Troubleshooting

**Login gagal dengan "Invalid API key"**
→ Pastikan `.env.local` sudah diisi dengan benar dan restart server dev

**Data tidak muncul setelah login**
→ Pastikan SQL setup sudah dijalankan dan user memiliki `assigned_to` yang benar di tabel perusahaan

**Upload lampiran gagal**
→ Pastikan bucket `lampiran` sudah dibuat di Supabase Storage dan policies sudah diset

**RLS error di console**
→ Jalankan ulang bagian RLS policies di `supabase-setup.sql`
