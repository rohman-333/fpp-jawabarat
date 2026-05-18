# FPP JAWABARAT - Platform Digital Pesantren Jawa Barat

Platform digital untuk pendataan, sinergi program, forum komunitas, dan marketplace pesantren di seluruh Jawa Barat. Dibangun menggunakan Next.js (App Router), Tailwind CSS, shadcn/ui, dan Supabase.

## Supabase Database Setup

Sistem ini membutuhkan setup database Supabase yang benar agar semua fitur (Auth, Profiles, Marketplace, Pesantren) berjalan dengan baik. Terdapat 2 opsi untuk mengatur database, tergantung kondisi project Supabase Anda:

### Opsi 1: Setup untuk Database Kosong (Proyek Baru)
Jika Anda baru membuat proyek Supabase dan databasenya masih kosong (belum ada tabel `profiles` atau tabel buatan sendiri), jalankan file schema lengkap:
1. Buka Supabase Dashboard > SQL Editor
2. Copy seluruh isi file `supabase/schema.sql`
3. Paste di SQL Editor dan jalankan (Run).

### Opsi 2: Patch Database yang Sudah Ada (Penting!)
Jika Anda mendapatkan error `relation "profiles" already exists` atau sebelumnya sudah membuat tabel secara manual, JANGAN jalankan `schema.sql`. Gunakan file migrasi yang dirancang khusus agar aman (idempotent):
1. Buka Supabase Dashboard > SQL Editor
2. Copy seluruh isi file `supabase/migrations/001_patch_existing_database.sql`
3. Paste di SQL Editor dan jalankan (Run).

*File migrasi `001_patch_existing_database.sql` akan secara otomatis menambahkan kolom-kolom yang belum ada (seperti `avatar_url`, `pesantren_id`, dll), membuat tabel baru yang kurang, dan memperbaiki Trigger Auth serta RLS Policy tanpa menghapus data Anda yang sudah ada.*

### Opsi 3: Update Fitur Baru (Storage, Marketplace, Social Feed)
Seiring perkembangan aplikasi, terdapat fitur-fitur baru yang memerlukan update struktur database. Jalankan file migrasi berikut secara berurutan di Supabase SQL Editor jika Anda belum melakukannya:
1. `supabase/migrations/002_storage_pesantren.sql` (Untuk bucket storage gambar)
2. `supabase/migrations/003_marketplace_products.sql` (Untuk perbaikan skema Marketplace)
3. `supabase/migrations/004_social_feed.sql` (Untuk skema ekosistem Unified Social Feed)

*Semua file migrasi di atas bersifat **idempotent**, artinya aman dijalankan berulang kali tanpa khawatir merusak data yang sudah ada.*
## Getting Started

1. Copy `.env.example` menjadi `.env.local` dan isi URL serta Anon Key Supabase Anda.
2. Jalankan development server:

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) dengan browser Anda.

## Arsitektur & Fitur Utama
- **Public Area**: Landing Page, Direktori Pesantren, Marketplace Eksternal, Forum Komunitas.
- **Member Dashboard**: Pengelolaan profil pesantren, tambah produk marketplace, buat topik forum.
- **Admin Dashboard**: Verifikasi pendaftaran pesantren, moderasi forum, dan laporan statistik.

## Panduan Deployment (GitHub & Vercel)

Karena aplikasi menggunakan Next.js (App Router), Vercel adalah platform terbaik untuk production deployment.

### 1. Push ke GitHub
Pertama, simpan seluruh kode Anda ke repository GitHub:
```bash
git init
git add .
git commit -m "Initial commit FPP JAWABARAT production ready"
git branch -M main
# Ganti URL di bawah dengan URL repository GitHub Anda
git remote add origin https://github.com/username/fpp-jawabarat.git
git push -u origin main
```

### 2. Deploy ke Vercel
1. Buka [Vercel](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik **Add New...** > **Project**.
3. Import repository `fpp-jawabarat` yang baru saja Anda push.
4. Di bagian **Environment Variables**, tambahkan ketiga variabel dari `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL` = (URL Supabase Anda)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Anon Key Supabase Anda)
   - `NEXT_PUBLIC_SITE_URL` = (URL Vercel Anda setelah domain terbentuk, atau isi sementara dengan sembarang URL lalu update nanti)
5. Klik **Deploy** dan tunggu proses build selesai. Vercel secara otomatis akan menjalankan perintah `npm run build`.

### 3. Konfigurasi Auth Redirect Supabase (Wajib)
Setelah Vercel memberikan URL/domain (contoh: `https://fpp-jawabarat.vercel.app`), Anda **wajib** mendaftarkan domain tersebut di Supabase agar fitur Login/Register berfungsi.

1. Buka Supabase Dashboard > Authentication > URL Configuration.
2. Pada bagian **Site URL**, masukkan URL utama Vercel Anda (contoh: `https://fpp-jawabarat.vercel.app`).
3. Pada bagian **Redirect URLs**, tambahkan URL callback:
   - `https://fpp-jawabarat.vercel.app/auth/callback`
   - `https://fpp-jawabarat.vercel.app/**` (opsional untuk wildcard)
4. Update juga environment variable `NEXT_PUBLIC_SITE_URL` di Vercel dengan domain tersebut.
5. Selesai! Platform FPP JAWABARAT sudah *live* dan siap digunakan.
