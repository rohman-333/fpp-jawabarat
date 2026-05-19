'use client';

import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Filter, Sparkles, TrendingUp, Tags, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/shared/ProductCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { createClient } from '@/lib/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

const CATEGORIES = [
  { id: 'all', name: 'Semua Kategori', icon: Sparkles },
  { id: 'Fashion & Pakaian', name: 'Fashion & Pakaian', icon: Tags },
  { id: 'Makanan & Minuman', name: 'Makanan & Minuman', icon: ShoppingBag },
  { id: 'Kitab & Buku', name: 'Kitab & Buku', icon: Sparkles },
  { id: 'Kerajinan', name: 'Kerajinan', icon: Tags },
  { id: 'Kesehatan', name: 'Kesehatan', icon: TrendingUp },
  { id: 'Elektronik', name: 'Elektronik', icon: Sparkles },
  { id: 'Jasa', name: 'Jasa', icon: TrendingUp },
  { id: 'Lainnya', name: 'Lainnya', icon: Tags },
];

export function MarketplaceClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 500);
  const supabase = createClient();

  useEffect(() => {
    async function fetchFiltered() {
      setLoading(true);
      
      let query = supabase
        .from('products')
        .select('*, seller:seller_id(name, is_verified, location), pesantren(name, city)')
        .eq('status', 'active');
        
      if (category !== 'all') {
        query = query.eq('category', category);
      }
      
      if (debouncedSearch) {
        query = query.ilike('name', `%${debouncedSearch}%`);
      }
      
      const { data } = await query.order('created_at', { ascending: false });
      if (data) setProducts(data);
      setLoading(false);
    }
    
    // Only fetch if it's not the initial load or filters changed
    if (debouncedSearch !== '' || category !== 'all') {
      fetchFiltered();
    } else {
      setProducts(initialProducts);
    }
  }, [debouncedSearch, category, supabase, initialProducts]);

  return (
    <div>
      {/* Hero Search Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 -mx-4 sm:-mx-8 px-4 sm:px-8 py-8 sm:py-12 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Marketplace Pesantren</h1>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto text-sm sm:text-base">Dukung kemandirian ekonomi pesantren Jawa Barat dengan membeli produk-produk berkualitas langsung dari santri dan pengasuh.</p>
          
          <div className="relative max-w-2xl mx-auto flex items-center bg-white rounded-full p-1.5 shadow-xl">
            <div className="pl-4 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Cari busana muslim, makanan, kerajinan..." 
              className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-800 px-3 py-2 sm:py-3 placeholder-slate-400 text-sm sm:text-base outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 px-6 sm:px-8 py-2.5 h-auto">Cari</Button>
          </div>
        </div>
      </div>

      {/* Promo Banner */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl overflow-hidden relative bg-blue-600 p-6 flex flex-col justify-center min-h-[160px]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="relative z-10">
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded inline-block mb-2">Bebas Ongkir</span>
            <h3 className="text-white text-xl font-bold mb-1">Pekan Raya Pesantren</h3>
            <p className="text-blue-100 text-sm">Diskon hingga 50% untuk produk kerajinan.</p>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden relative bg-orange-500 p-6 flex flex-col justify-center min-h-[160px] hidden md:flex">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/food.png')] opacity-10"></div>
          <div className="relative z-10">
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded inline-block mb-2">Produk Baru</span>
            <h3 className="text-white text-xl font-bold mb-1">Rasa Otentik Nusantara</h3>
            <p className="text-orange-100 text-sm">Cobain sambal dan cemilan khas santri.</p>
          </div>
        </div>
      </div>

      {/* Categories Horizontal */}
      <div className="mb-8 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory scroll-pl-4">
        <div className="flex gap-3 px-4 sm:px-0">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            const isActive = category === c.id;
            return (
              <button 
                key={c.id} 
                onClick={() => setCategory(c.id)}
                className={`snap-center flex items-center gap-2 px-4 py-2.5 rounded-full border whitespace-nowrap transition-all duration-300 text-sm font-medium ${
                  isActive 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {c.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Products Section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {category === 'all' ? 'Rekomendasi Utama' : CATEGORIES.find(c => c.id === category)?.name}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 text-slate-600 border-slate-200">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {[1,2,3,4,5,6,7,8,9,10].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full animate-pulse">
              <div className="aspect-square bg-slate-200 w-full"></div>
              <div className="p-3">
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
                <div className="h-5 bg-slate-200 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-slate-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-full mt-auto"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={async (p) => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  alert('Silakan login terlebih dahulu untuk berbelanja.');
                  window.location.href = '/login?redirect=/marketplace';
                  return;
                }
                
                const { error } = await supabase
                  .from('cart_items')
                  .insert({
                    user_id: user.id,
                    product_id: p.id,
                    quantity: 1
                  });
                  
                if (error) {
                  console.error(error);
                  alert('Gagal menambahkan ke keranjang: ' + error.message);
                } else {
                  alert('Berhasil ditambahkan ke keranjang!');
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="py-12">
          <EmptyState 
            title="Produk tidak ditemukan" 
            description="Coba gunakan kata kunci lain atau pilih kategori yang berbeda." 
            icon={<ShoppingBag className="w-8 h-8 text-slate-400" />}
          />
        </div>
      )}
    </div>
  );
}
