// app/(public)/privacy/page.tsx

import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Kebijakan Privasi - WIBAWA NUSANTARA',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Kebijakan Privasi</h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Terakhir diperbarui: 20 Mei 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
            <p>
              Selamat datang di <b>WIBAWA NUSANTARA</b>. Kami berkomitmen untuk melindungi dan menghormati privasi data pribadi Anda saat menggunakan platform kami. Kebijakan ini menjelaskan data yang kami kumpulkan, cara kami menggunakannya, dan hak-hak yang Anda miliki.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">1. Informasi yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan informasi penting yang Anda berikan saat mendaftar, melakukan transaksi di marketplace, atau mengajukan aplikasi sebagai mitra:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li><b>Identitas Profil:</b> Nama lengkap, alamat email, nomor telepon, dan foto profil.</li>
              <li><b>Aktivitas Sosial:</b> Postingan teks, gambar, video, komentar, dan obrolan (chat).</li>
              <li><b>Detail Transaksi Marketplace:</b> Alamat pengiriman, informasi belanja, dan bukti konfirmasi transfer manual.</li>
              <li><b>Kemitraan Kurir & Seller:</b> Dokumen verifikasi resmi seperti KTP, SIM, STNK, serta data kendaraan untuk keperluan kemitraan kurir.</li>
            </ul>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">2. Bagaimana Kami Menggunakan Data Anda</h2>
            <p>
              Seluruh data yang dikumpulkan digunakan untuk keperluan fungsionalitas inti aplikasi:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>Memproses pesanan belanja dan menghitung ongkos kirim otomatis berdasarkan zonasi operasional kurir.</li>
              <li>Memfasilitasi pendaftaran kurir logistik dan seller toko komunitas.</li>
              <li>Menyediakan notifikasi penting terkait aktivitas belanja, status pengiriman, dan pesan obrolan (chat).</li>
              <li>Mendeteksi, mencegah, dan menindaklanjuti transaksi palsu atau konten yang melanggar hukum.</li>
            </ul>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">3. Keamanan Data & Enkripsi</h2>
            <p>
              Kami menggunakan protokol pengamanan modern (HTTPS/SSL) untuk menjamin data pribadi Anda terenkripsi dengan aman dalam transit dari perangkat Anda ke server database Supabase kami. Kami tidak pernah membagikan atau menjual data pribadi Anda kepada pihak ketiga manapun untuk tujuan pemasaran komersial tanpa persetujuan eksplisit Anda.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">4. Moderasi Konten & Perlindungan Pengguna</h2>
            <p>
              Kami menyediakan sarana moderasi di mana setiap pengguna dapat melaporkan konten kasar atau melanggar hak cipta secara instan melalui tombol <b>Laporkan Posting</b> di feed utama. Admin berhak menghapus postingan tersebut dan membekukan akun yang bersangkutan secara permanen.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">5. Kontak Admin Kami</h2>
            <p>
              Jika Anda memiliki pertanyaan mengenai penggunaan data pribadi atau ingin mengajukan penghapusan akun beserta riwayat data Anda, silakan hubungi admin di <a href="mailto:support@wibawa-nusantara.com" className="text-blue-600 hover:underline font-bold">support@wibawa-nusantara.com</a>.
            </p>

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <Link href="/terms" className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700 active:scale-95 transition-transform">
                Lanjut ke Syarat & Ketentuan <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
