'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, BadgeCheck } from 'lucide-react';
import Link from 'next/link';

import { SuggestedUsers } from './SuggestedUsers';
import { SuggestedProducts } from './SuggestedProducts';
import { SuggestedPrograms } from './SuggestedPrograms';

export function RightRail({ currentUserId }: { currentUserId?: string }) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    setIsDesktop(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (!isDesktop) return null;

  return (
    <aside className="w-full bg-transparent hidden xl:block sticky top-8 pt-8 overflow-y-auto max-h-[calc(100vh-2rem)] custom-scrollbar">
      
      {/* Search Input */}
      <div className="relative mb-8">
        <input 
          type="text" 
          placeholder="Cari di WIBAWA NUSANTARA..." 
          className="w-full bg-white border border-slate-200 shadow-sm rounded-full py-2.5 pl-5 pr-10 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        />
        <svg className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-blue-600" /> Sedang Tren
        </h3>
        <div className="space-y-4">
          {[
            { tag: 'KemandirianPesantren', count: '1.2k post' },
            { tag: 'OPOPJabar', count: '856 post' },
            { tag: 'DigitalisasiPesantren', count: '432 post' },
            { tag: 'NgajiBareng', count: '210 post' }
          ].map((item, i) => (
            <div key={i} className="group cursor-pointer">
              <p className="font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors">#{item.tag}</p>
              <p className="text-xs text-slate-500">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      <SuggestedUsers currentUserId={currentUserId} />
      <SuggestedProducts />
      <SuggestedPrograms />

      <div className="mt-8 text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-2">
        <Link href="#" className="hover:underline hover:text-slate-600">Tentang</Link>
        <Link href="#" className="hover:underline hover:text-slate-600">Bantuan</Link>
        <Link href="#" className="hover:underline hover:text-slate-600">Privasi & Syarat</Link>
        <Link href="#" className="hover:underline hover:text-slate-600">Kebijakan Konten</Link>
        <span className="w-full mt-1">© 2026 WIBAWA NUSANTARA</span>
      </div>
    </aside>
  );
}
