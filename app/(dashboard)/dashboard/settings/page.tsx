import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Page() {
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

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'operator' || profile?.role === 'team'} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Pengaturan Tambahan" userName={profile?.name || 'User'} avatarUrl={profile?.avatar_url} />
        <main className="p-4 md:p-8 flex-1 flex">
          <PlaceholderPage title="Pengaturan Tambahan" />
        </main>
      </div>
    </div>
  );
}