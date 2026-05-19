import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { ChatClient } from '@/components/shared/ChatClient';
import Link from 'next/link';
import { ArrowLeft, Store } from 'lucide-react';

export const metadata = {
  title: 'Percakapan - WIBAWA NUSANTARA',
};

export default async function MessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
      product:product_id(id, name, price, image_url, slug)
    `)
    .eq('id', id)
    .single();

  if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) {
    notFound();
  }

  const isSeller = conversation.seller_id === user.id;
  const otherParty = (isSeller ? conversation.buyer : conversation.seller) as any;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl flex flex-col h-[calc(100vh-140px)]">
        <div className="mb-4">
          <Link href={isSeller ? "/dashboard/messages" : "/messages"} className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                {otherParty?.avatar_url ? (
                  <img src={otherParty.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-blue-100 text-blue-600">
                    {otherParty?.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-bold text-slate-800">{otherParty?.name || 'Pengguna'}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Store className="w-3 h-3" /> {isSeller ? 'Pembeli' : 'Penjual'}
                </p>
              </div>
            </div>
          </div>

          {/* Product Context */}
          {conversation.product && (() => {
            const prod = conversation.product as any;
            return (
            <div className="p-3 bg-blue-50/50 border-b border-blue-100 flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-md overflow-hidden border border-slate-200">
                {prod.image_url && <img src={prod.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/marketplace/${prod.slug}`} className="text-sm font-bold text-blue-700 hover:underline truncate block">
                  {prod.name}
                </Link>
                <div className="text-xs text-slate-600 font-semibold">Rp {(prod.price || 0).toLocaleString('id-ID')}</div>
              </div>
            </div>
            );
          })()}
          {/* Chat Client */}
          <div className="flex-1 overflow-hidden relative">
            <ChatClient 
              conversationId={conversation.id} 
              currentUserId={user.id} 
              otherUserId={isSeller ? conversation.buyer_id : conversation.seller_id} 
              receiverType={isSeller ? 'buyer' : 'seller'}
            />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
