-- Migration 028: Fix Seller Applications Flow
-- Create the seller_applications table to explicitly track applications

CREATE TABLE IF NOT EXISTS public.seller_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    shop_name text NOT NULL,
    business_category text,
    description text,
    whatsapp text,
    address text,
    reason text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes text,
    reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own application"
ON public.seller_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own application"
ON public.seller_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own application if pending"
ON public.seller_applications FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admin can view all applications"
ON public.seller_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin', 'team')
  )
);

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
INSERT INTO public.seller_applications (user_id, shop_name, status, created_at)
SELECT p.id, coalesce(p.name, 'Toko Baru'), 'pending', now()
FROM public.profiles p
WHERE p.seller_status = 'pending'
AND NOT EXISTS (
  SELECT 1 FROM public.seller_applications sa WHERE sa.user_id = p.id
);
