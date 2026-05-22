import { canAccessAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { AdminUsersClient } from './AdminUsersClient';

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

  if (!profile || (!canAccessAdmin(profile))) {
    redirect('/dashboard');
  }

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, username, avatar_url, role, created_at, profile_completed, is_seller, is_courier')
    .order('created_at', { ascending: false });

  // Securely fetch emails from auth.users via service role (server-side only)
  let emailMap: Record<string, string> = {};
  const adminClient = getSupabaseAdmin();
  if (adminClient) {
    try {
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (authUsersData?.users) {
        authUsersData.users.forEach((au: any) => {
          emailMap[au.id] = au.email || '';
        });
      }
    } catch (err) {
      console.error('[ADMIN_USERS] Failed to fetch auth users:', err);
    }
  }

  // Merge email into profiles
  const usersWithEmail = (profiles || []).map(p => ({
    ...p,
    email: emailMap[p.id] || '',
  }));

  const role = profile?.role || 'user';
  const isAdmin = role === 'superadmin' || role === 'admin' || role === 'operator' || role === 'team';

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={isAdmin} 
        userName={profile?.name || 'Admin'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Manajemen Pengguna" userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <AdminUsersClient users={usersWithEmail} currentUserId={user.id} />
        </main>
      </div>
    </div>
  );
}
