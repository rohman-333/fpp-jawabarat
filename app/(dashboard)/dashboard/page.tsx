import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Star, MessageSquare, Landmark, PenSquare, Eye } from 'lucide-react';
import Link from 'next/link';
import { LegacyPasswordBanner } from '@/components/shared/LegacyPasswordBanner';

export default async function DashboardPage() {
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

  if (!profile) {
    redirect('/login');
  }

  const { data: pesantren } = await supabase
    .from('pesantren')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  let productsCount = 0;
  if (pesantren) {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('pesantren_id', pesantren.id);
    productsCount = count || 0;
  }

  const { count: forumPostsCount } = await supabase
    .from('forum_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id);

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={false} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Dashboard Pesantren" userName={profile.name || 'Pesantren'} avatarUrl={profile.avatar_url} />

        <main className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <LegacyPasswordBanner 
              legacyUserId={profile.legacy_user_id} 
              passwordChangedAt={profile.password_changed_at} 
            />

            {/* Welcome Banner */}
            <div className="bg-emerald-950 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden shadow-lg border border-emerald-900">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Ahlan wa Sahlan, {profile.name}!</h2>
                  <p className="text-emerald-100/80 max-w-xl text-sm md:text-base">
                    Kelola data pesantren, pasarkan produk di marketplace, dan berinteraksi di forum musyawarah FPP JAWABARAT.
                  </p>
                </div>
                {!pesantren && (
                  <Link href="/dashboard/pesantren/edit">
                    <Button className="bg-yellow-500 hover:bg-yellow-400 text-emerald-950 font-bold whitespace-nowrap">
                      <Landmark className="w-4 h-4 mr-2" /> Lengkapi Data
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {pesantren && pesantren.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 p-4 md:p-6 rounded-2xl mb-8 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-amber-900 mb-1">Menunggu Verifikasi Admin</h2>
                  <p className="text-amber-700/80 text-sm">Data pesantren Anda sedang ditinjau oleh tim FPP JAWABARAT. Fitur marketplace mungkin dibatasi hingga akun Anda berstatus terverifikasi.</p>
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
              <StatCard 
                title="Total Produk" 
                value={productsCount} 
                icon={<ShoppingBag className="w-6 h-6" />} 
              />
              <StatCard 
                title="Status Pesantren" 
                value={pesantren ? (pesantren.status === 'verified' ? 'Terverifikasi' : 'Tertunda') : 'Belum Ada'} 
                icon={<Star className="w-6 h-6" />} 
              />
              <StatCard 
                title="Postingan Forum" 
                value={forumPostsCount || 0} 
                icon={<MessageSquare className="w-6 h-6" />} 
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Info Pesantren */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                    <h2 className="text-lg font-bold text-slate-800">Informasi Pesantren</h2>
                    {pesantren && (
                      <Link href="/dashboard/pesantren/edit">
                        <Button variant="ghost" size="sm" className="text-emerald-600">
                          <PenSquare className="w-4 h-4 mr-2" /> Edit
                        </Button>
                      </Link>
                    )}
                  </div>
                  
                  {pesantren ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Pesantren</p>
                        <p className="font-bold text-slate-800">{pesantren.name}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">NSPP</p>
                        <p className="font-semibold text-slate-700 bg-slate-100 inline-block px-2 py-0.5 rounded text-sm font-mono">{pesantren.nspp || 'Belum diatur'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alamat</p>
                        <p className="font-medium text-slate-700 text-sm leading-relaxed">{pesantren.address || '-'}, {pesantren.alamat_desa}, {pesantren.kecamatan}, {pesantren.city}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kontak Resmi</p>
                        <p className="font-medium text-slate-800 text-sm">{pesantren.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tahun Berdiri</p>
                        <p className="font-medium text-slate-800 text-sm">{pesantren.tahun_berdiri || '-'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Landmark className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 text-sm mb-4">Anda belum melengkapi profil pesantren.</p>
                      <Link href="/dashboard/pesantren/edit">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Lengkapi Sekarang</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Quick Actions */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Aksi Cepat</h2>
                  <div className="grid gap-3">
                    <Link href="/dashboard/products/new" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">Tambah Produk</p>
                        <p className="text-xs text-slate-500">Jual di Marketplace</p>
                      </div>
                    </Link>
                    
                    <Link href="/forum" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">Buat Postingan</p>
                        <p className="text-xs text-slate-500">Diskusi di Forum</p>
                      </div>
                    </Link>

                    <Link href="/pesantren" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">Lihat Direktori</p>
                        <p className="text-xs text-slate-500">Cari pesantren lain</p>
                      </div>
                    </Link>
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
