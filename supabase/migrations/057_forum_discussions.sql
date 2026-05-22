-- Migration: 057_forum_discussions
-- Description: Create public.forum_discussions table with proper RLS

CREATE TABLE IF NOT EXISTS public.forum_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.forum_discussions ENABLE ROW LEVEL SECURITY;

-- 1. Select: Allow everyone (anonymous and authenticated) to read
DROP POLICY IF EXISTS "Forum discussions are viewable by everyone" ON public.forum_discussions;
CREATE POLICY "Forum discussions are viewable by everyone"
  ON public.forum_discussions
  FOR SELECT
  USING (true);

-- 2. Insert: Allow authenticated users to insert their own discussions
DROP POLICY IF EXISTS "Authenticated users can create discussions" ON public.forum_discussions;
CREATE POLICY "Authenticated users can create discussions"
  ON public.forum_discussions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Update: Allow authors or administrators (admin, superadmin, operator) to update
DROP POLICY IF EXISTS "Authors or admins can update discussions" ON public.forum_discussions;
CREATE POLICY "Authors or admins can update discussions"
  ON public.forum_discussions
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'operator', 'team')
    )
  );

-- 4. Delete: Allow authors or administrators to delete
DROP POLICY IF EXISTS "Authors or admins can delete discussions" ON public.forum_discussions;
CREATE POLICY "Authors or admins can delete discussions"
  ON public.forum_discussions
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'operator', 'team')
    )
  );
