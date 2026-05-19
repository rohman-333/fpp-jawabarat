import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { CourierJobsList } from './CourierJobsList';

export default async function CourierJobsPage() {
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

  if (!profile?.is_courier || profile?.courier_status !== 'approved') {
    redirect('/dashboard/courier/apply');
  }

  // Fetch courier specific profile details
  const { data: courierProfile } = await supabase
    .from('courier_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch active deliveries matching the courier profile:
  // 1. Current Active assigned to this courier
  const { data: activeDeliveries } = await supabase
    .from('deliveries')
    .select(`
      *,
      service_types(code, name)
    `)
    .eq('courier_id', user.id)
    .not('status', 'in', '("completed","cancelled","rejected")')
    .order('created_at', { ascending: false });

  // 2. Completed Jobs by this courier
  const { data: completedDeliveries } = await supabase
    .from('deliveries')
    .select(`
      *,
      service_types(code, name)
    `)
    .eq('courier_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  // 3. New available jobs waiting for assignment in this zone
  let newJobsQuery = supabase
    .from('deliveries')
    .select(`
      *,
      service_types(code, name)
    `)
    .eq('status', 'waiting_assignment')
    .is('courier_id', null);

  // Filter new available jobs based on courier capabilities
  const { data: availableDeliveries } = await newJobsQuery.order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar 
        isAdmin={profile?.role === 'admin' || profile?.role === 'operator'} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar 
          title="Tugas Kurir" 
          userName={profile?.name || 'User'} 
          avatarUrl={profile?.avatar_url} 
        />

        <main className="p-4 sm:p-8 overflow-y-auto">
          <CourierJobsList 
            available={availableDeliveries || []}
            active={activeDeliveries || []}
            completed={completedDeliveries || []}
            courierProfile={courierProfile}
          />
        </main>
      </div>
    </div>
  );
}
