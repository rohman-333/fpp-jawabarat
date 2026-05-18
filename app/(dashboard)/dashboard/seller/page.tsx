import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Store, Clock, XCircle, CheckCircle2 } from 'lucide-react';

export default async function SellerStatusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_seller, seller_status')
    .eq('id', user.id)
    .single();

  if (!profile?.seller_status || profile.seller_status === 'none') {
    redirect('/dashboard/seller/apply');
  }

  if (profile.is_seller && profile.seller_status === 'approved') {
    redirect('/dashboard/products');
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden text-center p-8 sm:p-12">
        {profile.seller_status === 'pending' && (
          <>
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Pengajuan Sedang Diproses</h1>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Terima kasih telah mengajukan pembukaan toko. Tim admin kami sedang meninjau aplikasi Anda. Proses ini biasanya memakan waktu 1-2 hari kerja.
            </p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl transition-colors">
              Kembali ke Dashboard
            </Link>
          </>
        )}

        {profile.seller_status === 'rejected' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Pengajuan Ditolak</h1>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Mohon maaf, pengajuan toko Anda belum dapat disetujui saat ini. Pastikan data yang Anda masukkan sesuai dengan panduan komunitas.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl transition-colors">
                Kembali
              </Link>
              <Link href="/dashboard/seller/apply" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                <Store className="w-4 h-4" /> Ajukan Ulang
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
