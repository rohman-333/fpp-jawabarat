// app/(public)/terms/page.tsx

import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Syarat & Ketentuan - WIBAWA NUSANTARA',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Syarat & Ketentuan</h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Terakhir diperbarui: 20 Mei 2026</p>
            </div>
          </div>

          <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
            <p>
              Dengan mengakses dan menggunakan platform <b>WIBAWA NUSANTARA</b>, Anda secara otomatis menyetujui seluruh syarat dan ketentuan penggunaan yang tertera di bawah ini. Harap membaca dokumen ini secara cermat.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">1. Ketentuan Akun Pengguna</h2>
            <p>
              Setiap pengguna diwajibkan memberikan informasi pendaftaran yang akurat, jujur, dan selalu mutakhir. Anda bertanggung jawab penuh atas keamanan kata sandi dan seluruh aktivitas yang dilakukan di bawah akun Anda.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">2. Transaksi Marketplace & Pembayaran</h2>
            <p>
              Platform kami mendukung dua jenis pembayaran:
            </p>
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li><b>Transfer Bank Manual:</b> Pengguna wajib mengirimkan dana ke rekening bank resmi dan mengunggah foto bukti pembayaran asli untuk divalidasi oleh admin.</li>
              <li><b>Pembayaran Instan (Midtrans):</b> Diproses otomatis menggunakan gateway pembayaran terenkripsi. Status pesanan akan terupdate lunas secara real-time setelah diselesaikan.</li>
            </ul>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">3. Ketentuan Pengiriman Logistik Kurir</h2>
            <p>
              Layanan kurir bertugas untuk mengantar produk marketplace, belanjaan, titipan, maupun ojek pengantaran orang (jika feature-flag aktif). Seluruh tarif dihitung secara otomatis berdasarkan jarak dan zonasi bounds yang ditentukan oleh administrator secara transparan.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">4. Perilaku Komunitas & Konten Buatan Pengguna (UGC)</h2>
            <p>
              Kami melarang keras publikasi konten kasar, pornografi, ujaran kebencian, pencemaran nama baik, atau penipuan. Anda memberikan lisensi non-eksklusif kepada platform untuk menampilkan postingan Anda secara publik, namun hak cipta tetap sepenuhnya milik Anda. Kami berhak melakukan tindakan moderasi instan apabila ditemukan pelanggaran ketentuan.
            </p>

            <h2 className="text-base sm:text-lg font-black text-slate-800 pt-4 border-t border-slate-100">5. Perubahan Ketentuan</h2>
            <p>
              WIBAWA NUSANTARA berhak mengubah atau memperbarui syarat dan ketentuan ini sewaktu-waktu tanpa pemberitahuan sebelumnya. Penggunaan platform secara berkelanjutan setelah perubahan dianggap sebagai persetujuan terhadap ketentuan baru tersebut.
            </p>

            <div className="pt-8 border-t border-slate-100 flex justify-end">
              <Link href="/refund-policy" className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700 active:scale-95 transition-transform">
                Lanjut ke Kebijakan Pengembalian Dana <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
