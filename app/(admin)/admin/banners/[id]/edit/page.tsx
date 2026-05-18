import { BannerForm } from '../../BannerForm';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { canAccessAdmin } from '@/lib/auth/roles';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';

export default async function EditBannerPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !canAccessAdmin(profile)) redirect('/dashboard');

  const { data: banner } = await supabase.from('site_banners').select('*').eq('id', params.id).single();

  if (!banner) notFound();

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar isAdmin={true} userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Kelola Banner & Iklan" userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <BannerForm initialData={banner} />
        </main>
      </div>
    </div>
  );
}
