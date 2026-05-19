import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShoppingBag, Package, MessageCircle } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { OrderStatusSelect } from './OrderStatusSelect';
import Link from 'next/link';

export const metadata = {
  title: 'Daftar Pesanan (Seller) - Dashboard WIBAWA NUSANTARA',
};

export default async function DashboardOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:buyer_id(name, phone),
      order_items(*)
    `)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Daftar Pesanan Toko</h1>
        <p className="text-slate-500">Kelola pesanan masuk dari pembeli</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-sm">
          <EmptyState 
            title="Belum ada pesanan" 
            description="Toko Anda belum menerima pesanan." 
            icon={<ShoppingBag className="w-12 h-12 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-sm mb-0.5">{order.invoice_number}</div>
                  <div className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('id-ID')}</div>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                </div>
              </div>
              
              <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detail Pembeli</h3>
                    <form action="/dashboard/messages/new" method="POST" className="inline-block">
                      <input type="hidden" name="buyer_id" value={order.buyer_id} />
                      <input type="hidden" name="order_id" value={order.id} />
                      <button type="submit" className="text-xs flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 transition-colors">
                        <MessageCircle className="w-4 h-4" /> Chat Pembeli
                      </button>
                    </form>
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-slate-800">{order.buyer?.name || 'User'}</p>
                    <p className="text-slate-600 mt-1">{order.customer_phone}</p>
                    <p className="text-slate-600 mt-1">{order.shipping_address}</p>
                    {order.notes && (
                      <div className="mt-3 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm italic border border-yellow-200">
                        Catatan: {order.notes}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-[2]">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Produk Dipesan</h3>
                  <div className="space-y-3">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                          <Package className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.product_name}</h4>
                          <p className="text-xs text-slate-500">{item.quantity} x {formatRupiah(item.product_price)}</p>
                        </div>
                        <div className="font-bold text-slate-800 text-sm shrink-0">
                          {formatRupiah(item.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Total Pesanan</span>
                    <span className="font-extrabold text-lg text-blue-600">{formatRupiah(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}