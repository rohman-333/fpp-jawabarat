-- Migration 027: Courier Business Model

CREATE TABLE IF NOT EXISTS public.courier_zones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    city text NOT NULL,
    district text NOT NULL,
    base_fee numeric NOT NULL DEFAULT 0,
    per_km_fee numeric NOT NULL DEFAULT 0,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL, -- references orders
    courier_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    zone_id uuid REFERENCES public.courier_zones(id) ON DELETE SET NULL,
    pickup_address text NOT NULL,
    delivery_address text NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'delivered', 'cancelled')),
    assigned_at timestamptz,
    picked_up_at timestamptz,
    delivered_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.courier_earnings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id uuid NOT NULL,
    delivery_id uuid REFERENCES public.order_deliveries(id) ON DELETE CASCADE,
    gross_fee numeric NOT NULL DEFAULT 0,
    platform_cut numeric NOT NULL DEFAULT 0,
    courier_net numeric NOT NULL DEFAULT 0,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.courier_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can see active zones"
ON public.courier_zones FOR SELECT
USING (status = 'active');

CREATE POLICY "Admin can manage zones"
ON public.courier_zones
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin', 'team'))
);

CREATE POLICY "Couriers can see their deliveries"
ON public.order_deliveries FOR SELECT
USING (auth.uid() = courier_id);

CREATE POLICY "Admin can manage deliveries"
ON public.order_deliveries
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin', 'team'))
);

CREATE POLICY "Couriers can see their earnings"
ON public.courier_earnings FOR SELECT
USING (auth.uid() = courier_id);

CREATE POLICY "Admin can manage earnings"
ON public.courier_earnings
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin', 'team'))
);
