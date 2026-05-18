-- Migration 031: Feed Reactions and Delete Post

-- 1. Add Soft Delete to social_posts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'status') THEN
        ALTER TABLE public.social_posts ADD COLUMN status text DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.social_posts ADD COLUMN deleted_at timestamptz;
    END IF;
END $$;

-- 2. Create social_reactions table for facebook-like reactions
CREATE TABLE IF NOT EXISTS public.social_reactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry', 'pray')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- 3. Set RLS on social_reactions
ALTER TABLE public.social_reactions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Select policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'social_reactions' AND policyname = 'Anyone can view reactions'
    ) THEN
        CREATE POLICY "Anyone can view reactions" ON public.social_reactions FOR SELECT USING (true);
    END IF;

    -- Insert policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'social_reactions' AND policyname = 'Users can add their own reaction'
    ) THEN
        CREATE POLICY "Users can add their own reaction" ON public.social_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'social_reactions' AND policyname = 'Users can update their own reaction'
    ) THEN
        CREATE POLICY "Users can update their own reaction" ON public.social_reactions FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Delete policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'social_reactions' AND policyname = 'Users can delete their own reaction'
    ) THEN
        CREATE POLICY "Users can delete their own reaction" ON public.social_reactions FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
