'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Store, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function SuggestedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, image_url, pesantren(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);

      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, [supabase]);

  if (loading && products.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mt-6">
        <h3 className="font-bold text-slate-800 text-sm mb-4">Produk Terbaru</h3>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-2 items-center animate-pulse">
              <div className="w-12 h-12 rounded-lg bg-slate-200"></div>
              <div className="space-y-1 flex-1">
                <div className="w-20 h-3 bg-slate-200 rounded"></div>
                <div className="w-12 h-2 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6 xl:mt-6">
      <div className="p-3 xl:p-4 border-b border-slate-100 flex items-center gap-2">
        <Store className="w-4 h-4 text-blue-600" />
        <h3 className="font-bold text-slate-800 text-sm">Produk Terbaru</h3>
      </div>
      <div className="p-3 xl:p-4 flex xl:flex-col gap-4 overflow-x-auto xl:overflow-visible hide-scrollbar snap-x">
        {products.map(p => (
          <Link key={p.id} href={`/marketplace`} className="flex flex-col xl:flex-row items-center gap-2 xl:gap-3 group min-w-[120px] xl:min-w-0 p-3 xl:p-0 border border-slate-100 xl:border-none rounded-xl snap-center shrink-0">
            <div className="w-16 h-16 xl:w-12 xl:h-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" decoding="async" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300"><Store className="w-5 h-5 xl:w-5 xl:h-5" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-center xl:text-left w-full">
              <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 truncate transition-colors">{p.name}</h4>
              <p className="text-blue-600 font-bold text-xs mt-0.5">Rp {p.price?.toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.pesantren?.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
