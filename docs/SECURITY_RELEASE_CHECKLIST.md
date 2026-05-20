# Checklist Kemanan Rilis (Security Release Checklist)
## WIBAWA NUSANTARA

Dokumen ini berisi daftar audit keamanan wajib untuk memastikan tidak ada kunci rahasia (secrets), API key, token, atau berkas kredensial sensitif yang bocor ke repositori Git publik maupun dapat diakses oleh pengguna dari sisi client browser.

---

## 🔒 1. Hasil Audit Kredensial & Secrets

Seluruh berkas kode sumber (source code), skrip migrasi, aset publik, dan dokumentasi telah diaudit secara menyeluruh menggunakan pencarian pola regex sensitif:

* **Midtrans Server Key (`MIDTRANS_SERVER_KEY`)**: `BERSIH`
  * Hanya diakses melalui variabel lingkungan `process.env.MIDTRANS_SERVER_KEY` pada *API route handlers* di sisi server.
  * Tidak ada kunci mentah (`SB-Mid-server-...` atau `Mid-server-...`) yang tertulis langsung dalam kode.
* **Midtrans Client Key (`NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`)**: `BERSIH`
  * Menggunakan environment variable `process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` dengan fallback string penampung yang aman (`'SB-Mid-client-placeholder'`).
* **Supabase Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)**: `BERSIH`
  * Terisolasi sepenuhnya di sisi server (`lib/supabase/admin.ts`).
  * Tidak pernah terekspos ke komponen bertanda `'use client'`.
* **Kunci & Sertifikat Android**: `BERSIH`
  * Berkas `.keystore`, `.jks`, `.pem`, `signing.properties`, dan `key.properties` diabaikan sepenuhnya dari Git.

---

## ⚠️ 2. Panduan Kepatuhan Gitignore
Pastikan berkas `.gitignore` Anda di root project berisi aturan penolakan berikut untuk mencegah kebocoran tidak disengaja di masa mendatang:

```txt
# env files
.env
.env.*
!.env.example
.env.migration

# vercel
.vercel

# Android keys & credentials secrets
*.pem
*.key
*.jks
*.keystore
signing.properties
key.properties
```

---

## 🔄 3. Instruksi Manual Penutupan Alert GitHub (Secret Rotation)

Jika Anda menerima notifikasi **GitHub Secret Scanning Alert** ("Possible valid secrets detected"), lakukan tindakan tanggap berikut segera:

### Langkah A: Rotasi Kunci di Dashboard Midtrans
1. Masuk ke **[Dashboard Midtrans](https://dashboard.midtrans.com/)**.
2. Masuk ke menu **Settings -> Access Keys**.
3. Cari bagian **Server Key** lalu klik tombol **Regenerate / Roll Key**.
4. Salin kunci server baru tersebut.

### Langkah B: Perbarui Environment Variables Vercel
1. Masuk ke panel proyek Anda di **[Dashboard Vercel](https://vercel.com/)**.
2. Masuk ke menu **Settings -> Environment Variables**.
3. Cari variabel `MIDTRANS_SERVER_KEY` dan perbarui nilainya dengan Server Key baru yang telah di-regenerate.
4. Simpan perubahan.

### Langkah C: Tutup Alert GitHub
1. Buka halaman **Security tab -> Secret scanning alerts** di repositori GitHub Anda.
2. Pilih alert terkait kunci Midtrans yang terdeteksi.
3. Klik tombol **Dismiss Alert** di kanan atas.
4. Pilih alasan pencabutan: **Revoked (Kunci telah dicabut/di-rotate)**.

### Langkah D: Pemicu Ulang Deploy (Redeploy)
1. Kembali ke dashboard Vercel proyek Anda.
2. Masuk ke tab **Deployments**.
3. Pilih deployment teratas, klik titik tiga di kanan, lalu pilih **Redeploy** (centang *Bypass Cache* jika ada) agar environment variable baru dimuat sepenuhnya di server Next.js.
