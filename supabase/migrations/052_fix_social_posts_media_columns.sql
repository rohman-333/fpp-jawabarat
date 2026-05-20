-- Migration 052: Fix social posts media columns
-- Idempotently add media_url and media_type to social_posts table

-- 1. Add media_url if not exists
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS media_url text;

-- 2. Add media_type if not exists
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'text';

-- 3. Add status if not exists
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 4. Add updated_at if not exists
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
