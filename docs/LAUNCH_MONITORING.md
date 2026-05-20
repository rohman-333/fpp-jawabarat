# Pedoman Observabilitas & Pemantauan Rilis (Launch Monitoring)
## WIBAWA NUSANTARA

Dokumen ini berisi panduan teknis bagi tim pengembang untuk memantau runtime server, kesehatan database Supabase, keandalan callback webhook Midtrans, penanganan masalah umum, serta rencana mitigasi darurat (rollback) saat peluncuran production.

---

## 📊 1. Portal Pemantauan Utama (Observability Ports)

### A. Vercel Serverless Logs
* **Fungsi**: Memantau kegagalan API routes, error server, dan response time (latency).
* **Akses**: Masuk ke **[Vercel Dashboard](https://vercel.com/) -> Proyek Anda -> Logs Tab**.
* **Filter Khusus**:
  * `[CHECKOUT_ERROR]`: Kegagalan pembuatan tagihan pesanan pembeli.
  * `[PAYMENT_ERROR]`: Error pembuatan Snap token atau penulisan transaksi.
  * `[MIDTRANS_WEBHOOK_ERROR]`: Kegagalan verifikasi signature atau update status otomatis.

### B. Supabase Performance Metrics
* **Fungsi**: Memantau API throughput, active db connections, CPU usage, dan queries lambat.
* **Akses**: Buka **[Supabase Console](https://supabase.com/) -> Project Settings -> Database -> Database Health / API Logs**.
* **Filter Khusus**: Cari queries lambat pada public schema atau trigger auth.

### C. Midtrans Webhook Callback Logs
* **Fungsi**: Memverifikasi pengiriman webhook dari server Midtrans ke server Next.js.
* **Akses**: Buka **[Dashboard Midtrans](https://dashboard.midtrans.com/) -> Developer -> Webhook Callback Log**.
* **Indikator**: Pastikan status code pengiriman adalah `200 OK` (menandakan respons sukses dari `/api/payments/midtrans/webhook`).

---

## 🛠️ 2. Masalah Umum & Solusinya

### A. Galat Signature Webhook Gagal (`[MIDTRANS_WEBHOOK_ERROR] Signature Mismatch`)
* **Penyebab**: Perbedaan perhitungan Server Key atau parameter string antara Midtrans dan server.
* **Solusi**:
  1. Pastikan `MIDTRANS_SERVER_KEY` di Vercel sama persis dengan yang tertera di Dashboard Midtrans.
  2. Pastikan urutan penyusunan string signature adalah `order_id + status_code + gross_amount + server_key`.

### B. Kolom/Tabel Baru Tidak Terdeteksi (`PostgREST 404`)
* **Penyebab**: Cache API server Supabase belum memuat ulang perubahan ALTER TABLE yang baru saja dieksekusi.
* **Solusi**: Jalankan SQL `NOTIFY pgrst, 'reload schema';` pada editor SQL Supabase.

### C. Gagal Upload Gambar Resolusi Tinggi (`[UPLOAD_ERROR]`)
* **Penyebab**: Ukuran file melampaui batas maksimum request body serverless function (maks. 4.5MB di Vercel).
* **Solusi**: Pastikan kompresor gambar di sisi client ([`lib/media/compressImage.ts`](file:///c:/Users/ASUS/Documents/fpp-jawabarat/lib/media/compressImage.ts)) aktif mengecilkan dimensi dan resolusi gambar sebelum memicu upload.

---

## 🚨 3. Rencana Mitigasi Darurat (Rollback Plan)

Apabila terjadi kegagalan fatal pada versi rilis terbaru yang menyebabkan aplikasi tidak dapat digunakan secara luas (critical crash):

1. **Rollback Deployment Vercel**:
   * Buka **Vercel -> Deployments**.
   * Cari versi stabil sebelumnya (versi sebelum hardening release candidate).
   * Klik titik tiga pada deployment stabil tersebut, pilih **Promote to Production** untuk mengembalikan versi live secara instan dalam 3 detik tanpa downtime.
2. **Matikan Fitur Bermasalah (Feature Flags)**:
   * Jika gateway Midtrans atau courier service bermasalah, ubah parameter environment:
     * `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=""` (Menyebabkan aplikasi otomatis menyembunyikan opsi Pembayaran Online dan mengalihkan pembeli sepenuhnya ke manual bank transfer).
     * Ubah status `service_types` ride/ojek menjadi `is_active = false` di database untuk mematikan layanan dari pandangan publik secara real-time.
