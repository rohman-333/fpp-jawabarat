-- Migration 042: Finalize Notifications schema

DO $$
BEGIN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title text;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body text;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS href text;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read boolean default false;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'actor_id'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN actor_id uuid references public.profiles(id) on delete set null;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
