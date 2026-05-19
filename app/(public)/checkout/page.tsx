import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { Store, ArrowRight, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { resolveMediaUrl } from '@/lib/media/resolveMediaUrl';
import { createOrder } from '../marketplace/actions';
import { CheckoutForm } from './CheckoutForm';

export const metadata = {
  title: 'Checkout - WIBAWA NUSANTARA',
};

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnUrl=/checkout');
  }

  const { data: cartItems } = await supabase
    .from('cart_items')
    .select(`
      id, quantity,
      product:product_id (
        id, name, price, image_url, slug,
        seller:seller_id (
          id, name
        )
      )
    `)
    .eq('user_id', user.id);

  if (!cartItems || cartItems.length === 0) {
    redirect('/cart');
  }

  const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" /> Checkout
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <CheckoutForm cartItems={cartItems} totalPrice={totalPrice} totalItems={totalItems} />
          </div>

          <div className="lg:w-96">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
                Ringkasan Pesanan
              </div>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto p-4">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="py-3 flex gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                      {item.product.image_url && (
                        <img src={resolveMediaUrl(item.product.image_url)!} alt={item.product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 text-sm">
                      <div className="font-medium text-slate-800 line-clamp-2 leading-tight mb-1">{item.product.name}</div>
                      <div className="text-slate-500 text-xs mb-1">{item.quantity} x Rp {item.product.price.toLocaleString('id-ID')}</div>
                      <div className="font-bold text-slate-800">Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="flex justify-between font-bold text-lg text-slate-800 mb-4">
                  <span>Total Bayar</span>
                  <span className="text-emerald-600">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}