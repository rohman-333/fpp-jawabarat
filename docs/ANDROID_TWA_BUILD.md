# Panduan Build Android APK & AAB menggunakan Google Bubblewrap (TWA)
## WIBAWA NUSANTARA

Dokumen ini menjelaskan cara membungkus aplikasi web PWA **WIBAWA NUSANTARA** menjadi file **APK** (untuk pengujian) dan **AAB** (untuk diunggah ke Google Play Store) secara efisien dan cepat tanpa membutuhkan Android Studio penuh.

---

## 🛠️ A. Persiapan Awal Sistem

Pastikan sistem lokal Anda telah terpasang:
1. **Node.js** (v18 ke atas recommended).
2. **Java Development Kit (JDK 17)** terkonfigurasi pada path environment `JAVA_HOME`.
3. **Android Command Line Tools / SDK** terkonfigurasi pada path `ANDROID_HOME`.

---

## 🚀 B. Langkah-Langkah Build APK

### 1. Buat folder terpisah di lokal Anda
Buat folder khusus untuk menyimpan konfigurasi build Android agar bersih:
```bash
mkdir android-twa
cd android-twa
```

### 2. Instal Bubblewrap CLI secara Global
Pasang kakas bantu resmi Google untuk TWA secara global:
```bash
npm install -g @bubblewrap/cli
```

### 3. Inisialisasi Project Android dari Manifest Web
Bubblewrap akan secara otomatis mengunduh konfigurasi, logo, warna tema, dan icon langsung dari PWA Anda:
```bash
bubblewrap init --manifest=https://www.wibawa-nusantara.com/manifest.webmanifest
```

### 4. Konfigurasi Parameter Aplikasi
Ketika inisialisasi berjalan, Bubblewrap akan menanyakan beberapa konfigurasi penting. Isi dengan panduan berikut:
* **Application name**: `WIBAWA NUSANTARA`
* **Launcher name**: `WIBAWA`
* **Package ID**: `com.wibawanusantara.app`
* **Host**: `www.wibawa-nusantara.com`
* **Start URL**: `/`
* **Display**: `standalone`
* **Orientation**: `portrait`
* **Theme color**: `#0F52BA`
* **Background color**: `#FFFFFF`

---

## 🔐 C. Pembuatan Keystore & Build Package

### 1. Buat Kunci Penandatanganan (Signing Keystore)
Jika Anda belum memiliki file keystore penandatanganan:
* Bubblewrap akan menawarkan untuk membuatkan file `.keystore` baru secara otomatis selama wizard inisialisasi.
* Isi sandi, nama lengkap, unit, organisasi, dan kota Anda.
* **PENTING**: Simpan file `.keystore` dan password tersebut di tempat yang sangat aman! Jangan pernah meng-commit-nya ke repositori Git.

### 2. Jalankan Build Package
Untuk memicu pembuatan APK pengujian dan AAB produksi:
```bash
bubblewrap build
```

Setelah build berhasil, folder `android-twa` Anda akan berisi:
* `app-release-signed.apk` (Siap di-install langsung di HP Android Anda).
* `app-release-bundle.aab` (Siap diunggah ke Konsol Google Play Store).

---

## 🔒 D. Pengabaian File Keystore (.gitignore)
Tambahkan entri berikut pada file `.gitignore` root Anda untuk mencegah kebocoran sertifikat:

```txt
# Android signing secrets
*.jks
*.keystore
signing.properties
key.properties
```
