// app/(public)/seller-policy/page.tsx

import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { Store, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Kebijakan Mitra Toko & Seller - WIBAWA NUSANTARA',
};

export default function SellerPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Kebijakan Mitra Toko & Seller</h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Terakhir diperbarui: 20 Mei 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
            <p>
              Platform <b>WIBAWA NUSANTARA</b> dirancang untuk mendukung para wirausaha, pelaku usaha mikro, dan UMKM lokal. Selaku mitra toko (seller) terdaftar, Anda menyetujui seluruh pedoman operasional berikut demi menjaga reputasi pasar yang bersih dan terpercaya.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">1. Verifikasi Identitas & Toko</h2>
            <p>
              Setiap calon seller wajib mengajukan pendaftaran resmi dari dashboard dan menyertakan data pendaftaran asli (nama toko, deskripsi, alamat fisik, KTP, dan nomor whatsapp aktif). Admin berhak menolak pendaftaran jika ditemukan informasi fiktif.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">2. Produk yang Dilarang</h2>
            <p>
              Seller dilarang keras mengunggah, menjual, atau menawarkan produk-produk berikut:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>Makanan/minuman kedaluwarsa, berbahaya, obat-obatan terlarang, atau senjata tajam.</li>
              <li>Barang bajakan, tiruan (KW), atau produk digital ilegal tanpa hak cipta resmi.</li>
              <li>Produk yang mengandung unsur pornografi, provokatif, atau melanggar syariat norma kesusilaan masyarakat.</li>
            </ul>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">3. Ketentuan Komisi Platform</h2>
            <p>
              Demi keberlanjutan pemeliharaan server, WIBAWA NUSANTARA menerapkan potongan biaya layanan platform yang sangat bersahabat sebesar **2%** (atau menyesuaikan jenis kategori pesantren/produk) pada setiap transaksi yang berhasil diselesaikan di marketplace.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">4. Penalti Pelanggaran</h2>
            <p>
              Toko Anda dapat dibekukan secara sementara maupun permanen oleh administrator apabila ditemukan menimbun pesanan, membatalkan pesanan sepihak berulang kali, mengunggah bukti palsu, atau mencoba melakukan transaksi di luar sistem (bypass) demi menghindari biaya platform.
            </p>

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <Link href="/community-guidelines" className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700 active:scale-95 transition-transform">
                Lanjut ke Panduan Komunitas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
