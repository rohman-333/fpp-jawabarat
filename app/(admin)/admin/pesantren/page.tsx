import { canAccessAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { AdminPesantrenTable } from '@/components/admin/AdminPesantrenTable';

export default async function AdminPesantrenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
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

  const query = q || '';
  const statusFilter = status || 'all';

  let supabaseQuery = supabase
    .from('pesantren')
    .select('*')
    .order('created_at', { ascending: false });

  if (query) {
    supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,kecamatan.ilike.%${query}%`);
  }

  if (statusFilter !== 'all') {
    supabaseQuery = supabaseQuery.eq('status', statusFilter);
  }

  const { data: pesantrenList } = await supabaseQuery;

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={true} 
        userName={profile?.name || 'Admin'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Manajemen Pesantren" userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <AdminPesantrenTable pesantrenList={pesantrenList || []} />
        </main>
      </div>
    </div>
  );
}
