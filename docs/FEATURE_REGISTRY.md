# FPP JAWABARAT - Feature Registry

Dokumen ini melacak seluruh fitur utama dari sistem legacy PHP Hostinger yang telah atau sedang dimigrasikan ke arsitektur modern Next.js + Supabase.

| Modul/Fitur | Route Next.js | Status | Role Akses | Catatan |
|---|---|---|---|---|
| **Autentikasi & Akun** | `/login`, `/register`, `/auth/signout` | ✅ Done | Public, Authenticated | Sistem SSR terpusat |
| **Profil Publik** | `/u/[username]`, `/[username]` | ✅ Done | Public | Support vanity URL `/rohman` |
| **Social Feed** | `/feed`, `/post/[id]` | ✅ Done | Public, User | Posting, like, komen |
| **Saved / Bookmark** | `/feed/saved` | 🚧 Placeholder | User | Menyimpan feed |
| **Following** | `/feed/following` | 🚧 Placeholder | User | Feed dari orang yg diikuti |
| **Pencarian Global** | `/search` | ✅ MVP | Public | Cari agregat user/postingan/dll |
| **Marketplace (Umum)** | `/marketplace`, `/marketplace/[slug]` | ✅ Done | Public | Etalase produk |
| **Toko Saya (Seller)** | `/dashboard/seller`, `/dashboard/products` | ✅ Partial | Seller | CRUD produk (placeholder) |
| **Keranjang Belanja** | `/cart` | 🚧 Placeholder | User | Pembelian produk |
| **Checkout** | `/checkout` | 🚧 Placeholder | User | Proses bayar |
| **Pesanan Saya** | `/orders` | 🚧 Placeholder | User | Status pesanan pembeli |
| **Manajemen Pesanan** | `/dashboard/orders` | 🚧 Placeholder | Seller | Status pesanan toko |
| **Kurir / Logistik** | `/dashboard/courier`, `/admin/courier-applications` | 🚧 Placeholder | Courier, Admin | Pengajuan dan status |
| **Direktori Pesantren** | `/pesantren`, `/pesantren/[id]` | ✅ Done | Public | Database pesantren se-Jabar |
| **Kelola Pesantren** | `/dashboard/pesantren`, `/dashboard/pesantren/edit` | ✅ Partial | Pesantren Admin | Data detail dan logo |
| **Forum Komunitas** | `/forum`, `/admin/forum` | 🚧 Placeholder | Public, Admin | Diskusi terbuka |
| **Kabar / Berita** | `/news` | 🚧 Placeholder | Public | Berita seputar santri |
| **Artikel / Dakwah** | `/articles` | 🚧 Placeholder | Public | Tulisan dakwah/kajian |
| **Program** | `/program`, `/admin/program` | 🚧 Placeholder | Public, Admin | Program unggulan lembaga |
| **Donasi** | `/donations`, `/admin/donations` | 🚧 Placeholder | Public, Admin | Galang dana/sedekah |
| **Dokumen / Library** | `/documents`, `/library` | 🚧 Placeholder | Public | Unduh file dan pedoman |
| **Ruang AI** | `/ai` | 🚧 Placeholder | User | Asisten cerdas |
| **Bantuan / Support** | `/assistance` | 🚧 Placeholder | User | Laporan dan tiket |
| **Moderasi & Laporan** | `/admin/moderation`, `/admin/reports` | ✅ Partial | Admin | Laporkan postingan |
| **Notifikasi** | `/notifications` | 🚧 Placeholder | User | Pusat pemberitahuan |
| **Admin Dashboard** | `/admin`, `/admin/users`, `/admin/settings` | ✅ Partial | Admin, Superadmin | Pusat kontrol aplikasi |

## Keterangan
- **Done**: Fitur sudah fungsional dan terkoneksi ke database.
- **Partial**: Sebagian fitur sudah berjalan (misalnya form pengajuan), tapi menu lain (seperti edit/tambah detail) masih dalam proses.
- **Placeholder**: Route sudah dibuat agar tidak 404, menggunakan komponen profesional `FeaturePlaceholder`.
