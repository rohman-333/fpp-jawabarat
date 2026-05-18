import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/shared/ProductCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ShoppingBag } from 'lucide-react';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';

export default async function MarketplacePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*, pesantren(name, city)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Marketplace Pesantren</h1>
            <p className="text-slate-600">Dukung kemandirian pesantren dengan membeli produk berkualitas karya santri.</p>
          </div>
          <Link href="/dashboard">
            <Button className="bg-emerald-600 hover:bg-emerald-700">Mulai Berjualan</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products && products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState 
                title="Belum ada produk" 
                description="Belum ada produk yang dijual di marketplace saat ini." 
                icon={<ShoppingBag className="w-8 h-8 text-slate-400" />}
              />
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
