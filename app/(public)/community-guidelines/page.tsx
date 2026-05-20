// app/(public)/community-guidelines/page.tsx

import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Panduan Komunitas - WIBAWA NUSANTARA',
};

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Panduan Komunitas</h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Terakhir diperbarui: 20 Mei 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
            <p>
              Platform <b>WIBAWA NUSANTARA</b> didirikan dengan visi untuk membangun silaturahmi, pertukaran informasi yang bermanfaat, serta pemberdayaan ekonomi masyarakat secara madani. Agar tujuan tersebut tercapai, seluruh anggota diwajibkan menjunjung tinggi panduan etika bersosial media berikut ini.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">1. Saling Menghormati & Toleransi</h2>
            <p>
              Komunitas kita beranggotakan ribuan orang dengan latar belakang yang beragam. Hormati perbedaan pendapat, suku, agama, ras, dan golongan (SARA). Hindari bahasa kasar, merendahkan orang lain, provokasi politik yang memecah belah, atau konten perundungan (bullying).
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">2. Menyebarkan Informasi Bermanfaat & Sahih</h2>
            <p>
              Sebelum membagikan artikel, berita, atau postingan di feed, pastikan kebenaran informasi tersebut. Dilarang keras menyebarkan berita bohong (hoax), fitnah, penipuan bermodus donasi fiktif, investasi bodong, atau konten provokatif tanpa dasar fakta.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">3. Perlindungan Terhadap Konten Hak Cipta</h2>
            <p>
              Jangan mengunggah karya foto, video, tulisan, atau produk milik orang lain tanpa mencantumkan sumber asli secara jelas atau menyalahgunakan hak cipta kekayaan intelektual orang lain.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">4. Alur Pelaporan & Moderasi Cepat</h2>
            <p>
              Demi kenyamanan bersama, apabila Anda melihat ada postingan feed, komentar, atau gambar yang tidak pantas atau melanggar panduan ini:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>Klik tombol <b>Laporkan Postingan</b> pada pojok kanan atas kartu feed postingan tersebut.</li>
              <li>Sistem akan mendaftarkan laporan secara real-time ke dashboard moderasi operator.</li>
              <li>Tim admin akan meninjau dan menghapus postingan pelanggar dalam waktu maksimal 24 jam.</li>
            </ul>

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <Link href="/privacy" className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700 active:scale-95 transition-transform">
                Kembali ke Kebijakan Privasi <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
