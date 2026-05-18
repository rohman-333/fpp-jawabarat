import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { Calendar, MapPin, Share2, ChevronLeft, FolderHeart } from 'lucide-react';
import Link from 'next/link';

export default async function ProgramDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!program) notFound();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/program" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold mb-6 transition-colors">
            <ChevronLeft className="w-5 h-5" /> Kembali ke Program
          </Link>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="aspect-[21/9] bg-slate-100 relative">
              {program.image_url ? (
                <img src={program.image_url} alt={program.title} className="w-full h-full object-cover" />
              ) : (
                <FolderHeart className="w-20 h-20 text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
            </div>
            
            <div className="p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 text-sm font-bold rounded-lg border border-emerald-100">
                  {program.category || 'Umum'}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">{program.title}</h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 border-b border-slate-100 pb-6 mb-8">
                {program.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <span>{program.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <span>{new Date(program.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>

              <div className="prose prose-slate max-w-none mb-10 text-slate-700 leading-relaxed whitespace-pre-wrap">
                {program.description}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-8">
                <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-200 transition-colors text-center">
                  Ikut Berpartisipasi
                </button>
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Share2 className="w-5 h-5" /> Bagikan
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
