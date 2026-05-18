-- ==========================================
-- Migration: 002_storage_pesantren.sql
-- Description: Membuat Storage Buckets dan RLS Policies untuk unggah file.
-- ==========================================

-- 1. Tambah kolom foto_url jika belum ada di tabel pesantren
ALTER TABLE public.pesantren ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. Fungsi Helper untuk Insert Bucket jika belum ada
CREATE OR REPLACE FUNCTION public.create_bucket_if_not_exists(bucket_id TEXT)
RETURNS void AS $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES (bucket_id, bucket_id, true)
    ON CONFLICT (id) DO UPDATE SET public = true;
END;
$$ LANGUAGE plpgsql;

-- 3. Inisialisasi semua buckets yang dibutuhkan
SELECT public.create_bucket_if_not_exists('avatars');
SELECT public.create_bucket_if_not_exists('pesantren_logos');
SELECT public.create_bucket_if_not_exists('pesantren_photos');
SELECT public.create_bucket_if_not_exists('product_images');
SELECT public.create_bucket_if_not_exists('forum_images');
SELECT public.create_bucket_if_not_exists('program_images');
SELECT public.create_bucket_if_not_exists('donation_images');

-- 4. Enable RLS pada objek storage
-- Storage.objects menggunakan RLS secara default, tapi kita pastikan ulang.

-- ==========================================
-- RLS POLICIES UNTUK BUCKET: pesantren_logos
-- ==========================================
DROP POLICY IF EXISTS "Public can view pesantren_logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pesantren_logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own pesantren_logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own pesantren_logos" ON storage.objects;

CREATE POLICY "Public can view pesantren_logos" ON storage.objects
FOR SELECT USING (bucket_id = 'pesantren_logos');

CREATE POLICY "Authenticated users can upload pesantren_logos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'pesantren_logos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own pesantren_logos" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'pesantren_logos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own pesantren_logos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'pesantren_logos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ==========================================
-- RLS POLICIES UNTUK BUCKET: pesantren_photos
-- ==========================================
DROP POLICY IF EXISTS "Public can view pesantren_photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pesantren_photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own pesantren_photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own pesantren_photos" ON storage.objects;

CREATE POLICY "Public can view pesantren_photos" ON storage.objects
FOR SELECT USING (bucket_id = 'pesantren_photos');

CREATE POLICY "Authenticated users can upload pesantren_photos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'pesantren_photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own pesantren_photos" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'pesantren_photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own pesantren_photos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'pesantren_photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ==========================================
-- RLS POLICIES UNTUK BUCKET: avatars
-- ==========================================
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatars" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
