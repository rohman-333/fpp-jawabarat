# Panduan Migrasi FPP JAWABARAT

Sistem ini digunakan untuk memigrasikan data pengguna dan pesantren dari website lama (PHP/Hostinger) ke Supabase.

## 1. Export Data dari Hostinger
1. Login ke panel **Hostinger**.
2. Buka **phpMyAdmin**.
3. Pilih database lama Anda.
4. Export tabel `users` (atau nama tabel user lama Anda) ke format **CSV**. Beri nama `users.csv`.
5. Export tabel `pesantren` (atau nama tabel pesantren lama Anda) ke format **CSV**. Beri nama `pesantren.csv`.
*Pastikan format CSV menggunakan koma (`,`) sebagai pemisah, dan baris pertama adalah header (nama kolom).*

## 2. Persiapan File
1. Taruh `users.csv` dan `pesantren.csv` di folder `migration/data/`.
2. Salin `.env.migration.example` menjadi `.env.migration`.
3. Isi variabel di dalam `.env.migration`:
   - `SUPABASE_URL`: URL project Supabase Anda.
   - `SUPABASE_SERVICE_ROLE_KEY`: Key `service_role` dari Supabase (Cari di Project Settings -> API). **JANGAN PERNAH MEMBERIKAN KEY INI KE FRONTEND**.
   - `DEFAULT_TEMP_PASSWORD`: Password sementara untuk semua user yang dimigrasi (misal: `FppJabar2026!`).

## 3. Sesuaikan Mapping
Buka `migration/mapping.ts` dan sesuaikan nama-nama properti di sebelah KANAN dengan nama kolom header yang ada di file CSV Anda.
Misalnya, jika di tabel lama kolom email bernama `user_email`, maka ubah menjadi:
`email: row.user_email`

## 4. Matikan Trigger (SANGAT PENTING)
Supabase memiliki trigger otomatis yang membuat profil tiap ada user baru. Ini dapat menyebabkan error `500 unexpected_failure` saat skrip mencoba membuat ratusan user secara berurutan.

**Sebelum** menjalankan skrip, jalankan SQL ini di **SQL Editor Supabase**:
```sql
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
```
*(Atau Anda bisa meng-copy isi dari `migration/sql/disable_trigger.sql`)*

## 5. Eksekusi Script Migrasi
Buka terminal dan jalankan perintah berikut di root project:

```bash
npm run migrate:legacy
```

Untuk test satu user:
```bash
npm run migrate:legacy -- --only-email email_target@gmail.com
```

*Catatan: Script ini idempoten (aman dijalankan berulang). Jika script terhenti di tengah jalan, Anda bisa menjalankannya lagi tanpa takut terjadi duplikasi.*

## 6. Nyalakan Kembali Trigger (SANGAT PENTING)
Setelah migrasi selesai (100% success), **wajib** nyalakan kembali trigger agar user yang mendaftar manual dari website bisa mendapatkan profil secara otomatis.

Jalankan SQL ini di **SQL Editor Supabase**:
```sql
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```
*(Atau copy isi dari `migration/sql/enable_trigger.sql`)*

## 7. Verifikasi
1. Cek dashboard Supabase -> **Authentication** -> **Users**. Pastikan user lama sudah masuk.
2. Cek dashboard Supabase -> **Table Editor** -> **profiles**.
3. Cek dashboard Supabase -> **Table Editor** -> **pesantren**.

Password lama (hash bcrypt/md5 lama) diabaikan. User lama login dengan email mereka dan password `DEFAULT_TEMP_PASSWORD`, lalu diminta untuk reset password atau ubah profil nantinya.
