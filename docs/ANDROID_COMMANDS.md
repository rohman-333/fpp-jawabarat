# Rencana Command Android APK - WIBAWA NUSANTARA

Dokumen ini berisi kumpulan command opsional yang dapat dijalankan di masa depan untuk membungkus PWA menjadi APK. **Catatan: Jangan jalankan command ini sekarang sebelum web inti benar-benar stabil.**

---

## 🏗️ OPSI A: Build dengan Bubblewrap (TWA)

Bubblewrap adalah tool CLI dari Google untuk mengonversi PWA menjadi APK secara langsung tanpa menulis kode Java.

### 1. Install Bubblewrap CLI secara Global
```bash
npm install -g @bubblewrap/cli
```

### 2. Inisialisasi Proyek Android dari PWA Manifest
Arahkan terminal ke direktori folder baru di luar folder web, lalu jalankan:
```bash
bubblewrap init --manifest=https://wibawa-nusantara-domain.com/manifest.webmanifest
```
- Tool akan otomatis mendownload Android SDK jika belum terpasang.
- Mengisi nama aplikasi, nama ikon, dan package ID (`com.wibawanusantara.app`).

### 3. Kompilasi APK & AAB Rilis
```bash
bubblewrap build
```
- Command ini akan menghasilkan file `app-release-signed.apk` (untuk testing) dan `app-release-bundle.aab` (untuk diupload ke Play Store).

---

## 📲 OPSI B: Build dengan Capacitor (Native Shell)

Capacitor cocok jika aplikasi membutuhkan plugin native kompleks.

### 1. Install Core Dependencies (Jangan dijalankan dulu)
```bash
npm install @capacitor/core @capacitor/cli
```

### 2. Inisialisasi Capacitor
```bash
npx cap init "WIBAWA NUSANTARA" "com.wibawanusantara.app" --web-dir=out
```

### 3. Tambahkan Platform Android
```bash
npm install @capacitor/android
npx cap add android
```

### 4. Ekspor Next.js Statis & Sinkronisasi Assets
Sesuaikan konfigurasi `next.config.js` untuk static export (`output: 'export'`), jalankan build, kemudian salin hasilnya ke Android assets:
```bash
npm run build
npx cap sync
```

### 5. Jalankan Android Studio untuk Kompilasi Final
```bash
npx cap open android
```
- Command ini membuka folder Android secara otomatis di Android Studio Anda untuk melakukan penandatanganan (signing) keystore dan build APK/AAB secara visual.
