import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, ShoppingBag, Landmark, Database, Handshake, FileText, BookOpen, Bot, ShieldCheck, BarChart3, Globe, Zap, Star } from 'lucide-react';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { BRAND } from '@/lib/branding';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/shared/ProductCard';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { EmptyState } from '@/components/shared/EmptyState';

export const metadata = {
  title: `${BRAND.name} — Platform Sosial & Komunitas Nusantara`,
  description: BRAND.description,
};

export default async function LandingPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*, pesantren(name, city)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(4);

  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: landingHeroBanners } = await supabase
    .from('site_banners')
    .select('*')
    .eq('status', 'active')
    .eq('placement', 'landing_hero')
    .order('sort_order', { ascending: true })
    .limit(1);

  const heroBanner = landingHeroBanners?.[0];

  const { count: pesantrenCount } = await supabase.from('pesantren').select('*', { count: 'exact', head: true });
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen font-sans">
      <PublicNavbar transparent={true} />

      {/* ── Hero Section ── */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[80px]" />
        </div>

        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-300 text-sm font-semibold mb-8 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Platform Sosial & Komunitas Digital
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
              Terhubung dengan{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                Komunitas
              </span>
              {' '}Nusantara
            </h1>

            <p className="text-xl md:text-2xl text-blue-100/80 mb-4 font-medium">
              {BRAND.name}
            </p>

            <p className="text-lg text-blue-200/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              Bagikan kabar, ikuti komunitas favorit, temukan program, dan belanja produk dalam satu platform modern yang cepat dan mudah.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-10 text-lg bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_40px_-5px_rgba(59,130,246,0.5)] transition-all hover:-translate-y-1 border-none">
                  Buat Akun Gratis <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/feed">
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-blue-700/50 bg-blue-900/30 text-blue-50 hover:bg-blue-800/60 hover:text-white rounded-xl backdrop-blur-sm transition-all hover:-translate-y-1">
                  Jelajahi Konten
                </Button>
              </Link>
            </div>

            {/* Social proof chips */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-blue-300/70">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Gratis selamanya</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <span>Daftar dalam 30 detik</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Komunitas se-Nusantara</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-10 bg-blue-600 border-y border-blue-500">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <p className="text-3xl md:text-4xl font-black text-white mb-1">{pesantrenCount || '500+'}</p>
              <p className="text-blue-100 font-medium text-sm">Komunitas Terdata</p>
            </div>
            <div className="p-4 border-x border-blue-500/50">
              <p className="text-3xl md:text-4xl font-black text-white mb-1">{productCount || '750+'}</p>
              <p className="text-blue-100 font-medium text-sm">Produk Marketplace</p>
            </div>
            <div className="p-4">
              <p className="text-3xl md:text-4xl font-black text-white mb-1">{memberCount || '1.2K+'}</p>
              <p className="text-blue-100 font-medium text-sm">Anggota Aktif</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fitur Utama ── */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm mb-3">
              <Star className="w-4 h-4 fill-blue-600" /> Fitur Unggulan
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Semua yang Anda Butuhkan</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Platform terpadu untuk mendukung komunitas, pengembangan, dan pemberdayaan ekonomi masyarakat.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Database, title: 'Direktori Komunitas', desc: 'Sistem pendataan terpusat untuk seluruh komunitas dan organisasi.' },
              { icon: Handshake, title: 'Program Sosial', desc: 'Kolaborasi program bantuan, beasiswa, dan pengembangan bersama.' },
              { icon: ShoppingBag, title: 'Marketplace', desc: 'Pasar digital untuk mempromosikan produk UMKM dan komunitas.' },
              { icon: Users, title: 'Forum Diskusi', desc: 'Ruang diskusi interaktif untuk anggota dan pengurus komunitas.' },
              { icon: FileText, title: 'Perpustakaan Digital', desc: 'Pusat arsip, regulasi, panduan, dan dokumen terpusat.' },
              { icon: BookOpen, title: 'Artikel & Konten', desc: 'Media publikasi dan penyebaran informasi komunitas.' },
              { icon: Bot, title: 'Asisten AI', desc: 'Asisten cerdas berbasis AI untuk produktivitas komunitas.', badge: 'BETA' },
              { icon: BarChart3, title: 'Dashboard Transparan', desc: 'Monitoring program dan distribusi bantuan terintegrasi.' },
            ].map((feat, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <feat.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-slate-800">{feat.title}</h3>
                  {feat.badge && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{feat.badge}</span>}
                </div>
                <p className="text-slate-500 text-sm leading-relaxed flex-1">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Program Section ── */}
      {programs && programs.length > 0 && (
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex justify-between items-end mb-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Program Terbaru</h2>
                <p className="text-slate-500">Kesempatan kolaborasi dan dukungan komunitas.</p>
              </div>
              <Link href="/program">
                <Button variant="ghost" className="text-blue-600 font-semibold hidden sm:flex hover:bg-blue-50">
                  Lihat Semua
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {programs.map((prog) => (
                <Link href={`/program/${prog.slug}`} key={prog.id} className="group rounded-2xl border border-slate-200 overflow-hidden bg-white hover:shadow-lg transition-shadow">
                  <div className="h-48 overflow-hidden relative bg-slate-100">
                    <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-transparent transition-colors z-10" />
                    {prog.image_url ? (
                      <img src={prog.image_url} alt={prog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Handshake className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 z-20 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      Aktif
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">{prog.category || 'Umum'}</p>
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-2 leading-snug">{prog.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Marketplace Preview ── */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Marketplace Unggulan</h2>
              <p className="text-slate-500">Dukung ekonomi komunitas dengan membeli produk lokal.</p>
            </div>
            <Link href="/marketplace">
              <Button variant="ghost" className="text-blue-600 font-semibold hidden sm:flex hover:bg-blue-50">
                Kunjungi Toko
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products && products.length > 0 ? (
              products.map(p => <ProductCard key={p.id} product={p as any} />)
            ) : (
              <div className="col-span-full">
                <EmptyState title="Belum ada produk" description="Toko digital sedang dalam tahap penyiapan." icon={<ShoppingBag className="w-8 h-8 text-slate-300" />} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-[100px]" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Bergabung dengan <span className="text-blue-400">{BRAND.name}</span>
          </h2>
          <p className="text-blue-200/70 text-lg mb-10 max-w-xl mx-auto">
            Daftar gratis sekarang dan mulai terhubung dengan ribuan anggota komunitas Nusantara di seluruh Indonesia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 text-lg bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-[0_0_40px_-5px_rgba(59,130,246,0.4)] transition-all hover:-translate-y-1 border-none">
                Gabung Sekarang — Gratis
              </Button>
            </Link>
            <Link href="/feed">
              <Button size="lg" variant="ghost" className="text-blue-300 hover:text-white hover:bg-blue-900/50">
                Lihat Beranda Dulu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
