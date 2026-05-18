-- Migration 033: Fix social posts status and visibility defaults

DO $$ 
BEGIN
    -- Ensure columns exist (fallback if missing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'status') THEN
        ALTER TABLE public.social_posts ADD COLUMN status text DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'visibility') THEN
        ALTER TABLE public.social_posts ADD COLUMN visibility text DEFAULT 'public';
    END IF;

    -- Update old data where it's null
    UPDATE public.social_posts SET status = 'active' WHERE status IS NULL;
    UPDATE public.social_posts SET visibility = 'public' WHERE visibility IS NULL;
    
    -- Add defaults explicitly just in case
    ALTER TABLE public.social_posts ALTER COLUMN status SET DEFAULT 'active';
    ALTER TABLE public.social_posts ALTER COLUMN visibility SET DEFAULT 'public';

    -- Check and fix RLS
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'social_posts' AND policyname = 'Authenticated users can insert posts'
    ) THEN
        CREATE POLICY "Authenticated users can insert posts" ON public.social_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
    END IF;

    -- Update select policy if needed to include status='active' logic
    -- We can drop and recreate the select policy to ensure it handles status properly.
    DROP POLICY IF EXISTS "Anyone can view posts" ON public.social_posts;
    CREATE POLICY "Anyone can view posts" ON public.social_posts FOR SELECT USING (
        status = 'active' OR status IS NULL OR auth.uid() = author_id
    );
END $$;
