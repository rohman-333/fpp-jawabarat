# Integrasi Lanjutan Android dengan Ionic Capacitor
## WIBAWA NUSANTARA

Dokumen ini menjelaskan opsi arsitektur alternatif menggunakan **Ionic Capacitor** jika di masa depan aplikasi **WIBAWA NUSANTARA** membutuhkan integrasi mendalam ke sensor fisik perangkat Android melampaui kemampuan standard PWA/TWA.

---

## 💡 1. Kapan Harus Beralih ke Capacitor?

Anda sebaiknya berpindah dari Bubblewrap (TWA) ke Capacitor jika aplikasi memerlukan:
* **Background Tasks Terjadwal**: Sinkronisasi data latar belakang yang ketat tanpa intervensi pengguna.
* **Kamera & Galeri Native SDK**: Akses langsung ke kamera perangkat dengan modul editor gambar native bawaan.
* **Penyimpanan Lokal Sangat Besar**: SQLite terenkripsi langsung di penyimpanan HP.
* **Push Notifications Native**: Integrasi SDK Firebase Cloud Messaging (FCM) secara mendalam (termasuk status bar badge).

---

## ⚠️ 2. Risiko & Tantangan Teknis Next.js (SSR)

Next.js secara default berjalan menggunakan **Server-Side Rendering (SSR)** dan Server Actions dinamis di server Vercel. Sedangkan Capacitor dirancang untuk memuat aset statis lokal (`static HTML/JS/CSS`).

### Solusi 1: Remote URL Configuration (Disarankan)
Capacitor dapat dikonfigurasi untuk langsung merender web remote live Vercel Anda di dalam WebView native:
```json
// capacitor.config.json
{
  "appId": "com.wibawanusantara.app",
  "appName": "WIBAWA",
  "webDir": "out",
  "server": {
    "url": "https://www.wibawa-nusantara.com",
    "cleartext": true
  }
}
```

### Solusi 2: Static Export (`next export`)
Mengekspor Next.js menjadi statis penuh (`output: 'export'`), namun ini mematikan Server Actions dinamis, middleware, dan ISR sehingga tidak disarankan untuk aplikasi sosial media kita.

---

## 🛠️ 3. Langkah-Langkah Integrasi Capacitor (Di Masa Depan)

Apabila Anda memutuskan bermigrasi, jalankan perintah berikut pada root project:

### 1. Pasang Dependensi Capacitor
```bash
npm install @capacitor/core @capacitor/cli
```

### 2. Inisialisasi Konfigurasi
```bash
npx cap init WIBAWA com.wibawanusantara.app --web-dir=out
```

### 3. Tambahkan Platform Android
```bash
npm install @capacitor/android
npx cap add android
```

### 4. Sinkronkan Aset & Kode
Setiap kali Anda merubah web dan menjalankan `npm run build`:
```bash
npx cap sync android
```

### 5. Jalankan Android Studio untuk Build
Membuka editor Gradle Android Studio secara otomatis untuk memicu build APK/AAB:
```bash
npx cap open android
```
* Dari Android Studio, pilih menu **Build -> Build Bundle(s) / APK(s) -> Build APK** untuk siap rilis.
