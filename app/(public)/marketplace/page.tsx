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

  const { data: heroBanner } = await supabase
    .from('site_banners')
    .select('*')
    .eq('status', 'active')
    .eq('placement', 'marketplace_hero')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-8">
        {heroBanner && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-md relative group">
            <a href={heroBanner.cta_url || '#'} className="block">
              <img src={heroBanner.image_url} alt={heroBanner.title || 'Marketplace Promo'} className="w-full h-[200px] md:h-[300px] object-cover group-hover:scale-[1.02] transition-transform duration-500" />
              {(heroBanner.title || heroBanner.cta_label) && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-6 md:p-8">
                  {heroBanner.is_sponsored && <span className="bg-yellow-500 text-slate-900 text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded w-fit mb-2">Sponsor Resmi: {heroBanner.sponsor_name}</span>}
                  {heroBanner.title && <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{heroBanner.title}</h2>}
                  {heroBanner.subtitle && <p className="text-slate-200 mb-3 text-sm md:text-base hidden md:block">{heroBanner.subtitle}</p>}
                  {heroBanner.cta_label && <span className="text-emerald-300 font-bold text-sm md:text-base inline-flex items-center gap-1">{heroBanner.cta_label} &rarr;</span>}
                </div>
              )}
            </a>
          </div>
        )}
        <MarketplaceClient initialProducts={products || []} />
      </div>
      <PublicFooter />
    </div>
  );
}
