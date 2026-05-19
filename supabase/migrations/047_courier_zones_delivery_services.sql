-- Idempotent Courier, Zones, Delivery Services, Wallets Migration

-- A. Alter profiles table to add courier indicators
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_courier boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS courier_status text DEFAULT 'none';

-- B. Create service_types table
CREATE TABLE IF NOT EXISTS public.service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  requires_passenger_safety boolean DEFAULT false,
  requires_driver_verification boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- C. Create delivery_zones table
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  province text DEFAULT 'Jawa Barat',
  city text,
  district text,
  subdistrict text,
  postal_code text,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- D. Create delivery_fare_rules table
CREATE TABLE IF NOT EXISTS public.delivery_fare_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type_id uuid REFERENCES public.service_types(id) ON DELETE CASCADE,
  zone_id uuid REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
  origin_zone_id uuid REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
  destination_zone_id uuid REFERENCES public.delivery_zones(id) ON DELETE CASCADE,
  base_fare numeric DEFAULT 0,
  per_km_fare numeric DEFAULT 0,
  minimum_fare numeric DEFAULT 0,
  maximum_fare numeric,
  platform_fee numeric DEFAULT 0,
  courier_commission_percentage numeric DEFAULT 80,
  platform_commission_percentage numeric DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- E. Create courier_profiles table
CREATE TABLE IF NOT EXISTS public.courier_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  vehicle_type text, -- motor, mobil, sepeda, jalan_kaki
  vehicle_brand text,
  vehicle_plate text,
  service_area text,
  zone_id uuid REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
  status text DEFAULT 'pending', -- pending, approved, rejected, suspended
  is_online boolean DEFAULT false,
  current_lat numeric,
  current_lng numeric,
  last_location_at timestamptz,
  identity_card_url text,
  driver_license_url text,
  vehicle_registration_url text,
  selfie_url text,
  can_deliver_goods boolean DEFAULT true,
  can_deliver_food boolean DEFAULT true,
  can_do_errand boolean DEFAULT true,
  can_ride_passenger boolean DEFAULT false,
  safety_verified boolean DEFAULT false,
  rating numeric DEFAULT 0,
  total_jobs int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- F. Create deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  service_type_id uuid REFERENCES public.service_types(id) ON DELETE SET NULL,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  courier_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  courier_profile_id uuid REFERENCES public.courier_profiles(id) ON DELETE SET NULL,
  origin_name text,
  origin_phone text,
  origin_address text,
  origin_lat numeric,
  origin_lng numeric,
  destination_name text,
  destination_phone text,
  destination_address text,
  destination_lat numeric,
  destination_lng numeric,
  pickup_note text,
  delivery_note text,
  item_description text,
  item_weight numeric,
  passenger_count int,
  distance_km numeric DEFAULT 0,
  fare_amount numeric DEFAULT 0,
  platform_fee numeric DEFAULT 0,
  courier_earning numeric DEFAULT 0,
  payment_status text DEFAULT 'unpaid', -- unpaid, paid
  status text DEFAULT 'pending', -- pending, waiting_assignment, assigned, accepted, pickup, picked_up, in_progress, delivered, completed, cancelled, rejected
  assigned_at timestamptz,
  accepted_at timestamptz,
  picked_up_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- G. Create delivery_status_logs table
CREATE TABLE IF NOT EXISTS public.delivery_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid REFERENCES public.deliveries(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- H. Create courier_wallet_transactions table
CREATE TABLE IF NOT EXISTS public.courier_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  courier_profile_id uuid REFERENCES public.courier_profiles(id) ON DELETE SET NULL,
  delivery_id uuid REFERENCES public.deliveries(id) ON DELETE SET NULL,
  type text NOT NULL, -- earning, adjustment, payout, refund
  amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'recorded', -- recorded, pending, paid, cancelled
  description text,
  created_at timestamptz DEFAULT now()
);

-- I. Create courier_payouts table
CREATE TABLE IF NOT EXISTS public.courier_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric DEFAULT 0,
  status text DEFAULT 'pending', -- pending, approved, paid, rejected
  method text,
  account_name text,
  account_number text,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- J. Seed Service Types
INSERT INTO public.service_types (code, name, description, is_active, requires_passenger_safety, requires_driver_verification, sort_order)
VALUES 
  ('marketplace_delivery', 'Kurir Marketplace', 'Layanan pengantaran barang marketplace pesantren', true, false, true, 1),
  ('package_delivery', 'Antar Barang', 'Kirim dokumen atau paket barang instan', true, false, true, 2),
  ('food_delivery', 'Antar Makanan', 'Pengantaran makanan dan minuman instan', true, false, true, 3),
  ('grocery_delivery', 'Antar Belanjaan', 'Layanan belanja kebutuhan harian dari pasar/toko', true, false, true, 4),
  ('errand', 'Titip Beli', 'Titip beli barang serbaguna atau tugas kurir serba ada', true, false, true, 5),
  ('ride', 'Ojek / Antar Orang', 'Layanan ojek perjalanan penumpang instan (Default Nonaktif)', false, true, true, 6)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- K. Enable Row Level Security (RLS) on all new tables
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_fare_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_payouts ENABLE ROW LEVEL SECURITY;

-- L. RLS Policies

-- service_types
CREATE POLICY "service_types_select" ON public.service_types FOR SELECT TO public USING (is_active = true);
CREATE POLICY "service_types_all_admin" ON public.service_types FOR ALL TO public USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);

-- delivery_zones
CREATE POLICY "delivery_zones_select" ON public.delivery_zones FOR SELECT TO public USING (is_active = true);
CREATE POLICY "delivery_zones_all_admin" ON public.delivery_zones FOR ALL TO public USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);

-- delivery_fare_rules
CREATE POLICY "delivery_fare_rules_select" ON public.delivery_fare_rules FOR SELECT TO public USING (is_active = true);
CREATE POLICY "delivery_fare_rules_all_admin" ON public.delivery_fare_rules FOR ALL TO public USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);

-- courier_profiles
CREATE POLICY "courier_profiles_select_own" ON public.courier_profiles FOR SELECT TO authenticated USING (
  user_id = auth.uid() OR
  status = 'approved' OR
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);
CREATE POLICY "courier_profiles_insert_own" ON public.courier_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "courier_profiles_update_own" ON public.courier_profiles FOR UPDATE TO authenticated USING (
  user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);
CREATE POLICY "courier_profiles_delete_admin" ON public.courier_profiles FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);

-- deliveries
CREATE POLICY "deliveries_select" ON public.deliveries FOR SELECT TO authenticated USING (
  buyer_id = auth.uid() OR
  seller_id = auth.uid() OR
  courier_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);
CREATE POLICY "deliveries_insert" ON public.deliveries FOR INSERT TO authenticated WITH CHECK (
  buyer_id = auth.uid() OR
  seller_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);
CREATE POLICY "deliveries_update" ON public.deliveries FOR UPDATE TO authenticated USING (
  buyer_id = auth.uid() OR
  seller_id = auth.uid() OR
  courier_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);
CREATE POLICY "deliveries_delete_admin" ON public.deliveries FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);

-- delivery_status_logs
CREATE POLICY "delivery_status_logs_select" ON public.delivery_status_logs FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.deliveries d 
    WHERE d.id = delivery_id AND (d.buyer_id = auth.uid() OR d.seller_id = auth.uid() OR d.courier_id = auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);
CREATE POLICY "delivery_status_logs_insert" ON public.delivery_status_logs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.deliveries d 
    WHERE d.id = delivery_id AND (d.courier_id = auth.uid() OR d.seller_id = auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);

-- courier_wallet_transactions
CREATE POLICY "courier_wallet_transactions_select" ON public.courier_wallet_transactions FOR SELECT TO authenticated USING (
  courier_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);
CREATE POLICY "courier_wallet_transactions_all_admin" ON public.courier_wallet_transactions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);

-- courier_payouts
CREATE POLICY "courier_payouts_select" ON public.courier_payouts FOR SELECT TO authenticated USING (
  courier_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);
CREATE POLICY "courier_payouts_insert" ON public.courier_payouts FOR INSERT TO authenticated WITH CHECK (
  courier_id = auth.uid()
);
CREATE POLICY "courier_payouts_update" ON public.courier_payouts FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);
