import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, ShoppingBag, Landmark, Database, Handshake, FileText, BookOpen, Bot, ShieldCheck, BarChart3 } from 'lucide-react';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/shared/ProductCard';
import { FeedPostCard } from '@/components/shared/FeedPostCard';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { EmptyState } from '@/components/shared/EmptyState';

export default async function LandingPage() {
  const supabase = await createClient();

  // Fetch some dummy or real data for marketplace
  const { data: products } = await supabase
    .from('products')
    .select('*, pesantren(name, city)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(4);

  // Fetch some data for forum
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('*, profiles(name, avatar_url, role)')
    .order('created_at', { ascending: false })
    .limit(3);

  // Stats
  const { count: pesantrenCount } = await supabase.from('pesantren').select('*', { count: 'exact', head: true });
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: forumCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }); // approximation for active forum members

  return (
    <div className="min-h-screen font-sans selection:bg-yellow-500/30">
      <PublicNavbar transparent={true} />

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 bg-emerald-950 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-900/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="container relative mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/60 border border-emerald-800 text-yellow-400 text-sm font-semibold mb-8 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                Platform Pendataan & Sinergi Pondok Pesantren
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-4 leading-[1.1]">
                FPP <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">JAWABARAT</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-emerald-100 font-medium mb-6">
                Platform Digital Pesantren Jawa Barat
              </p>
              
              <p className="text-lg text-emerald-200/80 mb-10 leading-relaxed max-w-xl">
                Satu platform terpadu untuk kolaborasi, informasi, dan pemberdayaan pesantren. Terhubung dengan marketplace, forum musyawarah, dan layanan digital pendukung lainnya.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-14 px-8 text-lg bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-emerald-950 font-bold rounded-xl shadow-[0_0_30px_-5px_rgba(234,179,8,0.4)] transition-all hover:-translate-y-1">
                    Mulai Bergabung <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/marketplace" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full h-14 px-8 text-lg border-emerald-700 bg-emerald-900/30 text-emerald-50 hover:bg-emerald-800 hover:text-white rounded-xl backdrop-blur-sm transition-all hover:-translate-y-1">
                    Jelajahi Marketplace
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content: Dashboard Preview */}
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none perspective-1000 hidden md:block">
              <div className="relative rounded-2xl bg-emerald-900/40 border border-emerald-800/50 p-2 shadow-2xl backdrop-blur-md transform rotate-y-[-5deg] rotate-x-[2deg]">
                {/* Mockup Topbar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-800/50 bg-emerald-950/80 rounded-t-xl">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="mx-auto bg-emerald-900/50 rounded-md px-32 py-1.5 border border-emerald-800/50"></div>
                </div>
                {/* Mockup Content */}
                <div className="bg-emerald-950 rounded-b-xl p-4 sm:p-6 grid grid-cols-12 gap-4">
                  {/* Sidebar */}
                  <div className="col-span-3 space-y-3">
                    <div className="h-6 w-3/4 bg-emerald-800/50 rounded animate-pulse mb-6"></div>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex gap-3 items-center">
                        <div className="w-5 h-5 rounded bg-emerald-800/50"></div>
                        <div className="h-3 w-full bg-emerald-800/30 rounded"></div>
                      </div>
                    ))}
                  </div>
                  {/* Main Content */}
                  <div className="col-span-9 space-y-4">
                    <div className="h-32 rounded-xl bg-gradient-to-r from-emerald-900 to-emerald-800 border border-emerald-700/50 p-6 flex flex-col justify-end relative overflow-hidden">
                      <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4">
                         <Landmark className="w-32 h-32 text-emerald-100" />
                      </div>
                      <p className="text-emerald-300 text-xs font-semibold mb-1">Selamat datang di</p>
                      <h3 className="text-white text-2xl font-bold">FPP JAWABARAT</h3>
                    </div>
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-emerald-900/40 border border-emerald-800/50 rounded-lg p-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-800/50 mb-2"></div>
                          <div className="h-4 w-1/2 bg-yellow-500/80 rounded mb-1"></div>
                          <div className="h-2 w-3/4 bg-emerald-700/50 rounded"></div>
                        </div>
                      ))}
                    </div>
                    {/* Content Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-900/40 border border-emerald-800/50 rounded-lg p-3 h-24"></div>
                      <div className="bg-emerald-900/40 border border-emerald-800/50 rounded-lg p-3 h-24"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -left-6 top-12 bg-white text-emerald-950 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce shadow-emerald-900/20">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-slate-500">Terpercaya</p>
                  <p className="text-sm font-bold">Aman & Akurat</p>
                </div>
              </div>
              
              <div className="absolute -right-6 bottom-24 bg-yellow-400 text-emerald-950 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-pulse">
                <Users className="w-6 h-6" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">Kolaboratif</p>
                  <p className="text-sm font-bold">Sinergi Umat</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Stats Platform Section */}
      <section className="py-12 bg-emerald-900 border-y border-emerald-800 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x-0 md:divide-x divide-emerald-800/50">
            <div className="p-4">
              <p className="text-4xl font-black text-yellow-400 mb-2">{pesantrenCount || '12K+'}</p>
              <p className="text-emerald-100 font-medium">Pesantren Terdata</p>
            </div>
            <div className="p-4">
              <p className="text-4xl font-black text-yellow-400 mb-2">328</p>
              <p className="text-emerald-100 font-medium">Program Sinergi</p>
            </div>
            <div className="p-4">
              <p className="text-4xl font-black text-yellow-400 mb-2">{productCount || '750+'}</p>
              <p className="text-emerald-100 font-medium">Produk Marketplace</p>
            </div>
            <div className="p-4">
              <p className="text-4xl font-black text-yellow-400 mb-2">{forumCount || '1.2K+'}</p>
              <p className="text-emerald-100 font-medium">Anggota Aktif Forum</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur Utama Section */}
      <section className="py-24 bg-slate-50 relative">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-950 mb-4">Layanan Terpadu Platform</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Infrastruktur digital lengkap untuk mendukung operasional dan pengembangan pondok pesantren secara holistik.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
              { icon: Database, title: "Database Pesantren", desc: "Sistem pendataan terpusat dan valid untuk seluruh pesantren di Jawa Barat." },
              { icon: Handshake, title: "Program Sinergi", desc: "Kolaborasi program bantuan, beasiswa, dan pengembangan infrastruktur." },
              { icon: ShoppingBag, title: "Marketplace", desc: "Pasar digital mempromosikan produk UMKM pesantren ke masyarakat luas." },
              { icon: Users, title: "Forum Musyawarah", desc: "Ruang diskusi interaktif untuk pengurus, kyai, dan anggota komunitas." },
              { icon: FileText, title: "Dokumen / Library", desc: "Pusat arsip, regulasi, panduan, dan laporan terpusat." },
              { icon: BookOpen, title: "Artikel & Dakwah", desc: "Media publikasi kajian ilmiah, fiqih, dan syiar agama Islam." },
              { icon: Bot, title: "Ruang AI", desc: "Asisten cerdas pendukung pembuatan kurikulum dan tanya jawab regulasi.", badge: "BETA" },
              { icon: BarChart3, title: "Transparan", desc: "Dashboard monitoring program dan distribusi bantuan terintegrasi." },
            ].map((feat, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group flex flex-col">
                <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <feat.icon className="w-7 h-7" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-slate-800 text-lg">{feat.title}</h3>
                  {feat.badge && <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{feat.badge}</span>}
                </div>
                <p className="text-slate-500 text-sm leading-relaxed flex-1">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Sinergi Dummy */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Program Sinergi Terbaru</h2>
              <p className="text-slate-500">Kesempatan kolaborasi dan dukungan untuk pesantren.</p>
            </div>
            <Button variant="ghost" className="text-emerald-600 font-semibold hidden sm:flex hover:bg-emerald-50">
              Lihat Semua
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Beasiswa Santri Berprestasi", cat: "Pendidikan", img: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=500&q=80" },
              { title: "Sarana Air Bersih Pesantren", cat: "Sosial & Lingkungan", img: "https://images.unsplash.com/photo-1541818227092-299f4d1e2e6d?w=500&q=80" },
              { title: "Pelatihan Digital Pesantren", cat: "Pengembangan SDM", img: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=500&q=80" }
            ].map((prog, i) => (
              <div key={i} className="group rounded-2xl border border-slate-200 overflow-hidden bg-white hover:shadow-lg transition-shadow">
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-emerald-900/20 group-hover:bg-transparent transition-colors z-10"></div>
                  <img src={prog.img} alt={prog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 z-20 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    Aktif
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">{prog.cat}</p>
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-2 leading-snug">{prog.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace Preview */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Marketplace Unggulan</h2>
              <p className="text-slate-500">Dukung ekonomi umat dengan membeli produk pesantren.</p>
            </div>
            <Link href="/marketplace">
              <Button variant="ghost" className="text-emerald-600 font-semibold hidden sm:flex hover:bg-emerald-50">
                Kunjungi Toko
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products && products.length > 0 ? (
              products.map(p => <ProductCard key={p.id} product={p as any} />)
            ) : (
              <div className="col-span-full">
                <EmptyState title="Belum ada produk" description="Toko digital sedang dalam tahap penyiapan." icon={<ShoppingBag className="w-8 h-8 text-slate-300"/>} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Forum Preview */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Diskusi Komunitas Terbaru</h2>
            <p className="text-slate-500">Bergabung dalam percakapan dan perkuat ukhuwah antar kyai & santri.</p>
          </div>
          
          <div className="space-y-4">
            {posts && posts.length > 0 ? (
              posts.map(post => <FeedPostCard key={post.id} post={post as any} />)
            ) : (
              <EmptyState title="Forum masih sepi" description="Jadilah yang pertama memulai topik diskusi." icon={<Users className="w-8 h-8 text-slate-300"/>} />
            )}
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/forum">
              <Button className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full px-8">
                Buka Halaman Forum
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Akhir */}
      <section className="py-24 relative overflow-hidden bg-emerald-950">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">Majukan Pesantren Anda di Era Digital</h2>
          <p className="text-emerald-100 text-lg mb-10">Daftarkan pesantren Anda sekarang untuk mendapatkan akses ke seluruh layanan, program sinergi, dan ekosistem mandiri FPP JAWABARAT.</p>
          
          <Link href="/register">
            <Button size="lg" className="h-14 px-10 text-lg bg-yellow-500 hover:bg-yellow-400 text-emerald-950 font-bold rounded-full shadow-[0_0_30px_-5px_rgba(234,179,8,0.3)] transition-all hover:-translate-y-1">
              Daftar Sekarang Secara Gratis
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
