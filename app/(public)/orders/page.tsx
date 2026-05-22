import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { Package, Clock, CheckCircle2, XCircle, Store, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Pesanan Saya - WIBAWA NUSANTARA',
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnUrl=/orders');
  }

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      seller:seller_id (id, name),
      order_items (*)
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" /> Pesanan Saya
        </h1>

        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Pesanan</h2>
            <p className="text-slate-500 mb-6">Anda belum pernah melakukan pemesanan di marketplace.</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Tanggal Pesanan</div>
                      <div className="font-medium text-slate-800">
                        {new Date(order.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">No. Invoice</div>
                      <Link href={`/orders/${order.id}`} className="font-bold text-blue-700 hover:underline">
                        {order.invoice_number}
                      </Link>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Total Belanja</div>
                      <div className="font-bold text-slate-800">Rp {order.total_amount.toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* General Order Status */}
                    {order.status === 'pending' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">Menunggu</span>}
                    {order.status === 'processing' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider">Diproses</span>}
                    {order.status === 'shipped' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider">Dikirim</span>}
                    {order.status === 'delivered' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">Selesai</span>}
                    {order.status === 'cancelled' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider">Dibatalkan</span>}

                    {/* Payment Status */}
                    {(order.payment_status === 'unpaid' || !order.payment_status) && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">Belum Bayar</span>}
                    {order.payment_status === 'waiting_payment' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">Verifikasi Pembayaran</span>}
                    {order.payment_status === 'paid' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">Lunas</span>}
                    {order.payment_status === 'rejected' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider">Pembayaran Ditolak</span>}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 text-slate-700 font-bold mb-4">
                    <Store className="w-5 h-5 text-blue-600" /> {order.seller?.name || 'Seller'}
                  </div>
                  
                  <div className="space-y-4">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-slate-800">{item.product_name}</div>
                          <div className="text-slate-500 text-sm">{item.quantity} x Rp {(item.product_price || item.price || 0).toLocaleString('id-ID')}</div>
                        </div>
                        <div className="font-bold text-slate-800">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Prompt Banner */}
                  {order.status === 'pending' && (order.payment_status === 'unpaid' || order.payment_status === 'rejected' || !order.payment_status) && (
                    <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-extrabold text-slate-800 text-xs sm:text-sm">Segera lakukan Pembayaran Manual</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Transfer ke Bank Mandiri 1310022345678 atau BSI 7110023456 a.n Wibawa Nusantara</div>
                        {order.payment_status === 'rejected' && (
                          <div className="text-rose-600 font-bold text-xs mt-1">⚠ Bukti bayar sebelumnya ditolak. Silakan unggah ulang bukti transfer yang valid.</div>
                        )}
                      </div>
                      <Link href={`/orders/${order.id}/payment`} className="shrink-0 w-full sm:w-auto">
                        <button className="w-full text-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Unggah Bukti Transfer
                        </button>
                      </Link>
                    </div>
                  )}

                  {order.payment_status === 'waiting_payment' && (
                    <div className="mt-6 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <div className="font-extrabold text-slate-800 text-xs sm:text-sm">Pembayaran sedang diverifikasi</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Mohon tunggu, admin sedang memeriksa bukti transfer Anda.</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                    <p className="text-sm text-slate-500">
                      Butuh bantuan atau ingin menanyakan status pesanan?
                    </p>
                    <form action="/messages/new" method="POST" className="inline-block">
                      <input type="hidden" name="seller_id" value={order.seller_id} />
                      <input type="hidden" name="order_id" value={order.id} />
                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <MessageCircle className="w-4 h-4" /> Chat Seller
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}