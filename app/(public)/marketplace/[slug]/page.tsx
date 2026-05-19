import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowLeft, Store, MapPin, Package, Phone, ShieldCheck, Star } from 'lucide-react';
import Link from 'next/link';
import { getProfileUrl } from '@/lib/routes/profile';
import { ProductCard } from '@/components/shared/ProductCard';
import { ProductActionButtons } from './ProductActionButtons';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase.from('products').select('name, description').eq('slug', slug).single();
  
  if (!product) return { title: 'Product Not Found' };
  return {
    title: `${product.name} - Marketplace WIBAWA NUSANTARA`,
    description: product.description || `Beli ${product.name} di Marketplace WIBAWA NUSANTARA`,
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: product } = await supabase
    .from('products')
    .select('*, seller:seller_id(*), pesantren(*)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!product) {
    notFound();
  }

  // Fetch related products
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('*, seller:seller_id(name, is_verified, location), pesantren(name, city)')
    .eq('status', 'active')
    .neq('id', product.id)
    .limit(5);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const sellerName = product.seller?.name || product.pesantren?.name || 'Seller WIBAWA NUSANTARA';
  const location = product.seller?.location || product.pesantren?.city || 'Jawa Barat';
  const isVerified = product.seller?.is_verified || false;
  const sellerAvatar = product.seller?.avatar_url || product.pesantren?.logo_url;
  
  const whatsappText = `Halo, saya tertarik dengan produk ${product.name} yang ada di Marketplace WIBAWA NUSANTARA.`;
  const whatsappUrl = product.pesantren?.phone 
    ? `https://wa.me/${product.pesantren.phone.replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/marketplace" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Marketplace
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0 md:gap-8 p-0 md:p-8">
            {/* Image Gallery */}
            <div className="lg:col-span-2">
              <div className="aspect-square bg-slate-100 md:rounded-2xl overflow-hidden border-b md:border border-slate-200 relative group">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ShoppingBag className="w-24 h-24 opacity-50" />
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <div className="bg-slate-800 text-white font-bold text-lg px-6 py-2 rounded-full uppercase tracking-widest shadow-xl">Stok Habis</div>
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:col-span-3 flex flex-col p-6 md:p-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded capitalize">{product.category || 'Lainnya'}</span>
                <span className="flex items-center text-xs font-bold text-yellow-500">
                  <Star className="w-3.5 h-3.5 fill-current mr-1" /> 4.9 (120 Ulasan)
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-tight">{product.name}</h1>
              
              <div className="flex items-end gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                  {formatRupiah(product.price)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><Package className="w-4 h-4" /> Kondisi</div>
                  <div className="font-bold text-slate-800">Baru</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><ShoppingBag className="w-4 h-4" /> Stok Minimum</div>
                  <div className="font-bold text-slate-800">{product.stock > 0 ? product.stock : 0}</div>
                </div>
              </div>

              {/* Action Buttons Section */}
              <div className="mb-8 pb-8 border-b border-slate-100">
                <ProductActionButtons product={product} currentUserId={user?.id || null} />
                <div className="mt-4 flex flex-wrap gap-4">
                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full sm:w-auto border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white font-bold rounded-xl h-11 transition-all">
                        <Phone className="w-4 h-4 mr-2" /> Chat Penjual
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              <div className="prose prose-slate max-w-none mb-8">
                <h3 className="text-lg font-bold text-slate-800 mb-3 border-l-4 border-blue-500 pl-3">Deskripsi Produk</h3>
                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                  {product.description || 'Tidak ada deskripsi.'}
                </div>
              </div>

              {/* Seller Info Card */}
              <div className="mt-auto bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-0"></div>
                <div className="w-16 h-16 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative z-10">
                  {sellerAvatar ? (
                    <img src={sellerAvatar} alt={sellerName} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left relative z-10">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-1">
                    <h4 className="font-bold text-slate-800 text-lg">{sellerName}</h4>
                    {isVerified && <ShieldCheck className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-3 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {location}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-blue-600">Aktif 2 jam lalu</span>
                  </div>
                </div>
                <div className="relative z-10 w-full sm:w-auto">
                  <Link href={getProfileUrl({ id: product.seller_id, username: product.seller?.username })}>
                    <Button variant="outline" className="w-full font-bold rounded-xl border-slate-300 text-slate-700 bg-white hover:bg-slate-50">
                      Kunjungi Toko
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-12 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800">Pilihan Lainnya Untukmu</h2>
              <Link href="/marketplace" className="text-blue-600 font-bold hover:underline text-sm">Lihat Semua</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
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
