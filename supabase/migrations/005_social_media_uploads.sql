-- ==========================================
-- Migration: 005_social_media_uploads.sql
-- Description: Adds video_url and media_type to social_posts, sets up new storage buckets.
-- ==========================================

-- 1. Tambahkan kolom video_url dan media_type ke social_posts
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'text';

-- 2. Buat bucket storage jika belum ada
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('social_images', 'social_images', true)
    ON CONFLICT (id) DO UPDATE SET public = true;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('social_videos', 'social_videos', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
END $$;

-- 3. RLS untuk social_images
DROP POLICY IF EXISTS "Public can view social_images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload social_images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own social_images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own social_images" ON storage.objects;

CREATE POLICY "Public can view social_images" ON storage.objects
FOR SELECT USING (bucket_id = 'social_images');

CREATE POLICY "Authenticated users can upload social_images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'social_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own social_images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'social_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. RLS untuk social_videos
DROP POLICY IF EXISTS "Public can view social_videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload social_videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own social_videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own social_videos" ON storage.objects;

CREATE POLICY "Public can view social_videos" ON storage.objects
FOR SELECT USING (bucket_id = 'social_videos');

CREATE POLICY "Authenticated users can upload social_videos" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'social_videos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own social_videos" ON storage.objects
FOR DELETE USING (
    bucket_id = 'social_videos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
