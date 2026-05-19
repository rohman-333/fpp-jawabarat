'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ShoppingBag, Loader2, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function ProductActionButtons({ product, currentUserId }: { product: any, currentUserId: string | null }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAddToCart = async () => {
    if (!currentUserId) {
      router.push(`/login?redirect=/marketplace/${product.slug}`);
      return;
    }

    setLoading(true);
    // Check if already in cart
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', currentUserId)
      .eq('product_id', product.id)
      .single();

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('cart_items')
        .insert({
          user_id: currentUserId,
          product_id: product.id,
          quantity: 1
        });
    }

    setLoading(false);
    alert('Produk berhasil ditambahkan ke keranjang!');
  };

  const handleBuyNow = async () => {
    if (!currentUserId) {
      router.push(`/login?redirect=/marketplace/${product.slug}`);
      return;
    }
    
    await handleAddToCart();
    router.push('/checkout');
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
      .single();

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
        alert('Gagal memulai percakapan.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex gap-3 w-full sm:w-auto">
      <Button 
        onClick={handleAddToCart}
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
  );
}
