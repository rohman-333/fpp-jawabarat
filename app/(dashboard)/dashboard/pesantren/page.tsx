import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Building2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { resolveMediaUrl } from '@/lib/media/resolveMediaUrl';

export default async function PesantrenDashboardPage() {
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

  const { data: pesantren } = await supabase
    .from('pesantren')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar 
        isAdmin={profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'operator' || profile?.role === 'team'} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Profil Pesantren" userName={profile?.name || 'Pesantren'} avatarUrl={profile?.avatar_url} />

        <main className="p-8">
          {!pesantren ? (
            <div className="max-w-3xl mx-auto mt-10">
              <EmptyState 
                title="Data Pesantren Kosong" 
                description="Anda belum melengkapi data profil pesantren. Data ini diperlukan agar pesantren Anda dapat tampil di direktori resmi dan bisa menggunakan fitur marketplace." 
                icon={<Building2 className="w-8 h-8 text-slate-400" />}
                action={
                  <Link href="/dashboard/pesantren/edit">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold mt-2">
                      Lengkapi Data Pesantren
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Detail Pesantren</h1>
                <Link href="/dashboard/pesantren/edit">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Pencil className="w-4 h-4" /> Edit Data
                  </Button>
                </Link>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-48 bg-blue-900 relative">
                  {resolveMediaUrl(pesantren.foto_url) ? (
                    <img src={resolveMediaUrl(pesantren.foto_url)!} alt="Foto Pesantren" className="w-full h-full object-cover opacity-80" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/branding/logo.png'; }} />
                  ) : (
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 to-transparent"></div>
                </div>
                <div className="px-8 pb-8 relative">
                  <div className="w-24 h-24 bg-white rounded-xl shadow-md border-4 border-white flex items-center justify-center text-4xl font-bold text-blue-600 -mt-12 mb-4 overflow-hidden z-10 relative">
                    {resolveMediaUrl(pesantren.logo_url) ? (
                      <img src={resolveMediaUrl(pesantren.logo_url)!} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/branding/logo-square.png'; }} />
                    ) : pesantren.name.charAt(0)}
                  </div>

                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900">{pesantren.name}</h2>
                    <p className="text-slate-500 font-medium">{pesantren.nspp ? `NSPP: ${pesantren.nspp}` : 'NSPP Belum diisi'}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Informasi Utama</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Pendiri</p>
                          <p className="font-semibold text-slate-800">{pesantren.pendiri || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Pengasuh Saat Ini</p>
                          <p className="font-semibold text-slate-800">{pesantren.pengasuh || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Tahun Berdiri</p>
                          <p className="font-semibold text-slate-800">{pesantren.tahun_berdiri || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Jenis Pesantren</p>
                          <p className="font-semibold text-slate-800 capitalize">{pesantren.jenis_pesantren || '-'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Kontak & Lokasi</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Nomor HP/WhatsApp</p>
                          <p className="font-semibold text-slate-800">{pesantren.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Alamat Lengkap</p>
                          <p className="font-semibold text-slate-800">{pesantren.address || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Desa & Kecamatan</p>
                          <p className="font-semibold text-slate-800">{pesantren.alamat_desa || '-'}, {pesantren.kecamatan || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Kabupaten/Kota</p>
                          <p className="font-semibold text-slate-800">{pesantren.city || '-'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Profil Pengembangan</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Program Unggulan</p>
                          <p className="font-semibold text-slate-800">{pesantren.program_unggulan || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Potensi Ekonomi</p>
                          <p className="font-semibold text-slate-800">{pesantren.potensi_ekonomi || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Kebutuhan Utama</p>
                          <p className="font-semibold text-slate-800">{pesantren.kebutuhan_utama || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Minat Ekosistem Digital AI</p>
                          <p className="font-semibold text-slate-800">{pesantren.minat_digital_ai || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
