import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { ShoppingBag, Package, FileText, CheckCircle2, Clock } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import Link from 'next/link';

export const metadata = {
  title: 'Pesanan Saya - FPP JAWABARAT',
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/orders');
  }

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      seller:seller_id(name, phone),
      order_items(*)
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-[10px] font-bold uppercase tracking-wider border border-yellow-200">Menunggu</span>;
      case 'paid': return <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-200">Dibayar</span>;
      case 'processing': return <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-[10px] font-bold uppercase tracking-wider border border-purple-200">Diproses</span>;
      case 'shipped': return <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-[10px] font-bold uppercase tracking-wider border border-orange-200">Dikirim</span>;
      case 'delivered': return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider border border-emerald-200">Selesai</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-[10px] font-bold uppercase tracking-wider border border-red-200">Dibatalkan</span>;
      default: return <span className="px-2 py-1 bg-slate-50 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 max-w-[800px] w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Pesanan Saya</h1>
        
        {!orders || orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200">
            <EmptyState 
              title="Belum ada pesanan" 
              description="Anda belum pernah membuat pesanan di marketplace." 
              icon={<FileText className="w-12 h-12 text-slate-400" />}
            />
            <div className="flex justify-center mt-6">
              <Link href="/marketplace" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-8 py-3 transition-colors">
                Mulai Belanja
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      Belanja
                    </span>
                    <span className="text-slate-400 text-sm">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {getStatusBadge(order.status)}
                    <span className="text-slate-400 text-xs">{order.invoice_number}</span>
                  </div>
                </div>
                
                <div className="p-4 sm:p-6">
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{order.seller?.name || 'Seller FPP JAWABARAT'}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{item.product_name}</h4>
                          <p className="text-xs text-slate-500 mb-1">{item.quantity} barang x {formatRupiah(item.product_price)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-500 mb-1">Total Harga</p>
                          <p className="font-bold text-slate-800 text-sm">{formatRupiah(item.subtotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Total Belanja</p>
                      <p className="font-bold text-emerald-600 text-lg">{formatRupiah(order.total_amount)}</p>
                    </div>
                    {order.status === 'pending' && order.seller?.phone && (
                      <a 
                        href={`https://wa.me/${order.seller.phone.replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(`Halo, saya sudah membuat pesanan dengan nomor Invoice *${order.invoice_number}* sebesar *${formatRupiah(order.total_amount)}*. Mohon info pembayarannya.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-sm px-6 py-2.5 rounded-xl text-center shadow-sm"
                      >
                        Hubungi Penjual
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}