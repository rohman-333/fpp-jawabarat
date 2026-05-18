import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { CartClient } from './CartClient';

export const metadata = {
  title: 'Keranjang - FPP JAWABARAT',
};

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/cart');
  }

  const { data: cartItems } = await supabase
    .from('cart_items')
    .select('*, product:product_id(*, seller:seller_id(name), pesantren:pesantren_id(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 max-w-[1000px] w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Keranjang Belanja</h1>
        <CartClient initialItems={cartItems || []} currentUserId={user.id} />
      </div>
      <PublicFooter />
    </div>
  );
}