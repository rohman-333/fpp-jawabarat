import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { PesantrenActionButtons } from './PesantrenActionButtons';
import { MapPin, Phone, Mail, Users, Library, CheckCircle2, TrendingUp, Lightbulb, Link as LinkIcon, Building2, ShoppingBag, Store } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/EmptyState';
import { resolveMediaUrl } from '@/lib/media/resolveMediaUrl';

export default async function PesantrenPublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Validate uuid format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  const { data: pesantren } = await supabase
    .from('pesantren')
    .select('*')
    .eq('id', id)
    .single();

  if (!pesantren || pesantren.status !== 'verified') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <PublicNavbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <EmptyState 
            title="Pesantren Tidak Ditemukan"
            description="Profil pesantren yang Anda cari tidak ditemukan atau masih dalam proses verifikasi admin."
            icon={<Building2 className="w-12 h-12 text-slate-300" />}
            action={
              <Link href="/pesantren" className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors inline-block">
                Kembali ke Direktori
              </Link>
            }
          />
        </main>
        <PublicFooter />
      </div>
    );
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price, image_url, product_categories(name)')
    .eq('seller_id', pesantren.profile_id)
    .eq('status', 'active')
    .limit(4);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1 pb-20">
        {/* Banner Section */}
        <div className="relative h-[250px] sm:h-[350px] w-full bg-blue-950">
          {resolveMediaUrl(pesantren.foto_url) ? (
            <img src={resolveMediaUrl(pesantren.foto_url)!} alt="Banner Pesantren" className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
          
          {/* Header Content overlay */}
          <div className="absolute bottom-0 left-0 w-full">
            <div className="container mx-auto px-4 pb-8 sm:pb-12 flex flex-col md:flex-row gap-6 items-start md:items-end">
              {/* Logo */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-2xl shadow-xl border-4 border-white flex items-center justify-center text-4xl sm:text-6xl font-black text-blue-600 shrink-0 overflow-hidden transform translate-y-4 md:translate-y-16">
                {resolveMediaUrl(pesantren.logo_url) ? (
                  <img src={resolveMediaUrl(pesantren.logo_url)!} alt="Logo" className="w-full h-full object-cover" />
                ) : pesantren.name.charAt(0)}
              </div>
              
              {/* Titles */}
              <div className="flex-1 min-w-0 pt-4 md:pt-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-sm uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi FPP
                  </span>
                  {pesantren.nspp && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white/90 border border-white/20 backdrop-blur-sm uppercase tracking-wider">
                      NSPP: {pesantren.nspp}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-md">
                  {pesantren.name}
                </h1>
                <p className="text-blue-100 text-sm sm:text-base mt-2 max-w-2xl font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" /> {pesantren.alamat_desa}, Kec. {pesantren.kecamatan}, {pesantren.city}
                </p>
              </div>

              {/* Action Buttons Desktop */}
              <div className="hidden md:block pb-2">
                <PesantrenActionButtons phone={pesantren.hp || pesantren.phone} pesantrenId={pesantren.id} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="container mx-auto px-4 mt-8 md:mt-24">
          
          {/* Action Buttons Mobile */}
          <div className="md:hidden mb-8">
             <PesantrenActionButtons phone={pesantren.hp || pesantren.phone} pesantrenId={pesantren.id} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Col: Main Info */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Ringkasan Identitas */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-blue-600" /> Profil Institusi
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-sm">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Pengasuh Saat Ini</span>
                    <p className="font-bold text-slate-800 text-base">{pesantren.pengasuh || 'Belum diisi'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Pendiri Pesantren</span>
                    <p className="font-medium text-slate-700 text-base">{pesantren.pendiri || 'Belum diisi'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Tahun Berdiri</span>
                    <p className="font-medium text-slate-700 text-base">{pesantren.tahun_berdiri ? `${pesantren.tahun_berdiri} Masehi` : 'Belum diisi'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Afiliasi / Jenis</span>
                    <p className="font-medium text-slate-700 text-base capitalize">{pesantren.jenis_pesantren || 'Belum diisi'}</p>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-3">Program Pendidikan Unggulan</span>
                  <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                    <p className="font-medium text-blue-900 leading-relaxed text-sm whitespace-pre-wrap">
                      {pesantren.program_unggulan || 'Data belum tersedia.'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-3">Saran & Harapan (Sinergi Pemda & FPP)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <h4 className="font-bold text-slate-700 text-sm mb-2">Saran Pemda</h4>
                      <p className="text-slate-600 text-sm whitespace-pre-wrap">{pesantren.saran_pemda || 'Belum diisi'}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <h4 className="font-bold text-slate-700 text-sm mb-2">Harapan Forum/Pemda</h4>
                      <p className="text-slate-600 text-sm whitespace-pre-wrap">{pesantren.harapan_pemda_forum || 'Belum diisi'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-3">Program Pendidikan Unggulan</span>
                  <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                    <p className="font-medium text-blue-900 leading-relaxed text-sm">
                      {pesantren.program_unggulan || 'Belum ada deskripsi program unggulan.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Potensi & Kebutuhan */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-blue-600" /> Potensi Ekonomi & Kebutuhan
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-slate-400" /> Potensi Usaha Ekosistem
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                      {pesantren.potensi_ekonomi ? pesantren.potensi_ekonomi : 'Data belum tersedia.'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                      <Store className="w-4 h-4 text-slate-400" /> Koperasi / BMT / Unit Usaha
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                      {pesantren.koperasi_bmt_usaha ? pesantren.koperasi_bmt_usaha : 'Belum diisi'}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-slate-400" /> Kebutuhan Pengembangan Utama
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                      {pesantren.kebutuhan_utama || 'Data belum tersedia.'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2">
                      <Library className="w-4 h-4 text-slate-400" /> Minat Terhadap Digitalisasi & AI
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-wrap">
                      {pesantren.minat_digital_ai || 'Belum diisi'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Produk jika ada */}
              {products && products.length > 0 && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                      <Store className="w-6 h-6 text-blue-600" /> Etalase Produk
                    </h2>
                    <Link href={`/marketplace?pesantren=${pesantren.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-700">Lihat Semua</Link>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {products.map(product => (
                      <Link key={product.id} href={`/marketplace/${product.slug}`} className="group block">
                        <div className="aspect-square bg-slate-100 rounded-xl mb-3 overflow-hidden border border-slate-200">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ShoppingBag className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">{product.name}</h3>
                        <p className="text-blue-600 font-bold text-sm mt-1">Rp {product.price.toLocaleString('id-ID')}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right Col: Sticky Sidebar Info */}
            <div className="space-y-8">
              {/* Statistik SDM */}
              <div className="bg-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-blue-900/20">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" /> Komunitas Pesantren
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-blue-800/50 pb-3">
                    <span className="text-blue-100/80 text-sm">Lembaga Formal</span>
                    <span className="font-bold text-white">{pesantren.lembaga_formal ? 'Tersedia' : 'Hanya Diniyah'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-blue-800/50 pb-3">
                    <span className="text-blue-100/80 text-sm">Tenaga Pendidik</span>
                    <span className="font-bold text-white text-lg">{pesantren.guru_ustadz > 0 ? pesantren.guru_ustadz : 'Belum diisi'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-blue-800/50 pb-3">
                    <span className="text-blue-100/80 text-sm">Total Santri (Estimasi)</span>
                    <span className="font-black text-2xl text-blue-400">
                      {((pesantren.santri_sd || 0) + (pesantren.santri_smp || 0) + (pesantren.santri_sma || 0)) > 0 
                        ? ((pesantren.santri_sd || 0) + (pesantren.santri_smp || 0) + (pesantren.santri_sma || 0)) 
                        : 'Belum diisi'}
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-blue-100/80 text-xs uppercase tracking-wider font-bold mb-3 block">Rincian Santri</span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-blue-900/40 rounded-lg p-2 border border-blue-800/30">
                        <span className="block text-[10px] text-blue-300/80 mb-1">Tingkat SD/MI</span>
                        <span className="font-bold text-white text-sm">{pesantren.santri_sd > 0 ? pesantren.santri_sd : '-'}</span>
                      </div>
                      <div className="bg-blue-900/40 rounded-lg p-2 border border-blue-800/30">
                        <span className="block text-[10px] text-blue-300/80 mb-1">Tingkat SMP/MTs</span>
                        <span className="font-bold text-white text-sm">{pesantren.santri_smp > 0 ? pesantren.santri_smp : '-'}</span>
                      </div>
                      <div className="bg-blue-900/40 rounded-lg p-2 border border-blue-800/30">
                        <span className="block text-[10px] text-blue-300/80 mb-1">Tingkat SMA/MA</span>
                        <span className="font-bold text-white text-sm">{pesantren.santri_sma > 0 ? pesantren.santri_sma : '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kontak */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" /> Informasi Kontak
                </h3>
                
                <div className="space-y-5 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-slate-600 font-medium leading-relaxed">
                      {pesantren.address || ''} {pesantren.alamat_desa}, Kec. {pesantren.kecamatan}, {pesantren.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                    <p className="text-slate-600 font-medium">{pesantren.hp || pesantren.phone || 'Belum diisi'}</p>
                  </div>
                  {pesantren.media_sosial && (
                     <div className="flex items-start gap-3">
                      <LinkIcon className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-blue-600 font-medium hover:underline break-all">
                        {pesantren.media_sosial}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}
