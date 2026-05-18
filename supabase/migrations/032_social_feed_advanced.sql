-- Migration 032: Social Feed Advanced

DO $$ 
BEGIN
    -- 1. social_posts enhancements
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'hidden_at') THEN
        ALTER TABLE public.social_posts ADD COLUMN hidden_at timestamptz;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'visibility') THEN
        ALTER TABLE public.social_posts ADD COLUMN visibility text DEFAULT 'public';
    END IF;
END $$;

-- 2. post_mentions table
CREATE TABLE IF NOT EXISTS public.post_mentions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
    mentioned_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id, mentioned_user_id)
);

ALTER TABLE public.post_mentions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'post_mentions' AND policyname = 'Anyone can view mentions'
    ) THEN
        CREATE POLICY "Anyone can view mentions" ON public.post_mentions FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'post_mentions' AND policyname = 'Users can insert mentions'
    ) THEN
        CREATE POLICY "Users can insert mentions" ON public.post_mentions FOR INSERT WITH CHECK (auth.uid() = created_by);
    END IF;
END $$;

-- 3. saved_posts table (already exists as social_saves, let's verify or rename)
-- Wait, the prompt says saved_posts. Our codebase uses social_saves in actions.ts.
-- We will stick to social_saves, but ensure it's there.
CREATE TABLE IF NOT EXISTS public.social_saves (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES public.social_posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(post_id, user_id)
);

ALTER TABLE public.social_saves ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'social_saves' AND policyname = 'Users can view own saves'
    ) THEN
        CREATE POLICY "Users can view own saves" ON public.social_saves FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'social_saves' AND policyname = 'Users can manage own saves'
    ) THEN
        CREATE POLICY "Users can manage own saves" ON public.social_saves FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
