import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { 
  Package, Clock, CheckCircle2, XCircle, Store, MessageCircle, 
  MapPin, Phone, Truck, ShieldCheck, ArrowLeft, AlertCircle, FileText, Calendar, Info
} from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Detail Pesanan - WIBAWA NUSANTARA',
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?returnUrl=/orders/${id}`);
  }

  // Fetch order, seller, and order items
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      seller:seller_id (id, name, phone, location),
      order_items (*)
    `)
    .eq('id', id)
    .eq('buyer_id', user.id)
    .maybeSingle();

  if (orderError || !order) {
    notFound();
  }

  // Fetch delivery details if any
  const { data: delivery } = await supabase
    .from('deliveries')
    .select('*')
    .eq('order_id', order.id)
    .maybeSingle();

  // Fetch order status logs
  const { data: statusLogs } = await supabase
    .from('order_status_logs')
    .select('*')
    .eq('order_id', order.id)
    .order('created_at', { ascending: false });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'paid': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'shipped': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'waiting_payment': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'paid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Konfirmasi';
      case 'paid': return 'Dibayar';
      case 'processing': return 'Sedang Diproses';
      case 'shipped': return 'Dalam Pengiriman';
      case 'delivered': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status.toUpperCase();
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'unpaid': return 'Belum Bayar';
      case 'waiting_payment': return 'Menunggu Verifikasi';
      case 'paid': return 'Lunas';
      case 'rejected': return 'Pembayaran Ditolak';
      default: return status.toUpperCase();
    }
  };

  const getDeliveryStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Pengiriman';
      case 'waiting_assignment': return 'Mencari Kurir';
      case 'assigned': return 'Kurir Ditugaskan';
      case 'picked_up': return 'Paket Diambil';
      case 'in_transit': return 'Sedang Dikirim';
      case 'delivered': return 'Tiba di Tujuan';
      case 'failed': return 'Pengiriman Gagal';
      case 'returned': return 'Paket Dikembalikan';
      default: return status.toUpperCase();
    }
  };

  const getShippingMethodName = (code: string) => {
    switch (code) {
      case 'internal_courier': return 'Kurir WIBAWA';
      case 'pickup': return 'Ambil Sendiri';
      case 'cod': return 'COD (Bayar di Tempat)';
      case 'external_shipping': return 'Ekspedisi Eksternal';
      case 'manual_shipping': return 'Kurir Toko';
      default: return 'Pengiriman Manual';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/orders" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Pesanan Saya
          </Link>
          
          <form action="/messages/new" method="POST" className="inline-block">
            <input type="hidden" name="seller_id" value={order.seller_id} />
            <input type="hidden" name="order_id" value={order.id} />
            <button 
              type="submit"
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-4 h-4 text-blue-600" /> Chat Seller
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header & Status Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Nomor Invoice</div>
                  <h1 className="text-xl font-black text-slate-800">{order.invoice_number}</h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${getPaymentStatusColor(order.payment_status)}`}>
                    {getPaymentStatusLabel(order.payment_status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
                <div>
                  <div className="text-slate-400 text-xs font-bold flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Tanggal Transaksi
                  </div>
                  <div className="font-semibold text-slate-700">
                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })} WIB
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs font-bold flex items-center gap-1 mb-1">
                    <Store className="w-3.5 h-3.5" /> Penjual
                  </div>
                  <div className="font-bold text-blue-600">{order.seller?.name || 'Seller'}</div>
                </div>
              </div>
            </div>

            {/* Payment Call To Action if Unpaid */}
            {order.status === 'pending' && (order.payment_status === 'unpaid' || order.payment_status === 'rejected' || !order.payment_status) && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-extrabold text-amber-900 text-sm md:text-base flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Menunggu Pembayaran Anda
                  </div>
                  <p className="text-xs text-amber-800/80 leading-relaxed">
                    Pesanan Anda sudah diterima oleh sistem. Mohon unggah bukti transfer manual bank atau lakukan checkout Midtrans online agar penjual dapat memproses pengiriman.
                  </p>
                  {order.payment_status === 'rejected' && (
                    <div className="text-rose-600 font-extrabold text-xs mt-2">
                      ⚠ Bukti pembayaran sebelumnya ditolak. Mohon unggah ulang bukti yang sah.
                    </div>
                  )}
                </div>
                <Link href={`/orders/${order.id}/payment`} className="w-full md:w-auto shrink-0">
                  <button className="w-full text-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/10 cursor-pointer active:scale-95 transition-all">
                    Bayar Sekarang
                  </button>
                </Link>
              </div>
            )}

            {/* List Products */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Package className="w-4.5 h-4.5 text-blue-600" /> Rincian Produk
              </h2>
              <div className="divide-y divide-slate-100">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg border border-slate-200 shrink-0 flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-slate-800 text-sm">{item.product_name}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{item.quantity} x {formatRupiah(item.product_price || 0)}</div>
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {formatRupiah(item.subtotal || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping & Delivery details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Truck className="w-4.5 h-4.5 text-blue-600" /> Informasi Pengiriman
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs font-bold block mb-1">Metode Pengiriman</span>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-xs">
                      {getShippingMethodName(order.shipping_method_code || '')}
                    </span>
                  </div>
                  {order.shipping_provider_name && (
                    <div>
                      <span className="text-slate-400 text-xs font-bold block mb-1">Ekspedisi / No Resi</span>
                      <span className="font-semibold text-slate-700">
                        {order.shipping_provider_name} {order.shipping_tracking_number ? `(${order.shipping_tracking_number})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-4 text-sm space-y-3">
                  <div>
                    <span className="text-slate-400 text-xs font-bold block mb-1">Penerima & Nomor WA</span>
                    <div className="font-semibold text-slate-700 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {order.customer_phone}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-xs font-bold block mb-1">Alamat Tujuan</span>
                    <div className="font-semibold text-slate-700 flex items-start gap-2 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      {order.shipping_address}
                    </div>
                  </div>

                  {order.notes && (
                    <div>
                      <span className="text-slate-400 text-xs font-bold block mb-1">Catatan Pesanan</span>
                      <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 italic">
                        "{order.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Logistics Delivery Ticket Status Card */}
                {delivery && (
                  <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-blue-800">Status Kurir Logistik</div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {getDeliveryStatusLabel(delivery.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>
                        <span className="font-bold block text-slate-400">Pengirim (Toko)</span>
                        <span className="font-semibold">{delivery.origin_name}</span>
                      </div>
                      <div>
                        <span className="font-bold block text-slate-400">Nama Penerima</span>
                        <span className="font-semibold">{delivery.destination_name}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Billing & Status Logs Timeline */}
          <div className="space-y-6">
            
            {/* Cost Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <FileText className="w-4.5 h-4.5 text-blue-600" /> Ringkasan Biaya
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatRupiah(order.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ongkos Kirim</span>
                  <span>{formatRupiah(order.shipping_cost || 0)}</span>
                </div>
                {order.cod_fee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya COD</span>
                    <span>{formatRupiah(order.cod_fee || 0)}</span>
                  </div>
                )}
                
                <div className="border-t border-slate-100 pt-3 flex justify-between items-center font-bold text-slate-800 text-base">
                  <span>Total Biaya</span>
                  <span className="text-blue-600 font-extrabold text-lg">
                    {formatRupiah(order.total_amount || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Logs */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Clock className="w-4.5 h-4.5 text-blue-600" /> Riwayat Status
              </h2>

              {!statusLogs || statusLogs.length === 0 ? (
                <p className="text-slate-400 text-xs italic">Belum ada riwayat status.</p>
              ) : (
                <div className="relative pl-4 border-l border-slate-200 space-y-4 py-1.5">
                  {statusLogs.map((log: any, idx: number) => (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[20.5px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                        idx === 0 ? 'bg-blue-600 scale-125' : 'bg-slate-300'
                      }`} />
                      
                      <div className="text-[11px] text-slate-400 font-bold">
                        {new Date(log.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      <div className={`text-xs font-bold mt-0.5 ${idx === 0 ? 'text-slate-800' : 'text-slate-600'}`}>
                        {getOrderStatusLabel(log.status)}
                      </div>
                      {log.notes && (
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{log.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
