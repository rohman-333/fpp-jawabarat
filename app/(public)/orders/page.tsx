import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { Package, Clock, CheckCircle2, XCircle, Store } from 'lucide-react';
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
          <Package className="w-6 h-6 text-emerald-600" /> Pesanan Saya
        </h1>

        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Pesanan</h2>
            <p className="text-slate-500 mb-6">Anda belum pernah melakukan pemesanan di marketplace.</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">
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
                      <div className="font-bold text-emerald-700">{order.invoice_number}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Total Belanja</div>
                      <div className="font-bold text-slate-800">Rp {order.total_amount.toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                  <div>
                    {order.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wider"><Clock className="w-3.5 h-3.5" /> Menunggu Pembayaran</span>}
                    {order.status === 'paid' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> Dibayar</span>}
                    {order.status === 'processing' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider"><Package className="w-3.5 h-3.5" /> Diproses</span>}
                    {order.status === 'shipped' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-wider"><Package className="w-3.5 h-3.5" /> Dikirim</span>}
                    {order.status === 'delivered' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" /> Selesai</span>}
                    {order.status === 'cancelled' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider"><XCircle className="w-3.5 h-3.5" /> Dibatalkan</span>}
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 text-slate-700 font-bold mb-4">
                    <Store className="w-5 h-5 text-emerald-600" /> {order.seller?.name || 'Seller'}
                  </div>
                  
                  <div className="space-y-4">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-slate-800">{item.product_name}</div>
                          <div className="text-slate-500 text-sm">{item.quantity} x Rp {item.product_price.toLocaleString('id-ID')}</div>
                        </div>
                        <div className="font-bold text-slate-800">
                          Rp {item.subtotal.toLocaleString('id-ID')}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.status === 'pending' && (
                    <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-4 items-center">
                      <p className="text-sm text-slate-600 flex-1">
                        Silakan hubungi seller untuk konfirmasi pembayaran dan pengiriman.
                      </p>
                      <a 
                        href={`https://wa.me/?text=Halo, saya ingin konfirmasi pesanan ${order.invoice_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors text-sm"
                      >
                        WhatsApp Seller
                      </a>
                    </div>
                  )}
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