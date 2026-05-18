'use client';

import { TrendingUp, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function SocialRightbar() {
  return (
    <aside className="w-80 bg-transparent hidden xl:block h-screen sticky top-0 px-6 py-8 overflow-y-auto">
      
      {/* Search Input */}
      <div className="relative mb-8">
        <input 
          type="text" 
          placeholder="Cari di FPP JAWABARAT..." 
          className="w-full bg-white border-0 shadow-sm rounded-full py-3 pl-5 pr-10 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <svg className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" /> Sedang Tren
        </h3>
        <div className="space-y-4">
          {[
            { tag: 'KemandirianPesantren', count: '1.2k post' },
            { tag: 'OPOPJabar', count: '856 post' },
            { tag: 'DigitalisasiPesantren', count: '432 post' },
          ].map((item, i) => (
            <div key={i} className="group cursor-pointer">
              <p className="font-bold text-slate-700 text-sm group-hover:text-emerald-600">#{item.tag}</p>
              <p className="text-xs text-slate-500">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500" /> Rekomendasi Pesantren
        </h3>
        <div className="space-y-4">
          {[
            { name: 'Pondok Pesantren Cipasung', desc: 'Tasikmalaya' },
            { name: 'Pesantren Al-Ittifaq', desc: 'Bandung' },
            { name: 'Miftahul Huda', desc: 'Manonjaya' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0"></div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate cursor-pointer hover:text-emerald-600">{item.name}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <Link href="/pesantren" className="block text-center text-sm font-bold text-emerald-600 mt-4 hover:underline">
          Lihat Semua
        </Link>
      </div>

      <div className="mt-8 text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-2">
        <Link href="#" className="hover:underline">Tentang</Link>
        <Link href="#" className="hover:underline">Bantuan</Link>
        <Link href="#" className="hover:underline">Privasi</Link>
        <Link href="#" className="hover:underline">Ketentuan</Link>
        <span className="w-full mt-2">© 2026 FPP JAWABARAT</span>
      </div>
    </aside>
  );
}
