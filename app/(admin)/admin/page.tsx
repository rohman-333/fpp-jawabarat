import { canAccessAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { StatCard } from '@/components/shared/StatCard';
import { Users, Building2, ShoppingCart, AlertCircle, ShoppingBag, Landmark, MessageSquare, FolderHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || (!canAccessAdmin(profile))) {
    redirect('/dashboard');
  }

  const { count: pesantrenCount } = await supabase.from('pesantren').select('*', { count: 'exact', head: true });
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: forumCount } = await supabase.from('forum_posts').select('*', { count: 'exact', head: true });
  const { count: programCount } = await supabase.from('programs').select('*', { count: 'exact', head: true });
  const { count: donationCount } = await supabase.from('donations').select('*', { count: 'exact', head: true });
  
  const { data: pendingPesantren } = await supabase
    .from('pesantren')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={true} 
        userName={profile?.name || 'Admin'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Admin Overview" userName={profile.name || 'Admin'} avatarUrl={profile.avatar_url} />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Statistik Platform</h1>
            <p className="text-slate-500 text-sm">Ringkasan aktivitas platform FPP JAWABARAT</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 mb-10">
            <StatCard 
              title="Pesantren" 
              value={pesantrenCount || 0} 
              icon={<Landmark className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard 
              title="Pengguna" 
              value={userCount || 0} 
              icon={<Users className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard 
              title="Produk" 
              value={productCount || 0} 
              icon={<ShoppingBag className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard 
              title="Forum Post" 
              value={forumCount || 0} 
              icon={<MessageSquare className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard 
              title="Program" 
              value={programCount || 0} 
              icon={<FolderHeart className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard 
              title="Donasi" 
              value={donationCount || 0} 
              icon={<Building2 className="w-5 h-5 text-emerald-600" />}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Verifikasi Pesantren</h2>
                    <p className="text-slate-500 text-sm">Menunggu persetujuan admin</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 whitespace-nowrap">Lihat Semua</Button>
                </div>
                
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Pesantren</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Lokasi</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal Daftar</th>
                        <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingPesantren && pendingPesantren.length > 0 ? (
                        pendingPesantren.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="py-4 font-bold text-slate-800 text-sm">{p.name}</td>
                            <td className="py-4 text-slate-600 text-sm">{p.city || '-'}</td>
                            <td className="py-4 text-slate-500 text-sm">{new Date(p.created_at).toLocaleDateString('id-ID')}</td>
                            <td className="py-4 text-right">
                              <Button size="sm" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-none">Tinjau</Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-500 text-sm bg-slate-50/50 rounded-xl mt-4 border border-dashed border-slate-200">
                            Tidak ada pengajuan pesantren baru.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List */}
                <div className="md:hidden space-y-4">
                  {pendingPesantren && pendingPesantren.length > 0 ? (
                    pendingPesantren.map(p => (
                      <div key={p.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-sm mb-1">{p.name}</h3>
                        <p className="text-slate-500 text-xs mb-3">{p.city || '-'} • {new Date(p.created_at).toLocaleDateString('id-ID')}</p>
                        <Button size="sm" className="w-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none font-bold">Tinjau Data</Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      Tidak ada pengajuan pesantren baru.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Moderasi Konten</h2>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Laporan Forum</h3>
                      <p className="text-xs text-slate-500 mb-2">3 post dilaporkan oleh komunitas</p>
                      <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Tinjau Laporan &rarr;</button>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Review Produk</h3>
                      <p className="text-xs text-slate-500 mb-2">12 produk menunggu persetujuan</p>
                      <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Tinjau Produk &rarr;</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
