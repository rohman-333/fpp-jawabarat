import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { CourierApplyClient } from './CourierApplyClient';

export default async function CourierApplyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // If already approved, go to main courier dashboard
  if (profile?.is_courier && profile?.courier_status === 'approved') {
    redirect('/dashboard/courier');
  }

  // Fetch active zones
  const { data: zones } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar 
        isAdmin={profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'operator' || profile?.role === 'team'} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar 
          title="Pendaftaran Kurir" 
          userName={profile?.name || 'User'} 
          avatarUrl={profile?.avatar_url} 
        />

        <main className="p-4 sm:p-8 overflow-y-auto">
          {profile?.courier_status === 'pending' ? (
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold animate-pulse">
                ⏳
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">Menunggu Persetujuan Admin</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Pendaftaran kemitraan kurir Anda telah berhasil kami terima dan saat ini sedang ditinjau oleh Administrator kami.
              </p>
              <p className="text-xs text-slate-400">
                Pemberitahuan akan dikirimkan ke akun Anda segera setelah ditinjau.
              </p>
            </div>
          ) : profile?.courier_status === 'rejected' ? (
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                ❌
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">Pendaftaran Ditolak</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Mohon maaf, pengajuan kemitraan kurir Anda belum disetujui karena ketidaksesuaian dokumen.
              </p>
              <div className="pt-4">
                <a 
                  href="/dashboard/courier/apply?reapply=true"
                  className="inline-block bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm"
                >
                  Ajukan Pendaftaran Ulang
                </a>
              </div>
            </div>
          ) : (
            <CourierApplyClient userId={user.id} zones={zones || []} />
          )}
        </main>
      </div>
    </div>
  );
}
