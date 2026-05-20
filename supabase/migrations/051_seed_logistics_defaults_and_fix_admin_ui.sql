-- Migration 051: Seed defaults and fix unique indexes for fare rules
-- Ensure we reload the schema at the end of the script

-- 1. Create a unique constraint on delivery_fare_rules for service_type_id and zone_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_service_zone'
  ) THEN
    ALTER TABLE public.delivery_fare_rules ADD CONSTRAINT unique_service_zone UNIQUE (service_type_id, zone_id);
  END IF;
END $$;

-- 2. Seed delivery_zones
INSERT INTO public.delivery_zones (name, slug, province, city, is_active, sort_order)
VALUES
  ('Karawang', 'karawang', 'Jawa Barat', 'Karawang', true, 1),
  ('Bekasi', 'bekasi', 'Jawa Barat', 'Bekasi', true, 2),
  ('Bandung', 'bandung', 'Jawa Barat', 'Bandung', true, 3),
  ('Bogor', 'bogor', 'Jawa Barat', 'Bogor', true, 4),
  ('Depok', 'depok', 'Jawa Barat', 'Depok', true, 5),
  ('Jakarta Sekitar', 'jakarta-sekitar', 'DKI Jakarta', 'Jakarta', true, 6),
  ('Lainnya', 'lainnya', 'Jawa Barat', 'Lainnya', true, 7)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  province = EXCLUDED.province,
  city = EXCLUDED.city,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- 3. Seed shipping_methods
INSERT INTO public.shipping_methods (code, name, description, is_active, requires_courier, requires_tracking_number, requires_manual_fee, supports_cod, sort_order)
VALUES
  ('internal_courier', 'Kurir Wibawa', 'Layanan pengiriman instant oleh kurir internal Wibawa', true, true, false, false, true, 1),
  ('pickup', 'Ambil Sendiri', 'Pembeli mengambil sendiri pesanan ke toko penjual', true, false, false, false, false, 2),
  ('cod', 'Bayar di Tempat (COD)', 'Transaksi tunai saat barang diterima', true, true, false, false, true, 3),
  ('external_shipping', 'Ekspedisi Eksternal', 'Pengiriman melalui jasa ekspedisi seperti JNE, J&T, dll.', true, false, true, false, false, 4),
  ('manual_shipping', 'Pengiriman Manual', 'Kesepakatan pengiriman manual antara penjual dan pembeli', true, false, false, true, false, 5)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  requires_courier = EXCLUDED.requires_courier,
  requires_tracking_number = EXCLUDED.requires_tracking_number,
  requires_manual_fee = EXCLUDED.requires_manual_fee,
  supports_cod = EXCLUDED.supports_cod,
  sort_order = EXCLUDED.sort_order;

-- 4. Seed external_shipping_providers
INSERT INTO public.external_shipping_providers (code, name, description, is_active, sort_order)
VALUES 
  ('jne', 'JNE', 'Jalur Nugraha Ekakurir', true, 1),
  ('jnt', 'J&T', 'J&T Express', true, 2),
  ('sicepat', 'SiCepat', 'SiCepat Ekspres', true, 3),
  ('pos', 'POS Indonesia', 'POS Indonesia', true, 4),
  ('tiki', 'TIKI', 'Titipan Kilat', true, 5),
  ('lainnya', 'Lainnya', 'Jasa pengiriman lainnya', true, 6)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- 5. Seed service_types
INSERT INTO public.service_types (code, name, description, is_active, requires_passenger_safety, requires_driver_verification, sort_order)
VALUES
  ('marketplace_delivery', 'Marketplace Delivery', 'Pengiriman barang belanjaan marketplace', true, false, true, 1),
  ('package_delivery', 'Antar Barang / Paket', 'Kirim paket kilat, dokumen atau barang dagangan', true, false, true, 2),
  ('food_delivery', 'Antar Makanan & Belanja', 'Pesan makanan dari warung/kopsis atau pasar', true, false, true, 3),
  ('grocery_delivery', 'grocery_delivery', 'Belanja harian sayuran dan sembako', true, false, true, 4),
  ('errand', 'Titip Beli / Errand', 'Titip beli obat, bayar tagihan atau tugas serbaguna', true, false, true, 5),
  ('ride', 'Ojek / Antar Penumpang', 'Layanan ojek santri & ojek online', false, true, true, 6)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  requires_passenger_safety = EXCLUDED.requires_passenger_safety,
  requires_driver_verification = EXCLUDED.requires_driver_verification,
  sort_order = EXCLUDED.sort_order;

-- 6. Seed delivery_fare_rules
INSERT INTO public.delivery_fare_rules (service_type_id, zone_id, base_fare, per_km_fare, minimum_fare, platform_fee, courier_commission_percentage, platform_commission_percentage, is_active)
SELECT 
  st.id as service_type_id,
  dz.id as zone_id,
  CASE 
    WHEN st.code = 'ride' THEN 6000 
    WHEN st.code = 'food_delivery' THEN 5000 
    ELSE 8000 
  END as base_fare,
  CASE 
    WHEN st.code = 'ride' THEN 2000 
    WHEN st.code = 'food_delivery' THEN 2000 
    ELSE 2500 
  END as per_km_fare,
  CASE 
    WHEN st.code = 'ride' THEN 8000 
    WHEN st.code = 'food_delivery' THEN 7000 
    ELSE 10000 
  END as minimum_fare,
  1000 as platform_fee,
  80 as courier_commission_percentage,
  20 as platform_commission_percentage,
  true as is_active
FROM public.service_types st
CROSS JOIN public.delivery_zones dz
ON CONFLICT (service_type_id, zone_id) DO NOTHING;

-- 7. Notify PostgREST to reload the schema immediately
NOTIFY pgrst, 'reload schema';
