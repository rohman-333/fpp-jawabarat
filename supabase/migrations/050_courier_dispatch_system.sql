-- Migration 050: Courier Dispatch System / Mekanisme Pemesanan Jasa

-- 1. Add new columns to public.deliveries
ALTER TABLE public.deliveries 
  ADD COLUMN IF NOT EXISTS dispatch_mode text DEFAULT 'manual_assignment',
  ADD COLUMN IF NOT EXISTS dispatch_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS accepted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dispatch_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS pickup_lat numeric,
  ADD COLUMN IF NOT EXISTS pickup_lng numeric,
  ADD COLUMN IF NOT EXISTS destination_lat numeric,
  ADD COLUMN IF NOT EXISTS destination_lng numeric,
  ADD COLUMN IF NOT EXISTS distance_km numeric DEFAULT 0;

-- 2. Create public.delivery_dispatch_offers table
CREATE TABLE IF NOT EXISTS public.delivery_dispatch_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  courier_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  courier_profile_id uuid NOT NULL REFERENCES public.courier_profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'rejected', 'expired', 'cancelled')),
  distance_km numeric,
  offered_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS on public.delivery_dispatch_offers
ALTER TABLE public.delivery_dispatch_offers ENABLE ROW LEVEL SECURITY;

-- 4. Create basic RLS policies for delivery_dispatch_offers
DROP POLICY IF EXISTS "Anyone can view their own offers" ON public.delivery_dispatch_offers;
CREATE POLICY "Anyone can view their own offers" ON public.delivery_dispatch_offers
  FOR SELECT USING (
    auth.uid() = courier_id OR 
    auth.uid() IN (SELECT buyer_id FROM public.deliveries WHERE id = delivery_id) OR
    auth.uid() IN (SELECT seller_id FROM public.deliveries WHERE id = delivery_id) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'team'))
  );

DROP POLICY IF EXISTS "Couriers can update their own offers" ON public.delivery_dispatch_offers;
CREATE POLICY "Couriers can update their own offers" ON public.delivery_dispatch_offers
  FOR UPDATE USING (auth.uid() = courier_id);

DROP POLICY IF EXISTS "Admins can manage all offers" ON public.delivery_dispatch_offers;
CREATE POLICY "Admins can manage all offers" ON public.delivery_dispatch_offers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'team'))
  );

-- Reload postgrest schema to pick up new changes
NOTIFY pgrst, 'reload schema';
