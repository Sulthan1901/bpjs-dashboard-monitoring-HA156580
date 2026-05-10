-- ============================================================
-- BPJS Dashboard - Supabase SQL Setup
-- Jalankan di Supabase SQL Editor secara berurutan
-- ============================================================

-- 1. Buat tabel users_profile
CREATE TABLE IF NOT EXISTS public.users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buat tabel perusahaan_binaan
CREATE TABLE IF NOT EXISTS public.perusahaan_binaan (
  id BIGSERIAL PRIMARY KEY,
  npp VARCHAR(50) UNIQUE,
  nama_perusahaan TEXT NOT NULL,
  alamat TEXT,
  nama_pic TEXT,
  no_telp_pic VARCHAR(30),
  status_kontak TEXT DEFAULT 'Belum Dihubungi'
    CHECK (status_kontak IN ('Sudah Dihubungi', 'Belum Dihubungi', 'Tidak Bisa Dihubungi')),
  status_sipp TEXT DEFAULT 'Aktif'
    CHECK (status_sipp IN ('Aktif', 'Non Aktif', 'Suspend')),
  keterangan TEXT,
  lampiran JSONB,                    -- { url, path, name }
  next_follow_up_date DATE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,            -- soft delete
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_perusahaan_assigned_to ON public.perusahaan_binaan(assigned_to);
CREATE INDEX IF NOT EXISTS idx_perusahaan_status_kontak ON public.perusahaan_binaan(status_kontak);
CREATE INDEX IF NOT EXISTS idx_perusahaan_deleted_at ON public.perusahaan_binaan(deleted_at);
CREATE INDEX IF NOT EXISTS idx_perusahaan_follow_up ON public.perusahaan_binaan(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_perusahaan_created_at ON public.perusahaan_binaan(created_at DESC);

-- 4. Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_perusahaan_updated_at
  BEFORE UPDATE ON public.perusahaan_binaan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_users_profile_updated_at
  BEFORE UPDATE ON public.users_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Trigger auto-create users_profile saat user baru register
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perusahaan_binaan ENABLE ROW LEVEL SECURITY;

-- Helper function: cek apakah user adalah admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- POLICIES: users_profile
-- ============================================================

-- User bisa lihat profilnya sendiri
CREATE POLICY "users_profile: self read"
  ON public.users_profile FOR SELECT
  USING (id = auth.uid());

-- Admin bisa lihat semua profil
CREATE POLICY "users_profile: admin read all"
  ON public.users_profile FOR SELECT
  USING (is_admin());

-- User bisa update profilnya sendiri
CREATE POLICY "users_profile: self update"
  ON public.users_profile FOR UPDATE
  USING (id = auth.uid());

-- Admin bisa update semua profil
CREATE POLICY "users_profile: admin update all"
  ON public.users_profile FOR UPDATE
  USING (is_admin());

-- Admin bisa insert profil baru
CREATE POLICY "users_profile: admin insert"
  ON public.users_profile FOR INSERT
  WITH CHECK (is_admin());

-- ============================================================
-- POLICIES: perusahaan_binaan
-- ============================================================

-- Admin bisa SELECT semua data (termasuk yang belum di-assign)
CREATE POLICY "perusahaan: admin read all"
  ON public.perusahaan_binaan FOR SELECT
  USING (is_admin());

-- User (ARK) hanya bisa SELECT data yang di-assign ke dia
CREATE POLICY "perusahaan: user read own"
  ON public.perusahaan_binaan FOR SELECT
  USING (
    NOT is_admin() AND assigned_to = auth.uid()
  );

-- Admin bisa INSERT
CREATE POLICY "perusahaan: admin insert"
  ON public.perusahaan_binaan FOR INSERT
  WITH CHECK (is_admin());

-- User bisa INSERT (assigned_to harus dirinya sendiri)
CREATE POLICY "perusahaan: user insert own"
  ON public.perusahaan_binaan FOR INSERT
  WITH CHECK (
    NOT is_admin() AND assigned_to = auth.uid()
  );

-- Admin bisa UPDATE semua
CREATE POLICY "perusahaan: admin update all"
  ON public.perusahaan_binaan FOR UPDATE
  USING (is_admin());

-- User hanya bisa UPDATE data miliknya
CREATE POLICY "perusahaan: user update own"
  ON public.perusahaan_binaan FOR UPDATE
  USING (
    NOT is_admin() AND assigned_to = auth.uid()
  );

-- Hanya admin bisa DELETE (soft delete via UPDATE deleted_at juga apply di UPDATE policy)
CREATE POLICY "perusahaan: admin delete"
  ON public.perusahaan_binaan FOR DELETE
  USING (is_admin());

-- ============================================================
-- SUPABASE STORAGE
-- ============================================================

-- Buat bucket 'lampiran'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lampiran',
  'lampiran',
  true,
  10485760,  -- 10 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated user bisa upload
CREATE POLICY "storage: authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lampiran');

-- Semua bisa baca (public bucket)
CREATE POLICY "storage: public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'lampiran');

-- User bisa hapus file miliknya, admin bisa hapus semua
CREATE POLICY "storage: authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'lampiran');

-- ============================================================
-- SEED DATA (opsional - untuk testing)
-- ============================================================

-- Cara insert admin user:
-- 1. Register user lewat Supabase Auth (email/password)
-- 2. Jalankan SQL ini dengan UUID user yang baru dibuat:
--
-- UPDATE public.users_profile
-- SET role = 'admin', name = 'Administrator'
-- WHERE id = 'uuid-user-anda-di-sini';

-- Contoh seed data perusahaan (ganti assigned_to dengan UUID user yang ada):
-- INSERT INTO public.perusahaan_binaan (npp, nama_perusahaan, alamat, nama_pic, no_telp_pic, status_kontak, status_sipp, assigned_to)
-- VALUES
--   ('1234567890', 'PT Maju Bersama', 'Jl. Sudirman No. 1, Jakarta', 'Budi Santoso', '081234567890', 'Belum Dihubungi', 'Aktif', 'uuid-user-here'),
--   ('0987654321', 'CV Sejahtera Abadi', 'Jl. Gatot Subroto No. 5, Bandung', 'Siti Rahayu', '089876543210', 'Sudah Dihubungi', 'Aktif', 'uuid-user-here');
