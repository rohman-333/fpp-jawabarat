'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ShoppingBag, Loader2, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { addToCart } from '@/app/(public)/marketplace/actions';

export function ProductActionButtons({ product, currentUserId }: { product: any, currentUserId: string | null }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleAddToCart = async (silent = false) => {
    if (!currentUserId) {
      router.push(`/login?redirect=/marketplace/${product.slug}`);
      return false;
    }

    setLoading(true);
    try {
      const res = await addToCart(product.id, 1);
      if (res && 'error' in res && res.error) {
        showToast('Gagal menambahkan ke keranjang. Coba lagi.', 'error');
        setLoading(false);
        return false;
      }

      if (!silent) {
        showToast('Produk ditambahkan ke keranjang', 'success');
      }
      setLoading(false);
      return true;
    } catch (err) {
      console.error(err);
      showToast('Gagal menambahkan ke keranjang. Coba lagi.', 'error');
      setLoading(false);
      return false;
    }
  };

  const handleBuyNow = async () => {
    if (!currentUserId) {
      router.push(`/login?redirect=/marketplace/${product.slug}`);
      return;
    }
    
    const success = await handleAddToCart(true);
    if (success) {
      router.push('/cart');
    }
  };

  const handleChatSeller = async () => {
    if (!currentUserId) {
      router.push(`/login?redirect=/marketplace/${product.slug}`);
      return;
    }

    setLoading(true);
    // Check if conversation already exists
    const { data: existingConvo } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', currentUserId)
      .eq('seller_id', product.seller_id)
      .eq('product_id', product.id)
      .maybeSingle();

    if (existingConvo) {
      router.push(`/messages/${existingConvo.id}`);
    } else {
      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({
          buyer_id: currentUserId,
          seller_id: product.seller_id,
          product_id: product.id
        })
        .select('id')
        .single();
        
      if (!error && newConvo) {
        router.push(`/messages/${newConvo.id}`);
      } else {
        showToast('Gagal memulai percakapan.', 'error');
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full sm:w-auto relative">
      <div className="flex gap-3 w-full sm:w-auto">
        <Button 
          onClick={() => handleAddToCart(false)}
          disabled={loading || product.stock === 0}
          size="lg" 
          variant="outline"
          className="flex-1 sm:flex-none border-blue-600 text-blue-600 hover:bg-blue-50 font-bold rounded-xl h-12 px-6"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
          Keranjang
        </Button>
        
        <Button 
          onClick={handleBuyNow}
          disabled={loading || product.stock === 0}
          size="lg" 
          className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-12 px-8 shadow-md shadow-blue-600/20"
        >
          <ShoppingBag className="w-5 h-5 mr-2" /> Beli Langsung
        </Button>

        <Button 
          onClick={handleChatSeller}
          disabled={loading}
          size="lg" 
          variant="outline"
          className="flex-1 sm:flex-none border-green-600 text-green-600 hover:bg-green-50 font-bold rounded-xl h-12 px-6"
        >
          <MessageCircle className="w-5 h-5 mr-2" /> Chat Penjual
        </Button>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-extrabold transition-all duration-300 animate-bounce bg-white border-slate-200 text-slate-800">
          <span className={toast.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}>
            {toast.type === 'success' ? '✓' : '⚠'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
