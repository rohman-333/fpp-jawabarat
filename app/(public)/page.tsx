import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Users, 
  ShoppingBag, 
  Handshake, 
  Database, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Heart, 
  MessageSquare,
  Sparkles,
  Smartphone,
  CheckCircle2
} from 'lucide-react';
import { BRAND } from '@/lib/branding';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';

export const metadata = {
  title: `${BRAND.name} — Satu Ruang untuk Terhubung, Berbagi, dan Bertumbuh`,
  description: BRAND.description,
};

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans bg-[#F8FAFC] flex flex-col">
      <PublicNavbar transparent={true} />

      {/* ── Hero Section ── */}
      <section className="relative pt-24 md:pt-32 pb-20 md:pb-28 flex items-center bg-gradient-to-br from-[#082D6E] via-[#0F52BA] to-[#0A3D91] overflow-hidden shrink-0">
        {/* Modern radial grids and ambient lighting */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-400/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#6EA8FE]/10 blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        </div>

        <div className="container relative mx-auto px-4 z-10 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Premium Text content */}
            <div className="lg:col-span-7 flex flex-col text-center lg:text-left">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#EAF2FF] text-xs font-bold mb-6 shadow-inner backdrop-blur-sm self-center lg:self-start">
                <Sparkles className="w-3.5 h-3.5 text-[#6EA8FE]" />
                <span>Platform Sosial & Komunitas Nusantara</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
                Satu Ruang untuk <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#93C5FD] via-[#EAF2FF] to-white">
                  Terhubung, Berbagi,
                </span>{' '}
                <br className="hidden sm:inline" />
                dan Bertumbuh
              </h1>

              <p className="text-sm md:text-base lg:text-lg text-[#EAF2FF]/85 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                {BRAND.name} menghubungkan komunitas, pelaku usaha, lembaga, dan pengguna dalam satu ekosistem sosial, marketplace, dan program digital.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-sm bg-white hover:bg-slate-100 text-[#0F52BA] font-extrabold rounded-xl shadow-[0_4px_20px_-4px_rgba(255,255,255,0.25)] transition-all active:scale-98 border-none">
                    Buat Akun Gratis
                  </Button>
                </Link>
                <Link href="/marketplace" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 text-sm border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white rounded-xl backdrop-blur-sm transition-all active:scale-98">
                    Jelajahi Marketplace
                  </Button>
                </Link>
              </div>

              {/* Minimal social chips */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 mt-10 text-xs text-[#93C5FD] font-semibold">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Gratis Selamanya</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Daftar Cepat 30 Detik</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#6EA8FE]" />
                  <span>Komunitas Se-Nusantara</span>
                </div>
              </div>
            </div>

            {/* Right Column: Premium CSS Mobile Feed Mockup */}
            <div className="lg:col-span-5 flex justify-center items-center z-10">
              <div className="relative w-full max-w-[320px] bg-slate-900/50 p-3 rounded-[40px] shadow-2xl border border-white/10 backdrop-blur-md">
                {/* Phone screen boundary */}
                <div className="relative bg-slate-50 rounded-[32px] overflow-hidden border border-slate-200 flex flex-col h-[480px]">
                  
                  {/* Mock app status bar */}
                  <div className="bg-white px-5 pt-3 pb-2 flex justify-between items-center border-b border-slate-100 text-[10px] font-bold text-slate-500 shrink-0 select-none">
                    <span>10:42</span>
                    <div className="flex items-center gap-1">
                      <Smartphone className="w-3 h-3" />
                      <span>WIBAWA App</span>
                    </div>
                  </div>

                  {/* Mock post body content */}
                  <div className="p-3.5 space-y-3.5 overflow-hidden flex-1 select-none">
                    
                    {/* Collapsed input composer mockup */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 flex items-center gap-2.5 shadow-2xs">
                      <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] font-bold text-[#0F52BA]">WN</div>
                      <div className="flex-1 bg-slate-50 text-[10px] text-slate-400 rounded-full px-3 py-1.5 border border-slate-100 font-medium">Apa kabar hari ini?</div>
                    </div>

                    {/* Feed Card Mockup */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col gap-2.5">
                      <div className="flex gap-2 items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-extrabold text-white">WN</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-extrabold text-slate-800">Wibawa Center</span>
                            <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-bold">✓</span>
                          </div>
                          <span className="text-[8px] text-slate-400">10 menit yang lalu</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
                        Alhamdulillah, program pemberdayaan ekonomi pesantren di Jawa Barat berjalan lancar. Mari dukung produk lokal! 🚀
                      </p>

                      <div className="h-24 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-lg border border-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold overflow-hidden">
                        <div className="w-full h-full bg-blue-600/5 flex flex-col justify-center items-center p-4 text-center">
                          <CheckCircle2 className="w-6 h-6 text-blue-600 mb-1" />
                          <span className="text-blue-800 text-[9px] font-extrabold uppercase">Sinergi Nusantara</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 pt-2 shrink-0">
                        <div className="flex items-center gap-1 text-rose-500 font-bold">
                          <Heart className="w-3.5 h-3.5 fill-rose-500" />
                          <span>42 Likes</span>
                        </div>
                        <div className="flex items-center gap-1 font-bold">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>8 Komen</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Fitur Utama ── */}
      <section className="py-20 md:py-24 bg-white shrink-0">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <span className="text-[#0F52BA] font-extrabold text-xs tracking-widest uppercase bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100">Ekosistem Terintegrasi</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-4 tracking-tight">Semua yang Anda Butuhkan</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base mt-3 leading-relaxed">
              Platform modern dengan berbagai modul terpadu untuk interaksi sosial, kolaborasi komunitas, dan pengembangan ekonomi mikro.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            
            {/* Fitur 1 */}
            <div className="bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-2xl p-6 transition-all hover:-translate-y-0.5 flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0F52BA] flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-extrabold text-slate-800 text-base mb-1.5">Feed Komunitas</h3>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                  Bagikan kabar terbaru, kegiatan, atau postingan di timeline interaktif yang bebas iklan mengganggu.
                </p>
              </div>
            </div>

            {/* Fitur 2 */}
            <div className="bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-2xl p-6 transition-all hover:-translate-y-0.5 flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-extrabold text-slate-800 text-base mb-1.5">Marketplace</h3>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                  Etalase digital khusus untuk memasarkan produk-produk unggulan dari anggota dan pelaku usaha lokal.
                </p>
              </div>
            </div>

            {/* Fitur 3 */}
            <div className="bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-2xl p-6 transition-all hover:-translate-y-0.5 flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Handshake className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-extrabold text-slate-800 text-base mb-1.5">Program & Kegiatan</h3>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                  Sarana kolaborasi, publikasi kegiatan sosial, program donasi, serta edukasi masyarakat terpadu.
                </p>
              </div>
            </div>

            {/* Fitur 4 */}
            <div className="bg-slate-50 hover:bg-slate-100/50 border border-slate-100 rounded-2xl p-6 transition-all hover:-translate-y-0.5 flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-extrabold text-slate-800 text-base mb-1.5">Direktori & Profil</h3>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                  Sistem pemetaan profil terpusat untuk mempermudah pencarian dan koordinasi antar lembaga maupun usaha.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Kepercayaan / Trust Section ── */}
      <section className="py-20 bg-slate-50 shrink-0 border-t border-b border-slate-200/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <span className="text-emerald-600 font-extrabold text-xs tracking-widest uppercase bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100">Kualitas & Integritas</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-4 tracking-tight">Dirancang untuk Pengguna</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm mt-3 leading-relaxed">
              Kami memprioritaskan stabilitas, keamanan data, serta aksesibilitas ramah mobile agar nyaman digunakan kapan saja.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Trust 1 */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs text-center flex flex-col items-center">
              <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm mb-2">Aman & Terpercaya</h3>
              <p className="text-slate-500 text-[11px] md:text-xs leading-relaxed">
                Dilindungi dengan hak akses RLS Supabase ketat untuk menjamin keamanan profil dan privasi data anggota.
              </p>
            </div>

            {/* Trust 2 */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs text-center flex flex-col items-center">
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm mb-2">Mudah Digunakan</h3>
              <p className="text-slate-500 text-[11px] md:text-xs leading-relaxed">
                Antarmuka modern mobile-first yang sangat responsif, terasa ringan, cepat dimuat, dan hemat konsumsi kuota.
              </p>
            </div>

            {/* Trust 3 */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs text-center flex flex-col items-center">
              <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <Handshake className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm mb-2">Komunitas & Usaha</h3>
              <p className="text-slate-500 text-[11px] md:text-xs leading-relaxed">
                Dirancang khusus guna mempermudah kolaborasi antar komunitas sosial, lembaga non-profit, dan koperasi lokal.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA Final Section ── */}
      <section className="py-20 md:py-24 relative overflow-hidden bg-gradient-to-br from-[#082D6E] via-[#0F52BA] to-[#0A3D91] shrink-0 text-center">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
          <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-black/15 rounded-full blur-[100px]" />
        </div>

        <div className="container relative mx-auto px-4 z-10 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
            Mulai Bergabung dengan <span className="text-[#93C5FD]">{BRAND.name}</span>
          </h2>
          <p className="text-[#EAF2FF]/80 text-sm md:text-base mb-10 max-w-lg mx-auto leading-relaxed font-medium">
            Daftar gratis sekarang dan nikmati ekosistem terpadu untuk saling berinteraksi, bertukar informasi, serta memasarkan produk Anda.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-13 px-10 text-sm bg-white hover:bg-slate-100 text-[#0F52BA] font-extrabold rounded-xl shadow-[0_4px_20px_-4px_rgba(255,255,255,0.25)] transition-all active:scale-98 border-none">
                Buat Akun Gratis
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-8 text-sm border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white rounded-xl backdrop-blur-sm transition-all active:scale-98">
                Masuk ke Akun
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
