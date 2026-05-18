import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Truck, Clock, XCircle, CheckCircle2, Box } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export default async function CourierDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_courier, courier_status')
    .eq('id', user.id)
    .single();

  if (!profile?.courier_status || profile.courier_status === 'none') {
    redirect('/dashboard/courier/apply');
  }

  if (profile.courier_status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden text-center p-8 sm:p-12">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Lamaran Sedang Diproses</h1>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Terima kasih telah melamar sebagai kurir FPP JAWABARAT. Tim admin kami sedang meninjau aplikasi Anda. Mohon tunggu informasi selanjutnya.
          </p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl transition-colors">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (profile.courier_status === 'rejected') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden text-center p-8 sm:p-12">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Lamaran Ditolak</h1>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Mohon maaf, lamaran kurir Anda belum dapat disetujui saat ini. Silakan coba lagi nanti atau hubungi admin jika ada pertanyaan.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl transition-colors">
              Kembali
            </Link>
            <Link href="/dashboard/courier/apply" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              <Truck className="w-4 h-4" /> Lamar Ulang
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Approved Courier Dashboard
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-600" /> Dashboard Kurir
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kelola dan pantau tugas pengiriman barang Anda.</p>
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Status Aktif
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12">
        <EmptyState 
          title="Belum Ada Pengiriman" 
          description="Saat ini belum ada tugas pengiriman yang ditugaskan kepada Anda. Silakan periksa kembali nanti." 
          icon={<Box className="w-12 h-12 text-slate-300" />}
        />
      </div>
    </div>
  );
}
