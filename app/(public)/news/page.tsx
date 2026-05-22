import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { Newspaper, BellRing } from 'lucide-react';

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1 flex flex-col items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600 animate-pulse">
            <Newspaper className="w-8 h-8" />
          </div>
          
          <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            SEGERA HADIR
          </span>
          
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
            Kabar WIBAWA NUSANTARA
          </h1>
          
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6 font-medium">
            Fitur berita sedang disiapkan. Kami sedang menyusun sistem kurasi berita, opini santri, dan rilis pers resmi dari Wibawa Center secara real-time.
          </p>
          
          <div className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <BellRing className="w-4 h-4 text-blue-500" />
            <span>Nantikan notifikasi peluncurannya!</span>
          </div>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}