import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Package, Receipt, CreditCard } from 'lucide-react';
import { OrderStatusSelect } from '@/app/(dashboard)/dashboard/orders/OrderStatusSelect';
import Link from 'next/link';
import { PaymentConfirmationsList } from './PaymentConfirmationsList';

export const metadata = {
  title: 'Manajemen Transaksi (Admin) - WIBAWA NUSANTARA',
};

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const tab = resolvedParams.tab || 'orders';

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

  // Count pending payment confirmations for notification badge
  const { count: pendingConfirmationsCount } = await supabase
    .from('payment_confirmations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  let orders = [];
  let paymentConfirmations = [];

  if (tab === 'orders') {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:buyer_id(name, phone),
        seller:seller_id(name),
        order_items(*),
        conversations(id)
      `)
      .order('created_at', { ascending: false });
    
    orders = data || [];
  } else if (tab === 'payments') {
    const { data } = await supabase
      .from('payment_confirmations')
      .select(`
        *,
        order:order_id (
          id, invoice_number, total_amount, status, payment_status, seller:seller_id (name)
        ),
        buyer:buyer_id (name)
      `)
      .order('created_at', { ascending: false });

    paymentConfirmations = data || [];
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-blue-600" /> Manajemen Transaksi
          </h1>
          <p className="text-slate-500 text-sm mt-1">Pantau pesanan, kurir, dan kelola pembayaran manual di platform</p>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-slate-200 gap-6">
        <Link 
          href="/admin/orders?tab=orders" 
          className={`pb-3 font-bold text-sm border-b-2 transition-all ${
            tab === 'orders' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Package className="w-4 h-4" /> 
            Semua Transaksi
          </span>
        </Link>
        
        <Link 
          href="/admin/orders?tab=payments" 
          className={`pb-3 font-bold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
            tab === 'payments' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" /> 
          Verifikasi Pembayaran 
          {pendingConfirmationsCount !== null && pendingConfirmationsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full">
              {pendingConfirmationsCount}
            </span>
          )}
        </Link>
      </div>

      {tab === 'orders' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Invoice & Tanggal</th>
                  <th className="px-6 py-4">Pembeli & Penjual</th>
                  <th className="px-6 py-4">Total Belanja</th>
                  <th className="px-6 py-4">Chat Diskusi</th>
                  <th className="px-6 py-4">Status Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-medium text-slate-600">Belum ada transaksi</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-blue-700">{order.invoice_number}</div>
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
                        {order.conversations && order.conversations.length > 0 ? (
                          <Link 
                            href={`/messages/${order.conversations[0].id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold rounded-lg transition-all"
                          >
                            Lihat Chat
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 select-none">
                            Belum ada chat
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <OrderStatusSelect 
                          orderId={order.id} 
                          currentStatus={order.status} 
                          buyerId={order.buyer_id}
                          sellerId={order.seller_id}
                          invoiceNumber={order.invoice_number}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <PaymentConfirmationsList initialPayments={paymentConfirmations} />
      )}
    </div>
  );
}
