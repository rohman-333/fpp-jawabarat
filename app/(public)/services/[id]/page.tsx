import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { 
  MapPin, Phone, MessageSquare, Clipboard, User, Award, Shield, AlertTriangle, Calendar, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';

export default async function ServiceTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch Delivery Details
  const { data: delivery } = await supabase
    .from('deliveries')
    .select(`
      *,
      service_types(code, name),
      courier_id:profiles!deliveries_courier_id_fkey(name, avatar_url),
      courier_profile:courier_profiles!deliveries_courier_profile_id_fkey(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (!delivery) {
    notFound();
  }

  // Fetch Conversation if Courier is assigned
  let conversationId = null;
  if (delivery.courier_profile?.user_id && user) {
    const { data: convo } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('seller_id', delivery.courier_profile.user_id)
      .maybeSingle();
    if (convo) {
      conversationId = convo.id;
    }
  }

  // Fetch Delivery Status Logs
  const { data: logs } = await supabase
    .from('delivery_status_logs')
    .select('*')
    .eq('delivery_id', id)
    .order('created_at', { ascending: false });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'waiting_assignment': return 'Menunggu Kurir';
      case 'assigned': return 'Kurir Ditugaskan';
      case 'accepted': return 'Diterima Kurir';
      case 'pickup': return 'Menuju Penjemputan';
      case 'picked_up': return 'Barang Diambil';
      case 'in_progress': return 'Dalam Perjalanan';
      case 'delivered': return 'Terkirim';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting_assignment': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pickup': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'picked_up': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in_progress': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const totalCost = Number(delivery.fare_amount || 0) + Number(delivery.platform_fee || 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-8 mt-16 pb-20 space-y-6">
        
        {/* Main Status Header Card */}
        <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Status Pengiriman</span>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mt-0.5">
                <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(delivery.status)}`}>
                  {getStatusLabel(delivery.status)}
                </span>
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-mono">ID Pengiriman</span>
              <p className="font-mono font-bold text-slate-700 text-xs mt-0.5">#{delivery.id.substring(0, 8)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Layanan</span>
              <p className="font-bold text-slate-800 mt-0.5">{delivery.service_types?.name}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Total Biaya</span>
              <p className="font-black text-blue-600 mt-0.5 text-sm">Rp {totalCost.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {delivery.item_description && (
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs flex items-center justify-between">
              <span className="text-slate-600">📦 Keterangan Barang: <strong>{delivery.item_description}</strong></span>
              {delivery.item_weight && <span className="text-slate-400 text-[10px]">{delivery.item_weight} kg</span>}
            </div>
          )}
        </div>

        {/* Assigned Courier Card Details if exists */}
        {delivery.courier_id ? (
          <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600" /> Informasi Kurir Penjemput
            </h3>

            <div className="flex items-center gap-4">
              {delivery.courier_id.avatar_url ? (
                <img src={delivery.courier_id.avatar_url} alt={delivery.courier_id.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                  {delivery.courier_id.name?.charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-slate-800 text-sm truncate">{delivery.courier_id.name}</p>
                <p className="text-xs text-slate-500 font-medium">
                  {delivery.courier_profile?.vehicle_brand} — <strong className="text-slate-700">{delivery.courier_profile?.vehicle_plate}</strong>
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">⭐ {Number(delivery.courier_profile?.rating || 5).toFixed(1)} / 5.0 Rating</p>
              </div>

              <div className="flex items-center gap-2">
                {conversationId && (
                  <Link
                    href={`/messages/${conversationId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-xs text-[10px]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Kurir</span>
                  </Link>
                )}
                <a 
                  href={`tel:${delivery.courier_profile?.phone}`}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shrink-0"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-6 text-center py-8 space-y-2">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold animate-pulse">
              ⏳
            </div>
            <h3 className="font-extrabold text-slate-800 text-xs">Mencari Kurir Terdekat</h3>
            <p className="text-slate-500 text-[10px] max-w-xs mx-auto">
              Sistem sedang menugaskan kurir terbaik di zona Anda untuk menjemput paket. Mohon tunggu beberapa saat.
            </p>
          </div>
        )}

        {/* Address Routing Info details */}
        <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-6 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Detail Rute Pengantaran</h3>

          <div className="relative pl-6 space-y-6 text-xs">
            {/* Vertline connecting dots */}
            <div className="absolute left-2.5 top-2.5 bottom-2.5 w-[2px] bg-slate-200 dashed" />

            {/* pickup pin */}
            <div className="space-y-0.5 relative">
              <div className="absolute -left-5 top-0.5 w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lokasi Penjemputan / Pengirim</span>
              <p className="font-extrabold text-slate-800">{delivery.origin_name} ({delivery.origin_phone})</p>
              <p className="text-slate-500">{delivery.origin_address}</p>
            </div>

            {/* destination pin */}
            <div className="space-y-0.5 relative">
              <div className="absolute -left-5 top-0.5 w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Lokasi Tujuan / Penerima</span>
              <p className="font-extrabold text-slate-800">{delivery.destination_name} ({delivery.destination_phone})</p>
              <p className="text-slate-500">{delivery.destination_address}</p>
            </div>
          </div>
        </div>

        {/* Tracking Timeline Log Details */}
        <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-6 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Log Riwayat Perjalanan</h3>

          {logs?.length === 0 ? (
            <p className="text-slate-400 text-xs text-center py-4">Belum ada aktivitas perjalanan.</p>
          ) : (
            <div className="relative pl-6 space-y-4 text-xs">
              <div className="absolute left-2 top-2 bottom-2 w-[1px] bg-slate-200" />
              
              {logs?.map((log, idx) => (
                <div key={log.id} className="relative space-y-0.5">
                  {idx === 0 ? (
                    <div className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-[8px]" />
                  ) : (
                    <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border border-white" />
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`font-bold uppercase text-[9px] ${idx === 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                      {getStatusLabel(log.status)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-normal font-medium">{log.note}</p>
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
