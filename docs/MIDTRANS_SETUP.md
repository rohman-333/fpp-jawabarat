# Panduan Integrasi Midtrans Payment Gateway
## WIBAWA NUSANTARA (Next.js & Supabase)

Dokumen ini berisi petunjuk lengkap untuk mengonfigurasi Midtrans dalam mode **Sandbox (Pengujian)** maupun beralih ke mode **Production (Live)** secara aman.

---

## 🔑 A. Konfigurasi Environment Variables

Tambahkan variabel berikut pada file `.env.local` lokal Anda dan pastikan juga terdaftar di **Dashboard Vercel Settings -> Environment Variables**:

```env
# Mode Pengaktifan (false = Sandbox, true = Production)
MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false

# Kredensial Akun Midtrans Anda
MIDTRANS_MERCHANT_ID="Gxxxxxxxxx"
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxxxxxxxxxxxxxxxxxx"

# Rahasia Validasi Opsional Webhook
MIDTRANS_NOTIFICATION_SECRET="sec_xxxxxxxxxxxxxxxxxxxx"

# URL Utama Aplikasi (Gunakan domain kustom Anda)
NEXT_PUBLIC_APP_URL="https://www.wibawa-nusantara.com"
NEXT_PUBLIC_SITE_URL="https://www.wibawa-nusantara.com"
```

> [!WARNING]
> Jangan pernah membagikan `MIDTRANS_SERVER_KEY` Anda di sisi client. Helper API server kami dirancang untuk membungkus komunikasi kunci secara rahasia dan aman.

---

## ⚙ B. Pengaturan Webhook (Notification URL)

Agar status pesanan pembeli terupdate secara otomatis dari `pending` menjadi `paid` (lunas) ketika pembayaran berhasil diselesaikan, Anda harus mengonfigurasi Notification URL di **Midtrans Dashboard**:

1. Masuk ke **[Dashboard Midtrans](https://dashboard.midtrans.com/)**.
2. Pilih mode **Sandbox** atau **Production** di kiri atas.
3. Masuk ke menu **Settings -> Payment**.
4. Cari bagian **Notification URL** dan isi dengan:
   ```txt
   https://www.wibawa-nusantara.com/api/payments/midtrans/webhook
   ```
5. Simpan pengaturan Anda.

---

## 🛠 C. Alur Pengujian Sandbox (Simulasi)

Untuk melakukan pengujian pembayaran tanpa memotong saldo/uang asli:

1. Pilih metode pembayaran **Pembayaran Instan** saat melakukan checkout atau di halaman detail pembayaran pesanan.
2. Salin nomor pembayaran Virtual Account atau bayar dengan simulasi QRIS.
3. Buka **[Midtrans Sandbox Simulator](https://sandbox.midtrans.com/generator)**.
4. Masukkan nomor VA, kode pembayaran, atau unggah QRIS yang disalin, lalu klik **Pay**.
5. Status pesanan akan otomatis terupdate menjadi **Lunas (Paid)**, delivery kurir otomatis dikirim, serta pembeli dan penjual akan langsung menerima notifikasi status.

---

## 🚀 D. Checklist Migrasi ke Mode Production (Live)

Ketika akun Midtrans Production Anda sudah disetujui dan aktif, ikuti checklist berikut untuk berpindah mode tanpa downtime:

- [ ] Masuk ke Midtrans Dashboard, ubah status ke **Production mode** di kiri atas.
- [ ] Buka menu **Settings -> Access Keys**, lalu salin:
  * Merchant ID
  * Production Client Key
  * Production Server Key
- [ ] Masuk ke Vercel Project Settings dan perbarui Environment Variables:
  * `MIDTRANS_IS_PRODUCTION=true`
  * `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=true`
  * Masukkan Production Server Key ke `MIDTRANS_SERVER_KEY`.
  * Masukkan Production Client Key ke `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`.
- [ ] Ubah Notification URL di Midtrans Production Dashboard menjadi URL webhook live Anda.
- [ ] Trigger **Redeploy** di Vercel agar perubahan env key teraplikasi sepenuhnya.
- [ ] Lakukan satu transaksi nominal kecil (misalnya Rp 10.000) menggunakan e-wallet asli untuk memastikan uang masuk ke settlement merchant akun Anda dan status webhook paid terpicu dengan sukses.
