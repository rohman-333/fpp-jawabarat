-- Migration 028: Fix Seller Applications Flow

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.seller_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Add columns safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='user_id') THEN
        ALTER TABLE public.seller_applications ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='store_name') THEN
        ALTER TABLE public.seller_applications ADD COLUMN store_name text NOT NULL DEFAULT 'Toko FPP';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='category') THEN
        ALTER TABLE public.seller_applications ADD COLUMN category text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='description') THEN
        ALTER TABLE public.seller_applications ADD COLUMN description text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='whatsapp') THEN
        ALTER TABLE public.seller_applications ADD COLUMN whatsapp text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='address') THEN
        ALTER TABLE public.seller_applications ADD COLUMN address text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='reason') THEN
        ALTER TABLE public.seller_applications ADD COLUMN reason text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='status') THEN
        ALTER TABLE public.seller_applications ADD COLUMN status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='reviewed_by') THEN
        ALTER TABLE public.seller_applications ADD COLUMN reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='reviewed_at') THEN
        ALTER TABLE public.seller_applications ADD COLUMN reviewed_at timestamptz;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='rejection_reason') THEN
        ALTER TABLE public.seller_applications ADD COLUMN rejection_reason text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='created_at') THEN
        ALTER TABLE public.seller_applications ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='updated_at') THEN
        ALTER TABLE public.seller_applications ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Drop constraints if needed, then add unique constraint securely
ALTER TABLE public.seller_applications DROP CONSTRAINT IF EXISTS seller_applications_user_id_key;
ALTER TABLE public.seller_applications ADD CONSTRAINT seller_applications_user_id_key UNIQUE (user_id);

-- RLS
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own application" ON public.seller_applications;
CREATE POLICY "Users can view own application"
ON public.seller_applications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own application" ON public.seller_applications;
CREATE POLICY "Users can insert own application"
ON public.seller_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own application if pending" ON public.seller_applications;
CREATE POLICY "Users can update own application if pending"
ON public.seller_applications FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admin can view all applications" ON public.seller_applications;
CREATE POLICY "Admin can view all applications"
ON public.seller_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

DROP POLICY IF EXISTS "Admin can update all applications" ON public.seller_applications;
CREATE POLICY "Admin can update all applications"
ON public.seller_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

-- Backfill from profiles that are pending but don't have an application
INSERT INTO public.seller_applications (user_id, store_name, status, created_at)
SELECT p.id, coalesce(p.name, 'Toko Baru'), 'pending', now()
FROM public.profiles p
WHERE p.seller_status = 'pending'
AND NOT EXISTS (
  SELECT 1 FROM public.seller_applications sa WHERE sa.user_id = p.id
);
