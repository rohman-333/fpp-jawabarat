import { createClient } from '@/lib/supabase/server';
import { PesantrenCard } from '@/components/shared/PesantrenCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Building2 } from 'lucide-react';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';

export default async function PesantrenDirectoryPage() {
  const supabase = await createClient();
  const { data: pesantrenList } = await supabase
    .from('pesantren')
    .select('*')
    .eq('status', 'verified')
    .order('name', { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Direktori Pesantren</h1>
          <p className="text-slate-600">Daftar pondok pesantren resmi yang tergabung dalam ekosistem WIBAWA NUSANTARA.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pesantrenList && pesantrenList.length > 0 ? (
            pesantrenList.map((pesantren) => (
              <PesantrenCard key={pesantren.id} pesantren={pesantren} />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState 
                title="Belum ada pesantren terverifikasi"
                description="Saat ini belum ada data pesantren yang selesai diverifikasi oleh tim admin."
                icon={<Building2 className="w-8 h-8 text-slate-400" />}
              />
            </div>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
