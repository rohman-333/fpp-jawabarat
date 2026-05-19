import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { 
  Truck, Package, ShoppingCart, HelpCircle, UserCheck, Calendar, ArrowRight, Star, AlertTriangle, Landmark, Plus 
} from 'lucide-react';

export default async function ServicesCatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch active service types to enforce feature flags
  const { data: serviceTypes } = await supabase
    .from('service_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const isRideActive = serviceTypes?.some(s => s.code === 'ride') || false;

  // Fetch user's previous mobility/service requests if logged in
  let userDeliveries: any[] = [];
  if (user) {
    const { data } = await supabase
      .from('deliveries')
      .select(`
        *,
        service_types(code, name)
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) userDeliveries = data;
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'waiting_assignment': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'waiting_assignment': return 'Menunggu Kurir';
      case 'assigned': return 'Kurir Ditugaskan';
      case 'accepted': return 'Diterima Kurir';
      case 'pickup': return 'Menuju Lokasi';
      case 'picked_up': return 'Barang Diambil';
      case 'in_progress': return 'Mengantar';
      case 'delivered': return 'Terkirim';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8 mt-16 pb-20">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-black">Layanan Mobilitas Komunitas Pesantren</h1>
            <p className="text-blue-200 text-xs sm:text-sm max-w-md">
              Kirim paket instan, pesan antar makanan, titip belanjaan harian, hingga ojek santri di satu aplikasi.
            </p>
          </div>
          <Link 
            href="/services/new"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-1 text-sm shadow-md active:scale-95 transition-all w-full md:w-auto justify-center"
          >
            <Plus className="w-5 h-5" /> Buat Order Kurir
          </Link>
        </div>

        {/* Mobility catalog grid cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-800">Kategori Layanan Kurir</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">Antar Barang / Paket</h3>
              <p className="text-xs text-slate-500">Kirim paket kilat, dokumen penting, atau barang dagangan lokal instan dalam hitungan jam.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">Antar Makanan & Belanja</h3>
              <p className="text-xs text-slate-500">Pesan makanan dari warung/kopsis, atau titip belanja sayur mayur ke pasar terdekat.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">Titip Beli / Errand</h3>
              <p className="text-xs text-slate-500">Titip beli obat di apotek, bayar tagihan koperasi, atau serahkan tugas serbaguna lainnya.</p>
            </div>

            {/* Ride Hailing dynamic catalog block */}
            {isRideActive ? (
              <div className="bg-white p-5 rounded-2xl border border-blue-300 shadow-sm bg-blue-50/20 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                  Ojek / Antar Penumpang
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Aktif</span>
                </h3>
                <p className="text-xs text-slate-500">Layanan ojek santri & ojek online. Aman, hemat, bersahabat, terverifikasi SNI.</p>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 opacity-60 bg-slate-50/50 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-700 text-sm flex items-center gap-1.5">
                  Ojek / Antar Orang
                  <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Nonaktif</span>
                </h3>
                <p className="text-xs text-slate-500">Layanan ditutup sementara untuk persiapan lisensi keselamatan berkendara.</p>
              </div>
            )}
          </div>
        </div>

        {/* User request orders history list */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-800">Riwayat Pengiriman & Perjalanan Anda</h2>
          
          {!user ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-3">
              <p className="text-xs text-slate-500">Silakan login terlebih dahulu untuk melacak riwayat pemesanan kurir Anda.</p>
              <Link 
                href="/login"
                className="inline-block bg-blue-600 text-white text-xs font-bold px-6 py-2 rounded-xl"
              >
                Login Sekarang
              </Link>
            </div>
          ) : userDeliveries.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
              <span className="text-3xl block mb-2">🏍️</span>
              <p className="text-xs text-slate-500">Belum ada order pengantaran atau ojek yang pernah dibuat.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userDeliveries.map((del) => (
                <div key={del.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {del.service_types?.name || 'Kurir'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">#{del.id.substring(0, 8)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(del.status)}`}>
                        {getStatusLabel(del.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Titik Penjemputan</span>
                      <p className="font-extrabold text-slate-800">{del.origin_name}</p>
                      <p className="text-slate-500 font-medium">{del.origin_address}</p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Titik Tujuan</span>
                      <p className="font-extrabold text-slate-800">{del.destination_name}</p>
                      <p className="text-slate-500 font-medium">{del.destination_address}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Biaya Layanan</span>
                      <span className="font-black text-slate-800 text-sm">Rp {Number(del.fare_amount + del.platform_fee).toLocaleString('id-ID')}</span>
                    </div>

                    <Link 
                      href={`/services/${del.id}`}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl flex items-center gap-1 active:scale-95 transition-all"
                    >
                      Pantau Pengiriman <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
