import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Calendar, MapPin, FolderHeart } from 'lucide-react';
import { PublicNavbar } from '@/components/shared/PublicNavbar';

export default async function ProgramPage() {
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1">
        <div className="bg-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Program Sinergi</h1>
            <p className="text-blue-100 max-w-2xl mx-auto text-lg">Ikuti dan dukung berbagai program unggulan untuk kemajuan komunitas Nusantara.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          {programs && programs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map(prog => (
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
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <FolderHeart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Program</h2>
              <p className="text-slate-500">Saat ini belum ada program yang dipublikasikan.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
