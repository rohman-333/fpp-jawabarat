-- ==========================================
-- Migration: 004_social_feed.sql
-- Description: Schema for Unified Social Feed FPP JAWABARAT
-- ==========================================

-- 1. Update tabel profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'masyarakat_umum';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Add check constraint safely for account_type if needed (or just let it be text as requested)
-- The requested types are: pesantren, kiai, ustadz, santri, alumni, wali_santri, seller, masyarakat_umum, lembaga, donatur
-- We'll just trust the application to enforce it, or add a CHECK constraint if we want to be strict.
-- But user requested text default 'masyarakat_umum', so let's stick to simple alter table.

-- 2. Buat tabel social_posts
CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  pesantren_id uuid REFERENCES public.pesantren(id) ON DELETE SET NULL,
  type text DEFAULT 'kabar',
  content text NOT NULL,
  image_url text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  donation_id uuid REFERENCES public.donations(id) ON DELETE SET NULL,
  visibility text DEFAULT 'public',
  status text DEFAULT 'published',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Buat tabel social_comments
CREATE TABLE IF NOT EXISTS public.social_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. Buat tabel social_likes
CREATE TABLE IF NOT EXISTS public.social_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 5. Buat tabel social_follows
CREATE TABLE IF NOT EXISTS public.social_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 6. Buat tabel social_saves
CREATE TABLE IF NOT EXISTS public.social_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 7. Buat indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_author_id ON public.social_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_type ON public.social_posts(type);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON public.social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_post_id ON public.social_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_social_follows_follower_id ON public.social_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_social_follows_following_id ON public.social_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_social_saves_post_id ON public.social_saves(post_id);

-- 8. Functions & Triggers
CREATE OR REPLACE FUNCTION public.update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_social_posts_modtime ON public.social_posts;
CREATE TRIGGER update_social_posts_modtime 
BEFORE UPDATE ON public.social_posts 
FOR EACH ROW EXECUTE PROCEDURE public.update_modified_column();

-- 9. RLS Setup

-- Enable RLS for all new tables
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_saves ENABLE ROW LEVEL SECURITY;

-- Safely drop existing policies if any (idempotency)
DROP POLICY IF EXISTS "semua user bisa membaca post public dan published" ON public.social_posts;
DROP POLICY IF EXISTS "authenticated user bisa membuat post sendiri" ON public.social_posts;
DROP POLICY IF EXISTS "user hanya bisa edit/delete post miliknya" ON public.social_posts;
DROP POLICY IF EXISTS "admin/operator bisa moderasi semua post (update)" ON public.social_posts;
DROP POLICY IF EXISTS "admin/operator bisa moderasi semua post (delete)" ON public.social_posts;

DROP POLICY IF EXISTS "semua user bisa membaca comments" ON public.social_comments;
DROP POLICY IF EXISTS "authenticated user bisa komentar" ON public.social_comments;
DROP POLICY IF EXISTS "user hanya bisa hapus komentar miliknya" ON public.social_comments;
DROP POLICY IF EXISTS "admin/operator bisa hapus semua komentar" ON public.social_comments;

DROP POLICY IF EXISTS "semua user bisa membaca likes" ON public.social_likes;
DROP POLICY IF EXISTS "authenticated user bisa like/unlike" ON public.social_likes;

DROP POLICY IF EXISTS "semua user bisa membaca follows" ON public.social_follows;
DROP POLICY IF EXISTS "authenticated user bisa follow/unfollow" ON public.social_follows;

DROP POLICY IF EXISTS "user hanya bisa membaca saves miliknya" ON public.social_saves;
DROP POLICY IF EXISTS "authenticated user bisa save/unsave" ON public.social_saves;


-- RLS: social_posts
-- semua user bisa membaca post public dan published
CREATE POLICY "semua user bisa membaca post public dan published" 
ON public.social_posts FOR SELECT 
USING (visibility = 'public' AND status = 'published');

-- authenticated user bisa membuat post sendiri
CREATE POLICY "authenticated user bisa membuat post sendiri" 
ON public.social_posts FOR INSERT 
WITH CHECK (auth.uid() = author_id);

-- user hanya bisa edit/delete post miliknya
CREATE POLICY "user hanya bisa edit/delete post miliknya" 
ON public.social_posts FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "user hanya bisa delete post miliknya" 
ON public.social_posts FOR DELETE 
USING (auth.uid() = author_id);

-- admin/operator bisa moderasi semua post
CREATE POLICY "admin/operator bisa moderasi semua post (update)" 
ON public.social_posts FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'operator')
  )
);

CREATE POLICY "admin/operator bisa moderasi semua post (delete)" 
ON public.social_posts FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'operator')
  )
);


-- RLS: social_comments
CREATE POLICY "semua user bisa membaca comments" 
ON public.social_comments FOR SELECT USING (true);

-- authenticated user bisa komentar
CREATE POLICY "authenticated user bisa komentar" 
ON public.social_comments FOR INSERT 
WITH CHECK (auth.uid() = author_id);

-- user hanya bisa hapus komentar miliknya
CREATE POLICY "user hanya bisa hapus komentar miliknya" 
ON public.social_comments FOR DELETE 
USING (auth.uid() = author_id);

CREATE POLICY "admin/operator bisa hapus semua komentar" 
ON public.social_comments FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'operator')
  )
);


-- RLS: social_likes
CREATE POLICY "semua user bisa membaca likes" 
ON public.social_likes FOR SELECT USING (true);

CREATE POLICY "authenticated user bisa like/unlike" 
ON public.social_likes FOR ALL 
USING (auth.uid() = user_id);


-- RLS: social_follows
CREATE POLICY "semua user bisa membaca follows" 
ON public.social_follows FOR SELECT USING (true);

CREATE POLICY "authenticated user bisa follow/unfollow" 
ON public.social_follows FOR ALL 
USING (auth.uid() = follower_id);


-- RLS: social_saves
CREATE POLICY "user hanya bisa membaca saves miliknya" 
ON public.social_saves FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "authenticated user bisa save/unsave" 
ON public.social_saves FOR ALL 
USING (auth.uid() = user_id);

-- Storage bucket for posts (if not exists)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('post_images', 'post_images', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
END $$;

DROP POLICY IF EXISTS "Public can view post_images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload post_images" ON storage.objects;

CREATE POLICY "Public can view post_images" ON storage.objects
FOR SELECT USING (bucket_id = 'post_images');

CREATE POLICY "Authenticated users can upload post_images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'post_images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
