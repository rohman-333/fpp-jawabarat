import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { 
  Package, Clock, CheckCircle2, XCircle, Store, MessageCircle, 
  MapPin, Phone, Truck, ShieldCheck, ArrowLeft, AlertCircle, FileText, Calendar, Info
} from 'lucide-react';
import Link from 'next/link';
import { OrderStatusSelect } from '../OrderStatusSelect';

export const metadata = {
  title: 'Detail Pesanan (Seller) - Dashboard WIBAWA NUSANTARA',
};

export default async function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch order, buyer, and order items
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:buyer_id (id, name, phone),
      order_items (*)
    `)
    .eq('id', id)
    .eq('seller_id', user.id)
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/orders" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Detail Pesanan Toko</h1>
            <p className="text-xs text-slate-500">Invoice: <span className="font-extrabold text-blue-700">{order.invoice_number}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-bold hidden sm:inline">Ubah Status:</span>
          <OrderStatusSelect 
            orderId={order.id} 
            currentStatus={order.status} 
            buyerId={order.buyer_id}
            sellerId={order.seller_id}
            invoiceNumber={order.invoice_number}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Buyer Info, Delivery Info, Products list */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Buyer Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Store className="w-4.5 h-4.5 text-blue-600" /> Informasi Pembeli
              </h2>
              
              <form action="/dashboard/messages/new" method="POST" className="inline-block">
                <input type="hidden" name="buyer_id" value={order.buyer_id} />
                <input type="hidden" name="order_id" value={order.id} />
                <button type="submit" className="text-xs flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
                  <MessageCircle className="w-4 h-4" /> Chat Pembeli
                </button>
              </form>
            </div>

            <div className="text-sm space-y-3">
              <div>
                <span className="text-slate-400 text-xs font-bold block mb-0.5">Nama Lengkap</span>
                <span className="font-bold text-slate-800">{order.buyer?.name || 'User'}</span>
              </div>
              
              <div>
                <span className="text-slate-400 text-xs font-bold block mb-0.5">Nomor WhatsApp</span>
                <div className="font-semibold text-slate-700 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {order.customer_phone || order.buyer?.phone || '-'}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-xs font-bold block mb-0.5">Alamat Lengkap</span>
                <div className="font-semibold text-slate-700 flex items-start gap-2 leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  {order.shipping_address}
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Products Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Package className="w-4.5 h-4.5 text-blue-600" /> Daftar Produk Dipesan
            </h2>

            <div className="divide-y divide-slate-100">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-200 shrink-0 flex items-center justify-center">
                    <Package className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 text-sm">{item.product_name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{item.quantity} barang x {formatRupiah(item.product_price || 0)}</div>
                  </div>
                  <div className="font-bold text-slate-800 text-sm shrink-0">
                    {formatRupiah(item.subtotal || 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Shipping Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Truck className="w-4.5 h-4.5 text-blue-600" /> Status Kurir & Pengiriman
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
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

              {order.notes && (
                <div className="pt-2">
                  <span className="text-slate-400 text-xs font-bold block mb-1">Catatan Tambahan Pembeli</span>
                  <p className="bg-yellow-50/50 p-3 rounded-xl border border-yellow-100 text-xs text-yellow-800 leading-relaxed italic">
                    "{order.notes}"
                  </p>
                </div>
              )}

              {/* Delivery info logs if Courier is assigned */}
              {delivery ? (
                <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100/50 pb-2">
                    <span className="text-xs font-bold text-blue-800">Tiket Kurir Logistik Internal</span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                      {getDeliveryStatusLabel(delivery.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600">
                    <div>
                      <span className="font-bold block text-slate-400">Total Tarif Kurir</span>
                      <span className="font-semibold text-slate-800">{formatRupiah(delivery.fare_amount || 0)}</span>
                    </div>
                    <div>
                      <span className="font-bold block text-slate-400">Pendapatan Kurir</span>
                      <span className="font-semibold text-slate-800">{formatRupiah(delivery.courier_earning || 0)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                order.shipping_method_code === 'internal_courier' && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Perhatian: Pesanan ini menggunakan Kurir WIBAWA tetapi tiket kurir belum terbuat. Hubungi admin.</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Cost summary and Order Timeline */}
        <div className="space-y-6">
          
          {/* Bill Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <FileText className="w-4.5 h-4.5 text-blue-600" /> Ringkasan Pembayaran
            </h2>

            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-700">{formatRupiah(order.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Ongkos Kirim</span>
                <span className="font-semibold text-slate-700">{formatRupiah(order.shipping_cost || 0)}</span>
              </div>
              {order.cod_fee > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Biaya COD</span>
                  <span className="font-semibold text-slate-700">{formatRupiah(order.cod_fee || 0)}</span>
                </div>
              )}
              
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center font-bold text-slate-800 text-base">
                <span>Total Belanja</span>
                <span className="text-blue-600 font-extrabold text-lg">
                  {formatRupiah(order.total_amount || 0)}
                </span>
              </div>
            </div>

            {/* Platform Fee info for Seller transparency */}
            {order.platform_fee && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Fee Platform (Komisi)</span>
                  <span className="font-semibold text-slate-700">-{formatRupiah(order.platform_fee)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/50 pt-1.5 font-bold text-slate-600">
                  <span>Netto Diterima Toko</span>
                  <span className="text-emerald-600">{formatRupiah(order.subtotal - order.platform_fee)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Clock className="w-4.5 h-4.5 text-blue-600" /> Riwayat Status
            </h2>

            {!statusLogs || statusLogs.length === 0 ? (
              <p className="text-slate-400 text-xs italic">Belum ada riwayat status.</p>
            ) : (
              <div className="relative pl-4 border-l border-slate-200 space-y-4 py-1">
                {statusLogs.map((log: any, idx: number) => (
                  <div key={log.id} className="relative">
                    <span className={`absolute -left-[20.5px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                      idx === 0 ? 'bg-blue-600 scale-125' : 'bg-slate-300'
                    }`} />
                    <div className="text-[10px] text-slate-400 font-bold">
                      {new Date(log.created_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs font-bold mt-0.5 text-slate-700">
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
    </div>
  );
}
