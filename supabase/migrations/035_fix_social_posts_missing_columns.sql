-- Migration 035: Add missing deleted_at and hidden_at columns

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.social_posts ADD COLUMN deleted_at timestamptz;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'hidden_at') THEN
        ALTER TABLE public.social_posts ADD COLUMN hidden_at timestamptz;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'status') THEN
        ALTER TABLE public.social_posts ADD COLUMN status text DEFAULT 'active';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'visibility') THEN
        ALTER TABLE public.social_posts ADD COLUMN visibility text DEFAULT 'public';
    END IF;

    -- Normalize data again to be absolutely sure
    UPDATE public.social_posts SET status = 'active' WHERE status IS NULL OR status = 'published';
    UPDATE public.social_posts SET visibility = 'public' WHERE visibility IS NULL;
    
    -- Ensure defaults
    ALTER TABLE public.social_posts ALTER COLUMN status SET DEFAULT 'active';
    ALTER TABLE public.social_posts ALTER COLUMN visibility SET DEFAULT 'public';
END $$;

-- Notify postgREST to reload the schema cache so new columns are immediately available
NOTIFY pgrst, 'reload schema';
