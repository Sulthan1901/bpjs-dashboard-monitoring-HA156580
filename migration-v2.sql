-- ============================================================
-- MIGRATION V2 — BPJS Dashboard Improvements
-- Aman untuk data existing (backward compatible)
-- Jalankan di Supabase SQL Editor secara berurutan
-- ============================================================

-- ============================================================
-- STEP 1: Tambah kolom supervisor_id ke users_profile
-- ============================================================
ALTER TABLE public.users_profile
  ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Update constraint role untuk include 'supervisor'
ALTER TABLE public.users_profile
  DROP CONSTRAINT IF EXISTS users_profile_role_check;

ALTER TABLE public.users_profile
  ADD CONSTRAINT users_profile_role_check
  CHECK (role IN ('admin', 'user', 'supervisor'));

-- ============================================================
-- STEP 2: Tambah kolom assigned_admin_id ke perusahaan_binaan
-- (alias untuk assigned_to agar lebih eksplisit)
-- assigned_to tetap dipertahankan untuk backward compatibility
-- ============================================================
ALTER TABLE public.perusahaan_binaan
  ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index baru
CREATE INDEX IF NOT EXISTS idx_perusahaan_supervisor_id
  ON public.perusahaan_binaan(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_supervisor_id
  ON public.users_profile(supervisor_id);

-- ============================================================
-- STEP 3: Buat tabel activity_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name   TEXT,
  supervisor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  perusahaan_id BIGINT REFERENCES public.perusahaan_binaan(id) ON DELETE SET NULL,
  perusahaan_nama TEXT,
  action_type TEXT NOT NULL,
  -- action_type values:
  -- 'CREATE', 'UPDATE', 'DELETE', 'UPLOAD_LAMPIRAN', 'INLINE_EDIT'
  old_data    JSONB,
  new_data    JSONB,
  changed_fields TEXT[],  -- array kolom yang berubah
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
  ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_supervisor_id
  ON public.activity_logs(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_perusahaan_id
  ON public.activity_logs(perusahaan_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type
  ON public.activity_logs(action_type);

-- ============================================================
-- STEP 4: Populate supervisor_id di perusahaan_binaan
-- Data existing diasumsikan milik supervisor pertama/default
-- Cara: ambil user dengan role supervisor, assign ke semua data existing
-- ============================================================

-- Fungsi helper: populate supervisor_id dari assigned_to admin
CREATE OR REPLACE FUNCTION populate_supervisor_id_from_admin()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update perusahaan_binaan.supervisor_id berdasarkan supervisor dari admin yang assigned
  UPDATE public.perusahaan_binaan pb
  SET supervisor_id = up.supervisor_id
  FROM public.users_profile up
  WHERE pb.assigned_to = up.id
    AND up.supervisor_id IS NOT NULL
    AND pb.supervisor_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 5: Populate email di users_profile dari auth.users
-- ============================================================
UPDATE public.users_profile up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id
  AND up.email IS NULL;

-- ============================================================
-- STEP 6: Update trigger handle_new_user untuk include email
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profile (id, name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 7: Helper functions untuk RLS
-- ============================================================

-- Cek apakah user adalah supervisor
CREATE OR REPLACE FUNCTION is_supervisor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE id = auth.uid() AND role = 'supervisor'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Cek apakah user adalah admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Cek apakah user adalah supervisor ATAU admin
CREATE OR REPLACE FUNCTION is_supervisor_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_profile
    WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Ambil supervisor_id dari current user (jika user adalah admin)
CREATE OR REPLACE FUNCTION get_my_supervisor_id()
RETURNS UUID AS $$
  SELECT supervisor_id FROM public.users_profile WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Ambil semua admin_id dalam group supervisor current user
CREATE OR REPLACE FUNCTION get_my_admin_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT id FROM public.users_profile
    WHERE supervisor_id = auth.uid()
      AND role IN ('admin', 'user')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- STEP 8: Drop semua RLS policies lama
-- ============================================================

-- users_profile
DROP POLICY IF EXISTS "users_profile: self read" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile: admin read all" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile: self update" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile: admin update all" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile: admin insert" ON public.users_profile;

-- perusahaan_binaan
DROP POLICY IF EXISTS "perusahaan: admin read all" ON public.perusahaan_binaan;
DROP POLICY IF EXISTS "perusahaan: user read own" ON public.perusahaan_binaan;
DROP POLICY IF EXISTS "perusahaan: admin insert" ON public.perusahaan_binaan;
DROP POLICY IF EXISTS "perusahaan: user insert own" ON public.perusahaan_binaan;
DROP POLICY IF EXISTS "perusahaan: admin update all" ON public.perusahaan_binaan;
DROP POLICY IF EXISTS "perusahaan: user update own" ON public.perusahaan_binaan;
DROP POLICY IF EXISTS "perusahaan: admin delete" ON public.perusahaan_binaan;

-- activity_logs (jika ada)
DROP POLICY IF EXISTS "activity: supervisor read own group" ON public.activity_logs;
DROP POLICY IF EXISTS "activity: admin read own" ON public.activity_logs;
DROP POLICY IF EXISTS "activity: insert authenticated" ON public.activity_logs;

-- ============================================================
-- STEP 9: RLS Policies Baru
-- ============================================================

-- ---- users_profile ----

-- Semua user bisa baca profil sendiri
CREATE POLICY "up: self read"
  ON public.users_profile FOR SELECT
  USING (id = auth.uid());

-- Supervisor bisa baca semua profil dalam group-nya
CREATE POLICY "up: supervisor read group"
  ON public.users_profile FOR SELECT
  USING (
    is_supervisor() AND (
      supervisor_id = auth.uid()  -- baca admin bawahannya
      OR id = auth.uid()          -- baca profil sendiri
    )
  );

-- Admin bisa baca semua profil (untuk dropdown assign)
CREATE POLICY "up: admin read all"
  ON public.users_profile FOR SELECT
  USING (is_admin() OR is_supervisor());

-- Self update
CREATE POLICY "up: self update"
  ON public.users_profile FOR UPDATE
  USING (id = auth.uid());

-- Supervisor update admin dalam group-nya
CREATE POLICY "up: supervisor update group"
  ON public.users_profile FOR UPDATE
  USING (
    is_supervisor() AND supervisor_id = auth.uid()
  );

-- Supervisor insert admin baru (untuk manage bawahan)
CREATE POLICY "up: supervisor insert"
  ON public.users_profile FOR INSERT
  WITH CHECK (is_supervisor());

-- ---- perusahaan_binaan ----

-- Supervisor: baca semua data dalam group-nya
CREATE POLICY "pb: supervisor read group"
  ON public.perusahaan_binaan FOR SELECT
  USING (
    is_supervisor()
    AND supervisor_id = auth.uid()
    AND deleted_at IS NULL
  );

-- Admin: baca data yang di-assign ke dia
CREATE POLICY "pb: admin read own"
  ON public.perusahaan_binaan FOR SELECT
  USING (
    is_admin()
    AND assigned_to = auth.uid()
    AND deleted_at IS NULL
  );

-- User/ARK: baca data yang di-assign ke dia
CREATE POLICY "pb: user read own"
  ON public.perusahaan_binaan FOR SELECT
  USING (
    NOT is_admin() AND NOT is_supervisor()
    AND assigned_to = auth.uid()
    AND deleted_at IS NULL
  );

-- Supervisor: insert data (supervisor_id harus dirinya)
CREATE POLICY "pb: supervisor insert"
  ON public.perusahaan_binaan FOR INSERT
  WITH CHECK (
    is_supervisor() AND supervisor_id = auth.uid()
  );

-- Admin: insert data (assigned_to harus dirinya)
CREATE POLICY "pb: admin insert"
  ON public.perusahaan_binaan FOR INSERT
  WITH CHECK (
    is_admin() AND assigned_to = auth.uid()
  );

-- Supervisor: update semua dalam group-nya
CREATE POLICY "pb: supervisor update group"
  ON public.perusahaan_binaan FOR UPDATE
  USING (
    is_supervisor() AND supervisor_id = auth.uid()
  );

-- Admin: update data miliknya
CREATE POLICY "pb: admin update own"
  ON public.perusahaan_binaan FOR UPDATE
  USING (
    is_admin() AND assigned_to = auth.uid()
  );

-- Supervisor: soft delete (update deleted_at)
CREATE POLICY "pb: supervisor delete"
  ON public.perusahaan_binaan FOR DELETE
  USING (
    is_supervisor() AND supervisor_id = auth.uid()
  );

-- ---- activity_logs ----

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Supervisor: baca activity log dalam group-nya
CREATE POLICY "al: supervisor read group"
  ON public.activity_logs FOR SELECT
  USING (
    is_supervisor() AND supervisor_id = auth.uid()
  );

-- Admin: baca activity log milik sendiri
CREATE POLICY "al: admin read own"
  ON public.activity_logs FOR SELECT
  USING (
    is_admin() AND user_id = auth.uid()
  );

-- Semua authenticated user bisa insert activity log
CREATE POLICY "al: authenticated insert"
  ON public.activity_logs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- ============================================================
-- STEP 10: Tambahkan Supabase Realtime untuk tabel terkait
-- ============================================================

-- Enable realtime untuk perusahaan_binaan
ALTER PUBLICATION supabase_realtime ADD TABLE public.perusahaan_binaan;

-- Enable realtime untuk activity_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- ============================================================
-- STEP 11: Cara setup Supervisor pertama (jalankan manual)
-- ============================================================

-- 1. Buat user supervisor lewat Supabase Auth
-- 2. Update profile:
--
-- UPDATE public.users_profile
-- SET role = 'supervisor', name = 'Nama Supervisor'
-- WHERE id = 'UUID_SUPERVISOR_ANDA';
--
-- 3. Assign admin yang ada ke supervisor:
--
-- UPDATE public.users_profile
-- SET supervisor_id = 'UUID_SUPERVISOR_ANDA'
-- WHERE role = 'admin';  -- atau filter spesifik
--
-- 4. Populate supervisor_id di perusahaan_binaan:
--
-- UPDATE public.perusahaan_binaan pb
-- SET supervisor_id = up.supervisor_id
-- FROM public.users_profile up
-- WHERE pb.assigned_to = up.id;
--
-- Atau jika semua data existing milik 1 supervisor:
--
-- UPDATE public.perusahaan_binaan
-- SET supervisor_id = 'UUID_SUPERVISOR_ANDA'
-- WHERE supervisor_id IS NULL AND deleted_at IS NULL;

-- ============================================================
-- VERIFIKASI
-- ============================================================

-- Jalankan ini untuk verifikasi setelah migration:
-- SELECT role, COUNT(*) FROM public.users_profile GROUP BY role;
-- SELECT COUNT(*) as total, COUNT(supervisor_id) as dengan_supervisor FROM public.perusahaan_binaan;
-- SELECT COUNT(*) FROM public.activity_logs;
