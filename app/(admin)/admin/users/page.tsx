import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users } from 'lucide-react';
import Link from 'next/link';

export default async function AdminUsersPage() {
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

  if (!profile || (profile.role !== 'admin' && profile.role !== 'operator')) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={true} 
        userName={profile?.name || 'Admin'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Manajemen Pengguna" userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Daftar Pengguna</h1>
            <p className="text-slate-500 text-sm mt-1">Kelola akses dan otorisasi pengguna platform.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
            <EmptyState 
              title="Modul Segera Hadir" 
              description="Fitur manajemen pengguna dan role sedang dalam tahap pengembangan dan akan segera tersedia pada pembaruan sistem berikutnya." 
              icon={<Users className="w-12 h-12 text-slate-300" />}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
