import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { Search as SearchIcon, Users, Building2, Store, BookOpen, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Pencarian Global - WIBAWA NUSANTARA',
};

export default function SearchPage({ searchParams }: { searchParams: any }) {
  const q = searchParams?.q || '';
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <SearchIcon className="w-6 h-6 text-emerald-600" /> Pencarian Global
          </h1>
          
          <form className="relative mb-8" action="/search" method="GET">
            <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              name="q"
              defaultValue={q}
              placeholder="Cari user, pesantren, produk, atau postingan..." 
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              autoFocus
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors">
              Cari
            </button>
          </form>

          {q ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Hasil Pencarian untuk "{q}"</h2>
              <p className="text-slate-600">
                Fitur pencarian agregat sedang dalam penyempurnaan (MVP). Saat ini, silakan gunakan fitur pencarian spesifik di masing-masing menu (Marketplace, Direktori Pesantren).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer">
                <Users className="w-8 h-8 text-blue-500 mb-3" />
                <h3 className="font-bold text-slate-700">User / Pengguna</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer">
                <Building2 className="w-8 h-8 text-emerald-500 mb-3" />
                <h3 className="font-bold text-slate-700">Pesantren</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer">
                <Store className="w-8 h-8 text-amber-500 mb-3" />
                <h3 className="font-bold text-slate-700">Marketplace</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer">
                <BookOpen className="w-8 h-8 text-purple-500 mb-3" />
                <h3 className="font-bold text-slate-700">Postingan Feed</h3>
              </div>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
