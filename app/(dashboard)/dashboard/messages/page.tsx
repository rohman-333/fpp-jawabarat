import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageSquare, Store, ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import Link from 'next/link';

export const metadata = {
  title: 'Pesan Toko (Seller) - Dashboard WIBAWA NUSANTARA',
};

export default async function DashboardMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Retrieve conversations where this user is the seller
  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id, last_message, last_message_at, buyer_id, seller_id,
      buyer:buyer_id(name, avatar_url),
      product:product_id(name, image_url)
    `)
    .eq('seller_id', user.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pesan Masuk Toko</h1>
        <p className="text-slate-500">Diskusikan produk dan order langsung dengan pembeli</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {!conversations || conversations.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white">
            <EmptyState 
              title="Belum ada pesan masuk" 
              description="Percakapan dengan pembeli akan muncul di sini." 
              icon={<MessageSquare className="w-12 h-12 text-slate-300" />}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {conversations.map((conv: any) => {
              const otherParty = conv.buyer;
              
              return (
                <Link 
                  key={conv.id} 
                  href={`/dashboard/messages/${conv.id}`} 
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden shrink-0">
                    {otherParty?.avatar_url ? (
                      <img src={otherParty.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-blue-100 text-blue-600">
                        {otherParty?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-slate-800 truncate text-sm">{otherParty?.name || 'Pembeli'}</h3>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString('id-ID') : ''}
                      </span>
                    </div>
                    
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      {conv.last_message ? (
                        <span>{conv.last_message}</span>
                      ) : (
                        <span className="italic flex items-center gap-1 text-blue-600">
                          <ShoppingBag className="w-3.5 h-3.5" /> Terkait produk: {conv.product?.name || 'Detail'}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
