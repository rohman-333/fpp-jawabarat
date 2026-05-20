# Checklist Verifikasi Migrasi Database Produksi
## WIBAWA NUSANTARA

Dokumen ini berisi daftar urutan migrasi, query pengujian struktur tabel, audit kebijakan RLS (Row-Level Security), serta perintah pemuatan ulang skema API Supabase PostgREST setelah migrasi dilakukan.

---

## 🚀 1. Urutan Eksekusi Skrip Migrasi (Wajib)

Pastikan migrasi berikut telah dieksekusi secara bertahap pada SQL Editor Supabase Anda:

1. **`045_fix_cart_checkout_orders.sql`**: Memperbaiki relasi tabel belanja, checkout, dan menambahkan kolom invoice serta status pembayaran.
2. **`046_add_to_cart_rpc.sql`**: Mengompilasi fungsi RPC atomik `add_to_cart_v2` untuk mencegah galat indeks unik duplikat.
3. **`047_courier_zones_delivery_services.sql`**: Membuat skema zonasi wilayah operasional, aturan tarif ongkir, profil kurir, pengantaran logistik, dan buku besar payout wallet.
4. **`048_midtrans_payment_gateway.sql`**: Membuat tabel snap log, payload callback webhooks, dan konfigurasi metode pembayaran instan online.

---

## 🔍 2. Kumpulan Query Pengujian Kesiapan Struktur Tabel

Jalankan query SQL berikut di **Supabase SQL Editor** untuk memverifikasi bahwa seluruh tabel terpasang sempurna:

```sql
-- Cek Keberadaan Seluruh Tabel Utama
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'cart_items',
    'orders',
    'order_items',
    'payment_confirmations',
    'payment_methods',
    'payment_transactions',
    'payment_callback_logs',
    'service_types',
    'delivery_zones',
    'delivery_fare_rules',
    'courier_profiles',
    'deliveries',
    'courier_wallet_transactions'
  );
```

---

## 🛡️ 3. Query Verifikasi Kebijakan RLS (Row-Level Security)

Pastikan semua tabel terlindungi secara ketat dengan RLS aktif:

```sql
-- Cek Status RLS pada Seluruh Tabel Rilis Baru
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'payment_transactions',
    'payment_callback_logs',
    'deliveries',
    'courier_profiles',
    'courier_wallet_transactions'
  );
```

---

## 🌱 4. Query Verifikasi Seed Data Awal

Pastikan data parameter konfigurasi awal (seperti metode bayar dan tipe layanan) telah terisi:

```sql
-- Cek Pilihan Metode Pembayaran Aktif
SELECT code, name, provider, is_active FROM public.payment_methods;

-- Cek Tipe Layanan Multi-Service Mobilitas
SELECT code, name, is_active FROM public.service_types;
```

---

## 🔄 5. Instruksi Pembersihan Cache Skema API (Reload PostgREST)

> [!IMPORTANT]
> Kadang kala Supabase / PostgREST tidak langsung mendeteksi perubahan kolom baru dari ALTER TABLE, menyebabkan galat `404 Column not found` pada client Next.js.
> Jalankan perintah berikut di SQL Editor untuk memaksa PostgREST memuat ulang definisi skema secara instan:

```sql
NOTIFY pgrst, 'reload schema';
```
*(Tidak mengembalikan data, melainkan memicu pembersihan cache skema internal Supabase secara aman).*
