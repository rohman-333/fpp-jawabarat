import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Calendar, MapPin, FolderHeart, Shield, Cpu, Store, Truck, ArrowRight } from 'lucide-react';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';

export const dynamic = 'force-dynamic';

export default async function ProgramsPage() {
  const supabase = await createClient();
  const { data: dbPrograms } = await supabase
    .from('programs')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  const corePrograms = [
    {
      title: 'Pemberdayaan Komunitas',
      desc: 'Membangun jejaring sosial dan kolaborasi aktif antar elemen masyarakat untuk memajukan potensi kearifan lokal.',
      icon: Shield,
      color: 'bg-blue-500',
      tag: 'Sosial & Budaya',
      href: '/dashboard/program'
    },
    {
      title: 'Digitalisasi Pesantren',
      desc: 'Modernisasi administrasi, sistem e-learning santri, dan tata kelola informasi pondok pesantren berbasis cloud.',
      icon: Cpu,
      color: 'bg-indigo-500',
      tag: 'Teknologi',
      href: '/dashboard/pesantren/apply'
    },
    {
      title: 'Marketplace Lokal',
      desc: 'Mendorong hilirisasi produk hasil karya santri dan UMKM ke pasar nasional secara langsung tanpa perantara.',
      icon: Store,
      color: 'bg-emerald-500',
      tag: 'Ekonomi Mikro',
      href: '/dashboard/products/new'
    },
    {
      title: 'Kurir dan Layanan Lokal',
      desc: 'Penyediaan armada pengiriman lokal mandiri guna menekan biaya logistik dan membuka lapangan kerja santri.',
      icon: Truck,
      color: 'bg-amber-500',
      tag: 'Logistik',
      href: '/dashboard/courier/apply'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1">
        {/* Hero Area */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <span className="bg-white/10 text-[#6EA8FE] text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/10 inline-block mb-4">
              Akselerasi Nusantara
            </span>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Program WIBAWA NUSANTARA</h1>
            <p className="text-blue-100 max-w-2xl mx-auto text-sm md:text-base leading-relaxed font-medium">
              Inisiatif transformasi digital terpadu untuk kemandirian ekonomi, teknologi, dan kemaslahatan umat.
            </p>
          </div>
        </div>

        {/* Core Pillars Section */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Empat Pilar Utama Pergerakan</h2>
            <p className="text-slate-500 text-xs md:text-sm mt-2 max-w-md mx-auto">Sinergi program nyata yang dirancang secara matang untuk mewujudkan kemandirian Nusantara.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {corePrograms.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all duration-300 flex flex-col h-full group">
                  <div className={`w-12 h-12 ${p.color} text-white rounded-2xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider self-start mb-3">
                    {p.tag}
                  </span>
                  <h3 className="font-extrabold text-slate-800 text-base mb-2 group-hover:text-blue-600 transition-colors">{p.title}</h3>
                  <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6 font-medium">{p.desc}</p>
                  <Link href={p.href} className="mt-auto text-blue-600 text-xs font-bold flex items-center gap-1.5 hover:underline group-hover:gap-2.5 transition-all">
                    Daftar Sekarang <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Database Partnership Programs */}
        {dbPrograms && dbPrograms.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20 border-t border-slate-200 pt-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Program Kemitraan Aktif</h2>
              <p className="text-slate-500 text-xs md:text-sm mt-2">Dukung dan berkolaborasi dalam inisiatif kemitraan yang sedang berjalan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dbPrograms.map(prog => (
                <Link key={prog.id} href={`/program/${prog.slug}`} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="aspect-[16/9] bg-slate-100 overflow-hidden relative">
                    {prog.image_url ? (
                      <img src={prog.image_url} alt={prog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <FolderHeart className="w-12 h-12 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    )}
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-blue-700 rounded-lg">
                      {prog.category || 'Umum'}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{prog.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-4">{prog.description}</p>
                    
                    <div className="flex flex-col gap-2 text-xs text-slate-500 border-t border-slate-100 pt-4">
                      {prog.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{prog.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span className="truncate">Diperbarui pada {new Date(prog.updated_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      
      <PublicFooter />
    </div>
  );
}
