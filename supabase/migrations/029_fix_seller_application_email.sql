-- Migration 029: Fix Seller Application Email
-- Adds applicant_email to seller_applications and backfills from auth.users

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='seller_applications' AND column_name='applicant_email') THEN
        ALTER TABLE public.seller_applications ADD COLUMN applicant_email text;
    END IF;
END $$;

-- Backfill applicant_email for existing applications
UPDATE public.seller_applications sa
SET applicant_email = au.email
FROM auth.users au
WHERE sa.user_id = au.id
AND sa.applicant_email IS NULL;

-- Ensure profiles that have seller_status = 'pending' but no seller_applications get a row
INSERT INTO public.seller_applications (user_id, store_name, status, applicant_email, created_at)
SELECT p.id, coalesce(p.name, 'Toko Baru'), 'pending', au.email, now()
FROM public.profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.seller_status = 'pending'
AND NOT EXISTS (
  SELECT 1 FROM public.seller_applications sa WHERE sa.user_id = p.id
);
