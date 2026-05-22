import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { ChatClient } from '@/components/shared/ChatClient';
import Link from 'next/link';
import { ArrowLeft, User, Store, Package } from 'lucide-react';

export const metadata = {
  title: 'Diskusi Chat - Dashboard WIBAWA NUSANTARA',
};

export default async function DashboardMessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      id, buyer_id, seller_id,
      buyer:buyer_id(name, avatar_url),
      seller:seller_id(name, avatar_url),
      product:product_id(id, name, price, image_url, slug),
      order:order_id(id, invoice_number, total_amount, status, payment_status)
    `)
    .eq('id', id)
    .single();

  if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) {
    notFound();
  }

  const isSeller = conversation.seller_id === user.id;
  const otherParty = (isSeller ? conversation.buyer : conversation.seller) as any;

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-120px)]">
      <div className="shrink-0">
        <Link 
          href="/dashboard/messages" 
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Kembali ke Pesan Toko
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden shrink-0">
              {otherParty?.avatar_url ? (
                <img src={otherParty.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-blue-100 text-blue-600">
                  {otherParty?.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-sm leading-tight">{otherParty?.name || 'Pembeli'}</h2>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                <User className="w-3 h-3 text-slate-400" />
                <span>{isSeller ? 'Pembeli' : 'Penjual'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Product Context Banner */}
        {conversation.product && (() => {
          const prod = conversation.product as any;
          return (
            <div className="p-3 bg-blue-50/40 border-b border-blue-100/50 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-white rounded-md overflow-hidden border border-slate-200 shrink-0">
                {prod.image_url && <img src={prod.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link 
                  href={`/marketplace/${prod.slug}`} 
                  className="text-xs font-bold text-blue-700 hover:underline truncate block"
                >
                  {prod.name}
                </Link>
                <div className="text-[10px] text-slate-600 font-bold mt-0.5">
                  Rp {(prod.price || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Order Context Banner */}
        {conversation.order && (() => {
          const ord = conversation.order as any;
          return (
            <div className="p-3 bg-emerald-50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-800 shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terkait Pesanan Toko</div>
                  <Link href={`/dashboard/orders/${ord.id}`} className="font-extrabold text-emerald-800 hover:underline">
                    {ord.invoice_number}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-700">Rp {ord.total_amount.toLocaleString('id-ID')}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {ord.status}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Interactive Chat Client */}
        <div className="flex-1 overflow-hidden relative">
          <ChatClient 
            conversationId={conversation.id} 
            currentUserId={user.id} 
            otherUserId={isSeller ? conversation.buyer_id : conversation.seller_id} 
            receiverType={isSeller ? 'buyer' : 'seller'}
          />
        </div>
      </div>
    </div>
  );
}
