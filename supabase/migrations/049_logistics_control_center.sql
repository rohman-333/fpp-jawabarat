-- Idempotent Logistics Control Center Migration

-- 1. Create shipping_methods table
CREATE TABLE IF NOT EXISTS public.shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  requires_courier boolean DEFAULT false,
  requires_tracking_number boolean DEFAULT false,
  requires_manual_fee boolean DEFAULT false,
  supports_cod boolean DEFAULT false,
  sort_order int DEFAULT 0,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Seed shipping_methods
INSERT INTO public.shipping_methods (code, name, description, is_active, requires_courier, requires_tracking_number, requires_manual_fee, supports_cod, sort_order)
VALUES 
  ('internal_courier', 'Kurir Internal WIBAWA', 'Pengiriman cepat menggunakan kurir terverifikasi platform WIBAWA', true, true, false, false, true, 1),
  ('pickup', 'Ambil Sendiri / Pickup', 'Ambil barang langsung ke lokasi penjual/toko', true, false, false, false, false, 2),
  ('cod', 'Cash on Delivery (COD)', 'Bayar tunai langsung ke kurir saat barang sampai di tujuan', true, true, false, false, true, 3),
  ('external_shipping', 'Jasa Ekspedisi Eksternal', 'Pengiriman paket menggunakan kurir ekspedisi populer (JNE, J&T, dll)', true, false, true, false, false, 4),
  ('manual_shipping', 'Pengiriman Manual / Khusus', 'Metode pengantaran khusus yang disepakati langsung dengan penjual', true, false, false, true, false, 5)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  requires_courier = EXCLUDED.requires_courier,
  requires_tracking_number = EXCLUDED.requires_tracking_number,
  requires_manual_fee = EXCLUDED.requires_manual_fee,
  supports_cod = EXCLUDED.supports_cod,
  sort_order = EXCLUDED.sort_order;

-- 3. Create external_shipping_providers table
CREATE TABLE IF NOT EXISTS public.external_shipping_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  tracking_url_template text,
  support_phone text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Seed external_shipping_providers
INSERT INTO public.external_shipping_providers (code, name, description, is_active, sort_order)
VALUES 
  ('jne', 'JNE Express', 'Jalur Nugraha Ekakurir', true, 1),
  ('jnt', 'J&T Express', 'J&T pengiriman cepat nusantara', true, 2),
  ('sicepat', 'SiCepat Ekspres', 'SiCepat layanan ekspres', true, 3),
  ('pos', 'POS Indonesia', 'Layanan Pos logistik nasional', true, 4),
  ('tiki', 'TIKI', 'Titipan Kilat', true, 5),
  ('lalamove', 'Lalamove', 'Pengantaran instan roda dua/empat', true, 6),
  ('grab_express', 'GrabExpress Manual', 'Pengantaran instan via ojek online Grab manual', true, 7)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 5. Create logistics_settings table
CREATE TABLE IF NOT EXISTS public.logistics_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb DEFAULT '{}',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Seed logistics_settings
INSERT INTO public.logistics_settings (key, value, description)
VALUES 
  ('cod_settings', '{"enabled": true, "max_amount": 500000, "cod_fee": 3000, "allowed_zone_ids": []}', 'Pengaturan Cash on Delivery (COD) global'),
  ('ride_settings', '{"enabled": false, "requires_safety_verified": true, "max_passengers": 1, "helmet_required": true}', 'Pengaturan layanan Ojek / Antar Orang'),
  ('internal_courier_settings', '{"enabled": true, "automatic_assign": false}', 'Pengaturan kurir internal platform'),
  ('external_shipping_settings', '{"enabled": true}', 'Pengaturan opsi ekspedisi eksternal'),
  ('fare_engine_settings', '{"base_fare": 5000, "per_km_fare": 2500, "minimum_fare": 7000, "platform_fee": 1000}', 'Parameter awal perhitungan argo ongkir otomatis')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;

-- 7. Safely alter orders table to add logistics tracking columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_method_id uuid REFERENCES public.shipping_methods(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_method_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_provider_id uuid REFERENCES public.external_shipping_providers(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_provider_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_status text DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_fee numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_cod boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fare_breakdown jsonb DEFAULT '{}';

-- 8. Enable Row-Level Security (RLS) on new tables
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_shipping_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_settings ENABLE ROW LEVEL SECURITY;

-- 9. Setup RLS Policies

-- shipping_methods
CREATE POLICY "shipping_methods_select" ON public.shipping_methods FOR SELECT TO public USING (is_active = true);
CREATE POLICY "shipping_methods_all_admin" ON public.shipping_methods FOR ALL TO public USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);

-- external_shipping_providers
CREATE POLICY "external_shipping_providers_select" ON public.external_shipping_providers FOR SELECT TO public USING (is_active = true);
CREATE POLICY "external_shipping_providers_all_admin" ON public.external_shipping_providers FOR ALL TO public USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);

-- logistics_settings
CREATE POLICY "logistics_settings_select" ON public.logistics_settings FOR SELECT TO public USING (true);
CREATE POLICY "logistics_settings_all_admin" ON public.logistics_settings FOR ALL TO public USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'superadmin'))
);

-- Force PostgREST schema refresh
NOTIFY pgrst, 'reload schema';
