-- Migration 034: Fix feed query status and visibility

DO $$ 
BEGIN
    -- Update old data where status is null or 'published'
    UPDATE public.social_posts SET status = 'active' WHERE status IS NULL OR status = 'published';
    UPDATE public.social_posts SET visibility = 'public' WHERE visibility IS NULL;
    
    -- Ensure defaults are correct
    ALTER TABLE public.social_posts ALTER COLUMN status SET DEFAULT 'active';
    ALTER TABLE public.social_posts ALTER COLUMN visibility SET DEFAULT 'public';

    -- Re-create SELECT policy for social_posts to be comprehensive
    DROP POLICY IF EXISTS "Anyone can view posts" ON public.social_posts;
    CREATE POLICY "Anyone can view posts" ON public.social_posts FOR SELECT USING (
        (status IS NULL OR status IN ('active', 'published'))
        OR auth.uid() = author_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('superadmin', 'admin', 'team')
        )
    );
END $$;
