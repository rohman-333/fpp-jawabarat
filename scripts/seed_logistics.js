const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tazbsyjulkmyscohiwgq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhemJzeWp1bGtteXNjb2hpd2dxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA0MTg4NywiZXhwIjoyMDk0NjE3ODg3fQ.GEh0emum8SIEQczH2zEtmCDj80zKXII8GJb8aXJJqNM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const zones = [
  { name: 'Karawang', slug: 'karawang', province: 'Jawa Barat', city: 'Karawang', is_active: true, sort_order: 1 },
  { name: 'Bekasi', slug: 'bekasi', province: 'Jawa Barat', city: 'Bekasi', is_active: true, sort_order: 2 },
  { name: 'Bandung', slug: 'bandung', province: 'Jawa Barat', city: 'Bandung', is_active: true, sort_order: 3 },
  { name: 'Bogor', slug: 'bogor', province: 'Jawa Barat', city: 'Bogor', is_active: true, sort_order: 4 },
  { name: 'Depok', slug: 'depok', province: 'Jawa Barat', city: 'Depok', is_active: true, sort_order: 5 },
  { name: 'Jakarta Sekitar', slug: 'jakarta-sekitar', province: 'DKI Jakarta', city: 'Jakarta', is_active: true, sort_order: 6 },
  { name: 'Lainnya', slug: 'lainnya', province: 'Jawa Barat', city: 'Lainnya', is_active: true, sort_order: 7 }
];

const shippingMethods = [
  { code: 'internal_courier', name: 'Kurir Wibawa', description: 'Layanan pengiriman instant oleh kurir internal Wibawa', is_active: true, requires_courier: true, requires_tracking_number: false, requires_manual_fee: false, supports_cod: true, sort_order: 1 },
  { code: 'pickup', name: 'Ambil Sendiri', description: 'Pembeli mengambil sendiri pesanan ke toko penjual', is_active: true, requires_courier: false, requires_tracking_number: false, requires_manual_fee: false, supports_cod: false, sort_order: 2 },
  { code: 'cod', name: 'Bayar di Tempat (COD)', description: 'Transaksi tunai saat barang diterima', is_active: true, requires_courier: true, requires_tracking_number: false, requires_manual_fee: false, supports_cod: true, sort_order: 3 },
  { code: 'external_shipping', name: 'Ekspedisi Eksternal', description: 'Pengiriman melalui jasa ekspedisi seperti JNE, J&T, etc.', is_active: true, requires_courier: false, requires_tracking_number: true, requires_manual_fee: false, supports_cod: false, sort_order: 4 },
  { code: 'manual_shipping', name: 'Pengiriman Manual', description: 'Kesepakatan pengiriman manual antara penjual dan pembeli', is_active: true, requires_courier: false, requires_tracking_number: false, requires_manual_fee: true, supports_cod: false, sort_order: 5 }
];

const externalProviders = [
  { code: 'jne', name: 'JNE', description: 'Jalur Nugraha Ekakurir', is_active: true, sort_order: 1 },
  { code: 'jnt', name: 'J&T', description: 'J&T Express', is_active: true, sort_order: 2 },
  { code: 'sicepat', name: 'SiCepat', description: 'SiCepat Ekspres', is_active: true, sort_order: 3 },
  { code: 'pos', name: 'POS Indonesia', description: 'POS Indonesia', is_active: true, sort_order: 4 },
  { code: 'tiki', name: 'TIKI', description: 'Titipan Kilat', is_active: true, sort_order: 5 },
  { code: 'lainnya', name: 'Lainnya', description: 'Jasa pengiriman lainnya', is_active: true, sort_order: 6 }
];

const serviceTypes = [
  { code: 'marketplace_delivery', name: 'Marketplace Delivery', description: 'Pengiriman barang belanjaan marketplace', is_active: true, requires_passenger_safety: false, requires_driver_verification: true, sort_order: 1 },
  { code: 'package_delivery', name: 'Antar Barang / Paket', description: 'Kirim paket kilat, dokumen atau barang dagangan', is_active: true, requires_passenger_safety: false, requires_driver_verification: true, sort_order: 2 },
  { code: 'food_delivery', name: 'Antar Makanan & Belanja', description: 'Pesan makanan dari warung/kopsis atau pasar', is_active: true, requires_passenger_safety: false, requires_driver_verification: true, sort_order: 3 },
  { code: 'grocery_delivery', name: 'grocery_delivery', description: 'Belanja harian sayuran dan sembako', is_active: true, requires_passenger_safety: false, requires_driver_verification: true, sort_order: 4 },
  { code: 'errand', name: 'Titip Beli / Errand', description: 'Titip beli obat, bayar tagihan atau tugas serbaguna', is_active: true, requires_passenger_safety: false, requires_driver_verification: true, sort_order: 5 },
  { code: 'ride', name: 'Ojek / Antar Penumpang', description: 'Layanan ojek santri & ojek online', is_active: false, requires_passenger_safety: true, requires_driver_verification: true, sort_order: 6 }
];

async function seed() {
  console.log("Starting Supabase Seed process...");

  // 1. Seed delivery_zones
  for (const z of zones) {
    const { data, error } = await supabase
      .from('delivery_zones')
      .upsert(z, { onConflict: 'slug' })
      .select('id, name');
    
    if (error) {
      console.error(`Error seeding zone ${z.name}:`, error.message);
    } else {
      console.log(`Seeded zone: ${z.name}`);
    }
  }

  // 2. Seed shipping_methods
  for (const sm of shippingMethods) {
    const { error } = await supabase
      .from('shipping_methods')
      .upsert(sm, { onConflict: 'code' });
    
    if (error) {
      console.error(`Error seeding shipping method ${sm.name}:`, error.message);
    } else {
      console.log(`Seeded shipping method: ${sm.name}`);
    }
  }

  // 3. Seed external_shipping_providers
  for (const ep of externalProviders) {
    const { error } = await supabase
      .from('external_shipping_providers')
      .upsert(ep, { onConflict: 'code' });
    
    if (error) {
      console.error(`Error seeding provider ${ep.name}:`, error.message);
    } else {
      console.log(`Seeded provider: ${ep.name}`);
    }
  }

  // 4. Seed service_types
  for (const st of serviceTypes) {
    const { error } = await supabase
      .from('service_types')
      .upsert(st, { onConflict: 'code' });
    
    if (error) {
      console.error(`Error seeding service type ${st.name}:`, error.message);
    } else {
      console.log(`Seeded service type: ${st.name}`);
    }
  }

  // 5. Seed logistics_settings
  const settings = [
    { key: 'cod_settings', value: { enabled: true, max_amount: 500000, cod_fee: 3000, allowed_zone_ids: [] }, description: 'Pengaturan Cash on Delivery (COD) global' },
    { key: 'ride_settings', value: { enabled: false, requires_safety_verified: true, max_passengers: 1, helmet_required: true }, description: 'Pengaturan layanan Ojek / Antar Orang' }
  ];

  for (const s of settings) {
    const { error } = await supabase
      .from('logistics_settings')
      .upsert(s, { onConflict: 'key' });
    
    if (error) {
      console.error(`Error seeding logistics settings ${s.key}:`, error.message);
    } else {
      console.log(`Seeded logistics setting: ${s.key}`);
    }
  }

  // 6. Seed delivery_fare_rules
  console.log("Fetching zones and service types to build fare rules...");
  const { data: stData } = await supabase.from('service_types').select('id, code');
  const { data: zData } = await supabase.from('delivery_zones').select('id, slug');

  if (stData && zData) {
    console.log(`Retrieved ${stData.length} service types and ${zData.length} zones.`);
    for (const st of stData) {
      for (const z of zData) {
        const baseFare = st.code === 'ride' ? 6000 : (st.code === 'food_delivery' ? 5000 : 8000);
        const perKmFare = st.code === 'ride' ? 2000 : (st.code === 'food_delivery' ? 2000 : 2500);
        const minFare = st.code === 'ride' ? 8000 : (st.code === 'food_delivery' ? 7000 : 10000);
        
        const rule = {
          service_type_id: st.id,
          zone_id: z.id,
          base_fare: baseFare,
          per_km_fare: perKmFare,
          minimum_fare: minFare,
          platform_fee: 1000,
          courier_commission_percentage: 80,
          platform_commission_percentage: 20,
          is_active: true
        };

        const { error } = await supabase
          .from('delivery_fare_rules')
          .upsert(rule, { onConflict: 'service_type_id,zone_id' });

        if (error) {
          // If upsert fails due to missing unique index on (service_type_id, zone_id), let's fall back to standard check and insert
          // console.log(`Upsert direct failed for ST:${st.code} Z:${z.slug}, trying fallback...`);
          const { data: existing } = await supabase
            .from('delivery_fare_rules')
            .select('id')
            .eq('service_type_id', st.id)
            .eq('zone_id', z.id)
            .maybeSingle();

          if (!existing) {
            const { error: insErr } = await supabase
              .from('delivery_fare_rules')
              .insert(rule);
            if (insErr) {
              console.error(`Failed to insert fare rule:`, insErr.message);
            }
          }
        }
      }
    }
    console.log("Successfully seeded delivery fare rules!");
  }

  console.log("Supabase seed operation completed!");
}

seed();
