# Role Matrix & Permission System

Sistem Role pada FPP JAWABARAT disederhanakan agar tidak membingungkan pengguna umum. Role utama pada level akses sistem (`role`) dibatasi hanya untuk 4 tipe:
1. `superadmin`
2. `admin`
3. `team`
4. `user`

## Konsep Dasar

1. **Semua pendaftar publik otomatis menjadi `user`**.
2. Tidak ada lagi tipe akun seperti `kiai`, `ustadz`, `santri`, `alumni`, `pesantren`, `seller`, dll sebagai role utama.
3. Fitur-fitur tambahan bagi user biasa dikendalikan menggunakan boolean dan status flag pada tabel `profiles`.

## Flag & Status Ekstensi User
- **Pesantren:** Jika user memiliki pesantren dan telah divalidasi, maka `has_pesantren = true` dan `pesantren_id` berisi UUID pesantren.
- **Seller Marketplace:** Jika user mendaftar buka toko dan disetujui, maka `is_seller = true` dan `seller_status = 'approved'`.
- **Kurir:** Jika melamar jadi kurir dan disetujui, maka `is_courier = true` dan `courier_status = 'approved'`.

## Team Inti FPP
- Team FPP JAWABARAT (`role = 'team'`) tidak bisa mendaftar secara publik.
- Superadmin mengundang (invite) team melalui dashboard internal.
- Posisi/tugas team spesifik disimpan dalam `team_division` (misal: marketplace, pesantren, konten, kurir, keuangan, support, teknis).

## Matriks Hak Akses

| Role / Flag | Akses Feed | Akses Marketplace | Kelola Produk Sendiri | Kelola Pesantren Sendiri | Akses Dashboard Admin | Kelola Semua Pesantren |
|-------------|------------|-------------------|-----------------------|--------------------------|-----------------------|------------------------|
| **User** | Ya | Ya (Beli) | Tidak | Tidak | Tidak | Tidak |
| **Pengelola Pesantren** (`has_pesantren`) | Ya | Ya (Beli) | Tidak (kecuali Seller) | Ya | Tidak | Tidak |
| **Seller** (`is_seller`) | Ya | Ya (Beli/Jual) | Ya | Tidak (kecuali Pengelola) | Tidak | Tidak |
| **Team** (`team`) | Ya | Ya | Tergantung divisi | Tergantung divisi | Ya (Terbatas divisi) | Tergantung divisi |
| **Admin** (`admin`) | Ya | Ya | Ya | Ya | Ya (Full) | Ya |
| **Superadmin** | Ya | Ya | Ya | Ya | Ya (Full + Invite Team) | Ya |
