import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { CheckoutClient } from './CheckoutClient';

export const metadata = {
  title: 'Checkout - FPP JAWABARAT',
};

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/checkout');
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  const { data: cartItems } = await supabase
    .from('cart_items')
    .select('*, product:product_id(*, seller:seller_id(name), pesantren:pesantren_id(name))')
    .eq('user_id', user.id);

  if (!cartItems || cartItems.length === 0) {
    redirect('/cart');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 max-w-[1000px] w-full mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Checkout</h1>
        <CheckoutClient items={cartItems} currentUserId={user.id} profile={profile} />
      </div>
      <PublicFooter />
    </div>
  );
}