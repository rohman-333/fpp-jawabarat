# Checklist Pengujian Manual APK / HP (QA Device Checklist)
## WIBAWA NUSANTARA

Dokumen ini berisi panduan pengujian end-to-end (E2E) bagi tim jaminan kualitas (QA) menggunakan perangkat HP Android fisik asli setelah aplikasi dibungkus menjadi APK untuk memastikan kestabilan performa mobile, responsivitas layout, dan kelancaran fitur.

---

## 📱 Tahapan Pengujian Perangkat Fisik (Step-by-Step)

### 🏁 1. Pemasangan & Splash Screen
- [ ] Unduh dan pasang berkas `app-release-signed.apk` di HP Anda.
- [ ] Buka aplikasi. Pastikan tidak ada address bar browser (berjalan standalone 100% fullscreen).
- [ ] Pastikan Splash Screen Sapphire Blue (`#0F52BA`) muncul dengan logo memusat proporsional.

### 🔑 2. Login, Registrasi, & Sesi
- [ ] Coba masuk menggunakan akun demo pengujian.
- [ ] Pastikan input email/password terisi lancar tanpa crash keyboard Android.
- [ ] Pastikan PWA install prompt **TIDAK MUNCUL** saat berada di dalam aplikasi TWA/APK ini.

### 📰 3. Feed Sosial & Publikasi Media
- [ ] Buka menu Feed. Pastikan layout pas 100vw tanpa horizontal scroll (tidak goyang ke kanan-kiri).
- [ ] Klik kolom input status, ketik status teks pendek, lalu posting.
- [ ] Unggah foto/video menggunakan galeri HP. Pastikan kompresi client-side berjalan lancar dan menampilkan progress bar unggah yang responsif.
- [ ] Klik posting menggunakan kamera HP. Pastikan permission kamera aktif dan gambar terunggah aman.
- [ ] Uji tombol **Laporkan Posting** dan **Sembunyikan Posting** dari dropdown pojok kanan postingan.

### 🛍️ 4. Marketplace & Keranjang Belanja (Cart)
- [ ] Buka menu Marketplace dari Bottom Nav.
- [ ] Klik salah satu kartu produk. Pastikan tidak terjadi galat 404.
- [ ] Klik link nama toko/seller. Pastikan mengarah ke profil toko dengan lancar (tanpa 404).
- [ ] Klik **Tambah ke Keranjang** pada produk A.
- [ ] Klik kembali **Tambah ke Keranjang** pada produk A yang sama. Buka halaman `/cart`. Pastikan kuantitas berubah menjadi **2**, dan **TIDAK ADA** error "duplicate key" database yang bocor ke layar pengguna.
- [ ] Coba edit kuantitas (+ / -) di keranjang, pastikan subtotal terupdate real-time.
- [ ] Uji hapus item dari keranjang belanja.

### 💳 5. Checkout & Gerbang Pembayaran
- [ ] Jalankan checkout keranjang. Pilih zona operasional kurir pengiriman.
- [ ] Pastikan ongkir otomatis terhitung dan subtotal tagihan bertambah proporsional.
- [ ] Selesaikan order. Buka halaman detail pembayaran.
- [ ] **Uji Jalur Manual:**
  - Pilih Transfer Manual.
  - Unggah foto bukti transfer bank.
  - Masuk ke dashboard admin, pastikan status transfer tersebut muncul di tab **Verifikasi Transfer Manual**.
  - Klik **Setujui** menggunakan modal verifikasi baru (bukan alert default browser).
  - Pastikan status pesanan berubah menjadi *Processing* secara otomatis.
- [ ] **Uji Jalur Online (Midtrans):**
  - Pilih Pembayaran Instan.
  - Klik bayar. Pastikan Snap SDK memunculkan gerbang simulasi (QRIS/VA) secara instan.
  - Selesaikan simulasi lunas di simulator Midtrans.
  - Pastikan pesanan terupdate lunas secara instan via webhook.

### 🛵 6. Kurir & Multi-Service Logistik
- [ ] Daftarkan akun kurir baru dari menu kemitraan di dashboard.
- [ ] Approve kurir tersebut dari panel admin.
- [ ] Masuk ke menu Kurir, nyalakan status menjadi **Online**.
- [ ] Buka pesanan lunas tadi, assign tugas pengantaran ke kurir tersebut.
- [ ] Pastikan kurir menerima tugas baru di HP, mengklik *Accept*, dan memperbarui status perjalanan:
  - *Menuju Lokasi Toko* -> *Barang Diambil* -> *Dalam Perjalanan* -> *Sampai Tujuan*.
- [ ] Pastikan saldo wallet kurir bertambah sesuai komisi tarif jarak operasional.

### 💬 7. Chat Diskusi Real-time
- [ ] Buka halaman pesanan belanja atau produk. Klik **Hubungi Seller**.
- [ ] Kirim pesan obrolan. Pastikan pesan terkirim secara instan menggunakan WebSocket realtime.
- [ ] Buka akun seller penerima. Pastikan pesan masuk dengan indikator notifikasi merah menyala.

### 🔄 8. Tombol Back Hardware Android
- [ ] Buka postingan detail feed atau halaman produk.
- [ ] Tekan tombol **Back** fisik/gestur pada HP Android Anda.
- [ ] Pastikan aplikasi kembali ke halaman feed utama (bukan keluar dari aplikasi secara aneh).
- [ ] Buka modal Zoom Slip bukti bayar atau modal report, tekan tombol Back. Pastikan modal tertutup terlebih dahulu tanpa merusak navigasi halaman utama.
