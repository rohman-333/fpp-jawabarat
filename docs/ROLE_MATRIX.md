# FPP JAWABARAT - Role Matrix & Authority System

Sistem otorisasi (role) di FPP JAWABARAT kini telah disederhanakan dari yang awalnya menggunakan `account_type` jamak (kiai, ustadz, dll) menjadi matriks peran berlapis (Role & Flags). Hal ini untuk mempermudah manajemen *database* dan kontrol akses UI.

## 1. System Roles (`role`)
Kolom utama yang menentukan level akses administratif seorang pengguna terhadap *platform*. Hanya ada 4 nilai baku:

| Role | Deskripsi | Akses Dashboard |
| :--- | :--- | :--- |
| `superadmin` | Pemilik platform/founder. Memiliki hak akses penuh tanpa batas ke seluruh data dan sistem. | `/admin/*` (Full Access) |
| `admin` | Tim operasional utama yang membantu `superadmin` mengurus moderasi, laporan, dsb. | `/admin/*` (Kecuali pengaturan kritis/keuangan) |
| `team` | Tim divisi fungsional spesifik (contoh: kurir, pesantren, marketplace, konten). Akses terbatas berdasarkan `team_division`. | `/admin/*` (Terbatas sesuai divisi) |
| `user` | Pengguna umum publik (Default untuk setiap pendaftar baru). | `/dashboard/*` (Sesuai flag/status) |

---

## 2. Capability Flags (Status/Label)
Fitur tambahan yang dimiliki seorang `user` (atau role lain) dikendalikan menggunakan kolom atribut independen (*flags*), BUKAN menambah role baru. 

| Flag / Kolom | Tipe | Nilai | Deskripsi Akses |
| :--- | :--- | :--- | :--- |
| `has_pesantren` | `boolean` | `true` / `false` | Membuka fitur pengelolaan profil Pesantren di dasbor. |
| `pesantren_id` | `uuid` | `UUID` / `null` | Menautkan profil user ke entitas Pesantren spesifik. |
| `is_seller` | `boolean` | `true` / `false` | Menandakan profil memiliki etalase toko. |
| `seller_status` | `text` | `none`, `pending`, `approved`, `rejected` | Jika `approved` dan `is_seller = true`, buka akses manajemen produk & order toko. |
| `is_courier` | `boolean` | `true` / `false` | Menandakan profil adalah mitra kurir. |
| `courier_status` | `text` | `none`, `pending`, `approved`, `rejected` | Jika `approved`, buka akses pelacakan dan daftar kiriman. |
| `team_division`| `text` | `marketplace`, `pesantren`, dll. | Menentukan *scope* akses jika profil merupakan `role = 'team'`. |

## 3. Aturan Transisi / Migrasi
- `operator` lama ➔ `admin`
- `pesantren` lama ➔ `user` + `has_pesantren = true`
- `seller` lama ➔ `user` + `is_seller = true` + `seller_status = 'approved'`
- Sebutan "Kiai", "Santri", "Donatur" tidak lagi mempengaruhi level kontrol akses, dan dapat dikelola hanya sebatas data demografis (jika diperlukan kedepannya).
