// app/(public)/refund-policy/page.tsx

import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { HelpCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Kebijakan Pengembalian & Refund - WIBAWA NUSANTARA',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Kebijakan Pengembalian & Refund</h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Terakhir diperbarui: 20 Mei 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
            <p>
              Di <b>WIBAWA NUSANTARA</b>, kepuasan pembeli dan transparansi transaksi marketplace adalah prioritas utama kami. Dokumen ini menjelaskan mekanisme pengajuan komplain barang rusak, salah kirim, dan pengembalian dana (refund).
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">1. Kondisi Pengajuan Komplain</h2>
            <p>
              Pembeli berhak mengajukan komplain atau retur barang dalam jangka waktu <b>1x24 jam</b> sejak produk diterima (status pesanan berubah menjadi *Delivered* oleh kurir) jika terjadi kondisi berikut:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>Produk yang dikirim rusak berat, pecah, atau tidak berfungsi sebagaimana mestinya.</li>
              <li>Produk tidak sesuai dengan deskripsi foto atau variasi ukuran/warna yang dipesan.</li>
              <li>Jumlah barang kurang (tidak lengkap) dibandingkan data invoice belanja.</li>
            </ul>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">2. Bukti Wajib Pengajuan (Unboxing Video)</h2>
            <p>
              Untuk menghindari perselisihan dan memastikan komplain Anda diproses secara objektif, pembeli wajib menyertakan <b>Video Unboxing asli (tanpa jeda/edit)</b> mulai dari saat paket masih terbungkus rapat hingga produk terlihat jelas kerusakannya.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">3. Alur Pengembalian Dana (Refund)</h2>
            <p>
              Apabila komplain disetujui oleh seller atau setelah dilakukan mediasi oleh admin kami:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>Dana belanja akan dikembalikan penuh (termasuk ongkir jika seluruh pesanan salah) ke dompet saldo digital pembeli atau dikirim via transfer bank manual dalam waktu <b>2x24 jam</b> kerja.</li>
              <li>Untuk pembayaran otomatis Midtrans, pengembalian dana akan diproses melalui pembatalan transaksi langsung atau ditransfer manual sesuai kesepakatan tertulis.</li>
            </ul>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">4. Hubungi Resolusi Center</h2>
            <p>
              Silakan manfaatkan fitur **Chat Seller** langsung dari halaman pesanan Anda, atau hubungi Pusat Bantuan Admin di <a href="mailto:support@wibawa-nusantara.com" className="text-blue-600 hover:underline font-bold">support@wibawa-nusantara.com</a> jika Anda mengalami kesulitan dalam menyelesaikan sengketa dengan pihak toko.
            </p>

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <Link href="/seller-policy" className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700 active:scale-95 transition-transform">
                Lanjut ke Kebijakan Seller & Mitra <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
