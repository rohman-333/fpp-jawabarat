-- Migration 025: Profile Enhancements for Social Features

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS cover_url text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS website text;

-- Add new reaction types to social_reactions if needed, or create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.social_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction_type text NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry', 'pray')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id, user_id)
);

ALTER TABLE public.social_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can see reactions"
ON public.social_reactions FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own reactions"
ON public.social_reactions FOR ALL
USING (auth.uid() = user_id);

-- Post Mentions Table
CREATE TABLE IF NOT EXISTS public.post_mentions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
    mentioned_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id, mentioned_user_id)
);

ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can see mentions"
ON public.post_mentions FOR SELECT
USING (true);

CREATE POLICY "Users can create mentions for their own posts"
ON public.post_mentions FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Recreate view to include new fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  name,
  username,
  avatar_url,
  bio,
  cover_url,
  location,
  website,
  role,
  has_pesantren,
  is_seller,
  is_courier,
  seller_status,
  courier_status,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
