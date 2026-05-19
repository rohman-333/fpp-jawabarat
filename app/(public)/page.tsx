import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, ShoppingBag, Landmark, Database, Handshake, FileText, BookOpen, Bot, ShieldCheck, BarChart3, Globe, Zap, Star } from 'lucide-react';
import { BRAND } from '@/lib/branding';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';

export const metadata = {
  title: `${BRAND.name} — Platform Sosial & Komunitas Nusantara`,
  description: BRAND.description,
};

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans bg-slate-50">
      <PublicNavbar transparent={true} />

      {/* ── Hero Section ── */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-[#0B3D91] via-[#0F52BA] to-[#082D6E] overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#6EA8FE]/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px]" />
        </div>

        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-[#EAF2FF] text-sm font-semibold mb-8 shadow-inner backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#6EA8FE] animate-pulse" />
              Platform Sosial & Komunitas Digital
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
              Terhubung, Berbagi, dan{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6EA8FE] to-[#EAF2FF]">
                Bertumbuh Bersama
              </span>
            </h1>

            <p className="text-lg text-[#EAF2FF]/90 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              WIBAWA NUSANTARA adalah platform sosial, komunitas, dan marketplace untuk mempertemukan pengguna, pelaku usaha, lembaga, dan komunitas dalam satu ekosistem digital.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-14 px-10 text-lg bg-white hover:bg-slate-100 text-[#0F52BA] font-bold rounded-xl shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-1 border-none">
                  Buat Akun Gratis
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-white/30 bg-black/20 text-white hover:bg-black/30 hover:text-white rounded-xl backdrop-blur-sm transition-all hover:-translate-y-1">
                  Masuk
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button size="lg" variant="ghost" className="h-14 px-6 text-[#93C5FD] hover:text-white hover:bg-white/10 rounded-xl transition-all">
                  Jelajahi Marketplace <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Social proof chips */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-[#93C5FD]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Gratis selamanya</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Daftar dalam 30 detik</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Komunitas se-Nusantara</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fitur Utama ── */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-[#0F52BA] font-semibold text-sm mb-3">
              <Star className="w-4 h-4 fill-[#0F52BA]" /> Fitur Unggulan
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-4">Semua yang Anda Butuhkan</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Platform terpadu untuk mendukung interaksi sosial, kolaborasi, dan pemberdayaan ekonomi masyarakat Nusantara.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Sosial & Feed Komunitas', desc: 'Saling sapa, bertukar informasi, dan membangun koneksi berharga di timeline interaktif.' },
              { icon: ShoppingBag, title: 'Marketplace', desc: 'Pusat jual beli produk unggulan untuk mendukung ekosistem usaha lokal.' },
              { icon: Handshake, title: 'Program & Kegiatan', desc: 'Informasi kolaborasi, event, dan bantuan sosial terorganisir.' },
              { icon: Database, title: 'Direktori Komunitas', desc: 'Pendataan terpusat seluruh lembaga, organisasi, dan kelompok masyarakat.' },
            ].map((feat, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#93C5FD] transition-all group flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-[#EAF2FF] text-[#0F52BA] flex items-center justify-center mb-4 group-hover:bg-[#0F52BA] group-hover:text-white transition-colors">
                  <feat.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-slate-800">{feat.title}</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed flex-1">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cara Mulai ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A] mb-4">Cara Bergabung</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Hanya butuh 3 langkah mudah untuk menjadi bagian dari ekosistem WIBAWA NUSANTARA.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-[#EAF2FF] z-0" />
            
            {[
              { step: '1', title: 'Daftar Akun', desc: 'Buat akun gratis menggunakan email Anda secara cepat.' },
              { step: '2', title: 'Lengkapi Profil', desc: 'Isi identitas diri, atur foto, dan verifikasi akun Anda.' },
              { step: '3', title: 'Mulai Terhubung', desc: 'Mulai posting, berjualan, atau bergabung dengan komunitas.' },
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white border-4 border-[#EAF2FF] text-[#0F52BA] rounded-full flex items-center justify-center text-3xl font-black shadow-lg mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                <p className="text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-[#0B3D91] via-[#0F52BA] to-[#082D6E]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Mulai bergabung dengan <span className="text-[#93C5FD]">{BRAND.name}</span>
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Daftar gratis sekarang dan mulai terhubung dengan ribuan anggota, lembaga, dan pelaku usaha di seluruh Indonesia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 text-lg bg-white hover:bg-slate-100 text-[#0F52BA] font-bold rounded-full shadow-[0_0_40px_-5px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-1 border-none">
                Buat Akun Gratis
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="ghost" className="text-[#EAF2FF] hover:text-white hover:bg-black/20 rounded-full">
                Jelajahi Ekosistem
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
