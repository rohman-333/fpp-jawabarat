# Feature Registry: FPP JAWABARAT
Dokumen ini memetakan seluruh fitur legacy yang harus dipertahankan dan dimigrasikan ke arsitektur Next.js baru.

| No | Nama Fitur | Status | Route Baru (Next.js) | Role Akses | Catatan Migrasi |
|----|------------|--------|----------------------|------------|-----------------|
| 1 | Beranda Sosial / Feed | Partial | `/feed` | Semua Login | Supabase table: `social_posts` |
| 2 | Forum Musyawarah | Partial | `/forum` | Semua Login | Supabase table: `forum_posts` |
| 3 | Kabar / Berita | Placeholder | `/news` | Semua | Publikasi oleh admin |
| 4 | Artikel & Dakwah | Placeholder | `/articles` | Semua | Publikasi konten |
| 5 | Kegiatan Santri | Placeholder | `/activities` | Semua | Publikasi konten |
| 6 | Marketplace | Partial | `/marketplace` | Semua | Supabase table: `products` |
| 7 | Produk | Partial | `/dashboard/products` | Pesantren/Seller | Manajemen produk |
| 8 | Keranjang | Placeholder | `/cart` | Semua Login | Chart state & DB keranjang |
| 9 | Checkout | Placeholder | `/checkout` | Semua Login | Integrasi payment gateway |
| 10 | Order | Placeholder | `/dashboard/orders`, `/orders` | Semua Login | Riwayat pesanan |
| 11 | Pesantren | Partial | `/pesantren`, `/dashboard/pesantren` | Semua | Direktori dan manajemen profil |
| 12 | Program Sinergi | Partial | `/dashboard/program`, `/admin/program` | Semua | Program kolaborasi/sinergi |
| 13 | Donasi | Placeholder | `/donations` | Semua | Campaign donasi |
| 14 | Dokumen / Library | Placeholder | `/documents`, `/library` | Semua | Unduh berkas |
| 15 | Ruang AI | Placeholder | `/ai` | Semua Login | Interaksi dengan AI Assistant |
| 16 | Bantuan / Assistance | Placeholder | `/assistance` | Semua Login | Ticketing & support |
| 17 | Kurir / Delivery | Placeholder | `/courier` | Kurir / Admin | Modul logistik pengiriman |
| 18 | Moderasi Konten | Placeholder | `/admin/moderation` | Admin / Operator | Tool moderasi |
| 19 | Banner / Iklan | Placeholder | `/admin/ads` | Admin | Pengelolaan spanduk / Ads |
| 20 | Laporan Admin | Placeholder | `/admin/reports` | Admin | Laporan analitik |
| 21 | Komisi / Ledger | Placeholder | `/admin/ledger` | Admin | Pencatatan keuangan/komisi |
| 22 | Reaksi, Komen, Follow, Save | Partial | Action routes/hooks | Semua Login | `social_likes`, `social_comments`, `social_follows`, `social_saves` |
| 23 | Notifikasi | Placeholder | `/notifications` | Semua Login | Inbox pemberitahuan |
| 24 | Pengaturan Akun | Partial | `/dashboard/settings` | Semua Login | Pengaturan personal |
| 25 | Ganti Password | Done | `/dashboard/security` | Semua Login | Update auth & profiles.password_changed_at |
