import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Pesan - WIBAWA NUSANTARA',
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnUrl=/messages');
  }

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id, last_message, last_message_at, buyer_id, seller_id,
      buyer:buyer_id(name, avatar_url),
      seller:seller_id(name, avatar_url),
      product:product_id(name, image_url)
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600" /> Pesan Saya
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {!conversations || conversations.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p>Belum ada percakapan.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.map((conv: any) => {
                const isSeller = conv.seller_id === user.id;
                const otherParty = isSeller ? conv.buyer : conv.seller;
                
                return (
                <Link key={conv.id} href={`/messages/${conv.id}`} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
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
                      <h3 className="font-bold text-slate-800 truncate">{otherParty?.name || 'Pengguna'}</h3>
                      <span className="text-xs text-slate-400 shrink-0">
                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString('id-ID') : ''}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {conv.last_message || `Terkait: ${conv.product?.name || 'Produk'}`}
                    </p>
                  </div>
                </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
