import { createClient } from '@/lib/supabase/server';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { MarketplaceClient } from './MarketplaceClient';

export const metadata = {
  title: 'Marketplace - FPP JAWABARAT',
  description: 'Dukung kemandirian pesantren dengan membeli produk berkualitas karya santri.',
};

export default async function MarketplacePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*, seller:seller_id(name, is_verified, location), pesantren(name, city)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-8">
        <MarketplaceClient initialProducts={products || []} />
      </div>
      <PublicFooter />
    </div>
  );
}
