'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function CartClient({ initialItems, currentUserId }: { initialItems: any[], currentUserId: string }) {
  const [items, setItems] = useState(initialItems);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const supabase = createClient();
  const router = useRouter();

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setLoadingIds(prev => [...prev, id]);
    
    // Optimistic update
    setItems(items.map(i => i.id === id ? { ...i, quantity: newQuantity } : i));
    
    await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', id);
    setLoadingIds(prev => prev.filter(i => i !== id));
  };

  const removeItem = async (id: string) => {
    if (!confirm('Hapus produk ini dari keranjang?')) return;
    setLoadingIds(prev => [...prev, id]);
    
    await supabase.from('cart_items').delete().eq('id', id);
    setItems(items.filter(i => i.id !== id));
    
    setLoadingIds(prev => prev.filter(i => i !== id));
  };

  const total = items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200">
        <EmptyState 
          title="Keranjang Kosong" 
          description="Yuk, mulai belanja dan dukung kemandirian pesantren." 
          icon={<ShoppingCart className="w-12 h-12 text-slate-400" />}
        />
        <div className="flex justify-center mt-6">
          <Link href="/marketplace">
            <Button className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl px-8 h-12">Belanja Sekarang</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-4">
        {items.map(item => {
          const product = item.product;
          if (!product) return null;
          const sellerName = product.seller?.name || product.pesantren?.name || 'Seller WIBAWA NUSANTARA';
          
          return (
            <div key={item.id} className={`bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 flex gap-4 ${loadingIds.includes(item.id) ? 'opacity-50' : ''}`}>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                {product.image_url ? (
                  <img src={product.image_url} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingCart className="w-8 h-8 m-auto mt-6 sm:mt-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <Link href={`/marketplace/${product.slug}`} className="font-bold text-slate-800 text-sm sm:text-base line-clamp-2 hover:text-blue-600 transition-colors mb-1">
                  {product.name}
                </Link>
                <div className="text-xs text-slate-500 mb-2 truncate">{sellerName}</div>
                <div className="font-bold text-blue-600 mb-3">{formatRupiah(product.price)}</div>
                
                <div className="mt-auto flex items-center justify-between gap-4">
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Hapus</span>
                  </button>
                  
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-1">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || loadingIds.includes(item.id)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 disabled:opacity-50"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={loadingIds.includes(item.id) || item.quantity >= (product.stock || 99)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-sm text-slate-600 disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="lg:w-80 shrink-0">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 sticky top-24 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4 text-lg">Ringkasan Belanja</h2>
          <div className="space-y-3 mb-6 border-b border-slate-100 pb-6">
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Total Harga ({items.length} Barang)</span>
              <span>{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-between text-blue-600 text-sm font-medium">
              <span>Diskon</span>
              <span>Rp 0</span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-slate-800">Total Tagihan</span>
            <span className="font-extrabold text-xl text-slate-900">{formatRupiah(total)}</span>
          </div>
          <Link href="/checkout">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-12 shadow-md shadow-blue-600/20">
              Beli ({items.length}) <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
