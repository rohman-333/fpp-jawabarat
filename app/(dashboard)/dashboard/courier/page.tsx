import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import Link from 'next/link';
import { CourierOnlineToggle } from './CourierOnlineToggle';
import { 
  Truck, Star, Landmark, Award, ClipboardList, Wallet, FileText, CheckCircle 
} from 'lucide-react';

export default async function CourierDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile status
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If not a courier yet, redirect to apply
  if (!profile?.is_courier || profile?.courier_status !== 'approved') {
    redirect('/dashboard/courier/apply');
  }

  // Fetch courier specific profile
  const { data: courierProfile } = await supabase
    .from('courier_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch balance summary from wallet transactions
  const { data: transactions } = await supabase
    .from('courier_wallet_transactions')
    .select('amount')
    .eq('courier_id', user.id)
    .eq('status', 'recorded');

  const balance = transactions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar 
        isAdmin={profile?.role === 'admin' || profile?.role === 'operator'} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar 
          title="Dashboard Kurir" 
          userName={profile?.name || 'User'} 
          avatarUrl={profile?.avatar_url} 
        />

        <main className="p-4 sm:p-8 space-y-6 overflow-y-auto">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-2xl font-black">Selamat Datang, {courierProfile?.full_name || profile.name}! 👋</h2>
              <p className="text-blue-200 text-xs sm:text-sm">
                Kelola ketersediaan kerja, terima pesanan antar, pantau rute, dan cairkan pendapatan Anda.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-blue-200">Status Ketersediaan Kerja</span>
              <CourierOnlineToggle defaultOnline={courierProfile?.is_online || false} />
            </div>
          </div>

          {/* Quick Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Tipe Kendaraan</p>
                <p className="text-lg font-black text-slate-800 uppercase mt-0.5">{courierProfile?.vehicle_type || 'Motor'}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Rating Anda</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{Number(courierProfile?.rating || 5).toFixed(1)} / 5.0</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Tugas Selesai</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">{courierProfile?.total_jobs || 0} Order</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">Dompet Kurir</p>
                <p className="text-lg font-black text-slate-800 mt-0.5">Rp {balance.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          {/* Quick Service Capability Badges */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" /> Sertifikasi Kategori Layanan
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {courierProfile?.can_deliver_goods && (
                <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold px-3 py-1.5 rounded-full">
                  📦 Antar Barang (Aktif)
                </span>
              )}
              {courierProfile?.can_deliver_food && (
                <span className="bg-green-50 text-green-700 border border-green-100 text-xs font-bold px-3 py-1.5 rounded-full">
                  🍔 Antar Makanan/Belanja (Aktif)
                </span>
              )}
              {courierProfile?.can_do_errand && (
                <span className="bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold px-3 py-1.5 rounded-full">
                  🛍️ Titip Beli/Errand (Aktif)
                </span>
              )}
              {courierProfile?.can_ride_passenger ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                  🏍️ Ojek / Antar Penumpang (Verified)
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-500 border border-slate-200 text-xs font-medium px-3 py-1.5 rounded-full">
                  🏍️ Ojek (Nonaktif / Butuh Verifikasi)
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link 
              href="/dashboard/courier/jobs"
              className="p-6 bg-white border border-slate-200 hover:border-blue-500 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center space-y-3 group"
            >
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Tugas Kurir Masuk</h4>
              <p className="text-xs text-slate-500">Cek daftar order barang, makanan, atau titipan yang masuk di zona Anda.</p>
            </Link>

            <Link 
              href="/dashboard/courier/earnings"
              className="p-6 bg-white border border-slate-200 hover:border-green-500 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center space-y-3 group"
            >
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Wallet className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Dompet & Riwayat Pendapatan</h4>
              <p className="text-xs text-slate-500">Lihat total omset, komisi pengantaran 80%, dan rincian transaksi dompet.</p>
            </Link>

            <Link 
              href="/dashboard/courier/payouts"
              className="p-6 bg-white border border-slate-200 hover:border-amber-500 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center space-y-3 group"
            >
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Pengajuan Pencairan</h4>
              <p className="text-xs text-slate-500">Ajukan payout / penarikan dana langsung ke rekening bank atau dompet digital Anda.</p>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
