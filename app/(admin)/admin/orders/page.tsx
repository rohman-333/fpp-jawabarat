import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Package, Receipt } from 'lucide-react';
import { OrderStatusSelect } from '@/app/(dashboard)/dashboard/orders/OrderStatusSelect';

export const metadata = {
  title: 'Semua Pesanan (Admin) - WIBAWA NUSANTARA',
};

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'superadmin', 'team'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:buyer_id(name, phone),
      seller:seller_id(name),
      order_items(*)
    `)
    .order('created_at', { ascending: false });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" /> Semua Pesanan
          </h1>
          <p className="text-slate-500 text-sm mt-1">Pantau seluruh transaksi di marketplace platform</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Invoice & Tanggal</th>
                <th className="px-6 py-4">Pembeli & Penjual</th>
                <th className="px-6 py-4">Total Belanja</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-medium text-slate-600">Belum ada transaksi</p>
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-emerald-700">{order.invoice_number}</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(order.created_at).toLocaleString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="text-slate-500">Dari: </span>
                        <span className="font-bold text-slate-800">{order.seller?.name || 'Seller'}</span>
                      </div>
                      <div className="text-sm mt-1">
                        <span className="text-slate-500">Ke: </span>
                        <span className="font-medium text-slate-800">{order.buyer?.name || 'Buyer'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{formatRupiah(order.total_amount)}</div>
                      <div className="text-xs text-slate-500 mt-1">{order.order_items.length} item(s)</div>
                    </td>
                    <td className="px-6 py-4">
                      <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
