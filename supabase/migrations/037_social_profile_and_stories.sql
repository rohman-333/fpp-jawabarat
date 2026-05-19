-- Migration 037: Social Profile, Stories, and Push Subscriptions

-- 1. Extend profiles for modern social features
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE VIEW public.public_profiles AS
SELECT
  p.id,
  p.name,
  p.username,
  p.avatar_url,
  p.cover_url,
  p.bio,
  p.location,
  p.website,
  p.social_links,
  p.role,
  p.account_type,
  p.has_pesantren,
  p.pesantren_id,
  p.is_seller,
  p.seller_status,
  p.is_courier,
  p.courier_status,
  p.created_at
FROM public.profiles p
WHERE coalesce(p.status, 'active') = 'active';

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. Social Stories table
CREATE TABLE IF NOT EXISTS public.social_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  media_url text,
  media_type text, -- image, video, text
  background text,
  visibility text DEFAULT 'public',
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.social_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stories viewable by everyone if active"
  ON public.social_stories FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can create their own stories"
  ON public.social_stories FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own stories"
  ON public.social_stories FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all stories"
  ON public.social_stories FOR ALL
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin', 'operator') );

-- 3. Push Subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text,
  auth text,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Covers are public"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Users can upload their own covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

NOTIFY pgrst, 'reload schema';
