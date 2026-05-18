import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { PesantrenStepperForm } from '../apply/PesantrenStepperForm';

export default async function EditPesantrenPage() {
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

  if (!pesantren) {
    redirect('/dashboard/pesantren/apply');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar 
        isAdmin={false} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Edit Profil Pesantren" userName={profile?.name || 'User'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 sm:p-8">
          <PesantrenStepperForm userId={user.id} initialData={pesantren} />
        </main>
      </div>
    </div>
  );
}
