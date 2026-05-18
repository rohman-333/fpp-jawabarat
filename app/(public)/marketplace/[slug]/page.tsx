import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft, Store, MapPin, Package, Phone } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/shared/ProductCard';

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  
  const { data: product } = await supabase
    .from('products')
    .select('*, pesantren(*)')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single();

  if (!product) {
    notFound();
  }

  // Fetch related products
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('*, pesantren(name, city)')
    .eq('status', 'active')
    .neq('id', product.id)
    .limit(4);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const whatsappText = `Halo, saya tertarik dengan produk ${product.name} yang ada di Marketplace FPP JAWABARAT.`;
  const whatsappUrl = product.pesantren?.phone 
    ? `https://wa.me/${product.pesantren.phone.replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/marketplace" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Marketplace
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 p-6 md:p-10">
            {/* Image Gallery */}
            <div className="lg:col-span-2">
              <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ShoppingBag className="w-24 h-24 opacity-50" />
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:col-span-3 flex flex-col">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{product.name}</h1>
              
              <div className="flex items-end gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="text-4xl font-bold text-emerald-600 tracking-tight">
                  {formatRupiah(product.price)}
                </div>
                {product.stock > 0 ? (
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full mb-1">
                    <Package className="w-4 h-4" /> Stok: {product.stock}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full mb-1 border border-red-200">
                    <Package className="w-4 h-4" /> Stok Habis
                  </div>
                )}
              </div>

              <div className="prose prose-slate max-w-none mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Deskripsi Produk</h3>
                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {product.description || 'Tidak ada deskripsi.'}
                </div>
              </div>

              {/* Seller Info Card */}
              {product.pesantren && (
                <div className="mt-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                      {product.pesantren.logo_url ? (
                        <img src={product.pesantren.logo_url} alt={product.pesantren.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-1">{product.pesantren.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="w-4 h-4" /> {product.pesantren.city || product.pesantren.kecamatan}
                      </div>
                    </div>
                  </div>

                  {whatsappUrl ? (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-sm border-b-4 border-black/20 active:border-b-0 active:translate-y-1 transition-all">
                        <Phone className="w-5 h-5 mr-2" /> Beli via WhatsApp
                      </Button>
                    </a>
                  ) : (
                    <Button size="lg" disabled className="w-full sm:w-auto bg-slate-200 text-slate-500 font-bold rounded-xl cursor-not-allowed">
                      Kontak Tidak Tersedia
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Produk Lainnya</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(rp => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
