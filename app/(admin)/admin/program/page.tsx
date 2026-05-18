import { canAccessAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { EmptyState } from '@/components/shared/EmptyState';
import { FolderHeart } from 'lucide-react';
import Link from 'next/link';

export default async function AdminProgramPage() {
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

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={true} 
        userName={profile?.name || 'Admin'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Manajemen Program Sinergi" userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Program Sinergi</h1>
            <p className="text-slate-500 text-sm mt-1">Kelola program unggulan dan galang donasi antar pesantren.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
            <EmptyState 
              title="Modul Segera Hadir" 
              description="Fitur manajemen program dan donasi sedang dalam tahap pengembangan dan akan segera tersedia pada pembaruan sistem berikutnya." 
              icon={<FolderHeart className="w-12 h-12 text-slate-300" />}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
