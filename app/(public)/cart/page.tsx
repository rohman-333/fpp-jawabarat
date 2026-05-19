import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { ShoppingCart, Trash2, Store, ArrowRight, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { resolveMediaUrl } from '@/lib/media/resolveMediaUrl';
import { updateCartQuantity, removeFromCart } from '../marketplace/actions';
import { CartItemControls } from './CartItemControls';

export const metadata = {
  title: 'Keranjang Belanja - WIBAWA NUSANTARA',
};

export default async function CartPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?returnUrl=/cart');
  }

  const { data: cartItems } = await supabase
    .from('cart_items')
    .select(`
      id, quantity,
      product:product_id (
        id, name, price, image_url, slug,
        seller:seller_id (
          id, name, has_pesantren
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Group by seller
  const itemsBySeller = cartItems?.reduce((acc: any, item: any) => {
    const sellerId = item.product.seller?.id || 'unknown';
    if (!acc[sellerId]) {
      acc[sellerId] = {
        seller: item.product.seller,
        items: []
      };
    }
    acc[sellerId].items.push(item);
    return acc;
  }, {}) || {};

  const totalItems = cartItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  const totalPrice = cartItems?.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-blue-600" /> Keranjang Belanja
        </h1>

        {!cartItems || cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Keranjang Belanja Kosong</h2>
            <p className="text-slate-500 mb-6">Anda belum memasukkan produk apapun ke dalam keranjang.</p>
            <Link href="/marketplace" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
              Mulai Belanja <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-6">
              {Object.values(itemsBySeller).map((group: any) => (
                <div key={group.seller?.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-700">{group.seller?.name || 'Toko FPP'}</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {group.items.map((item: any) => (
                      <div key={item.id} className="p-4 flex gap-4">
                        <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                          {item.product.image_url ? (
                            <img src={resolveMediaUrl(item.product.image_url)!} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-8 h-8 text-slate-300 m-auto mt-6" />
                          )}
                        </div>
                        <div className="flex-1">
                          <Link href={`/marketplace/${item.product.slug}`} className="font-medium text-slate-800 hover:text-blue-600 line-clamp-2 mb-1">
                            {item.product.name}
                          </Link>
                          <div className="text-blue-600 font-bold mb-3">
                            Rp {item.product.price.toLocaleString('id-ID')}
                          </div>
                          <CartItemControls itemId={item.id} quantity={item.quantity} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:w-80">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
                <h2 className="font-bold text-slate-800 mb-4">Ringkasan Belanja</h2>
                <div className="flex justify-between text-slate-600 mb-2">
                  <span>Total Produk ({totalItems})</span>
                  <span>Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
                <div className="border-t border-slate-100 my-4 pt-4 flex justify-between font-bold text-lg text-slate-800">
                  <span>Total Harga</span>
                  <span className="text-blue-600">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
                <Link href="/checkout" className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                  Lanjut ke Pembayaran <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}