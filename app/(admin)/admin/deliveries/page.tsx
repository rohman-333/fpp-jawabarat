// app/(admin)/admin/deliveries/page.tsx
import { canAccessAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { LogisticsClient } from '../logistics/LogisticsClient';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !canAccessAdmin(profile)) redirect('/dashboard');

  const [servicesRes, zonesRes, faresRes, methodsRes, couriersRes, deliveriesRes, payoutsRes, settingsRes] = await Promise.all([
    supabase.from('service_types').select('*').order('sort_order', { ascending: true }),
    supabase.from('delivery_zones').select('*').order('name', { ascending: true }),
    supabase.from('delivery_fare_rules').select('*, service_types(name), delivery_zones!zone_id(name)'),
    supabase.from('shipping_methods').select('*').order('sort_order', { ascending: true }),
    supabase.from('courier_profiles').select('*, user:user_id(name, phone)'),
    supabase.from('deliveries').select('*, service_types(name), courier:courier_id(name)').order('created_at', { ascending: false }).limit(20),
    supabase.from('courier_payouts').select('*, courier:courier_id(name)').order('created_at', { ascending: false }),
    supabase.from('logistics_settings').select('*')
  ]);

  const settingsMap: Record<string, any> = {};
  if (settingsRes.data) {
    settingsRes.data.forEach((s: any) => {
      settingsMap[s.key] = s.value;
    });
  }

  const role = profile?.role || 'user';
  const isAdmin = role === 'admin' || role === 'superadmin';

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={isAdmin}
        userName={profile?.name || 'Admin'} 
        avatarUrl={profile?.avatar_url} 
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Logistics Control Center" userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <LogisticsClient
            initialServices={servicesRes.data || []}
            initialZones={zonesRes.data || []}
            initialFares={faresRes.data || []}
            initialMethods={methodsRes.data || []}
            initialCouriers={couriersRes.data || []}
            initialDeliveries={deliveriesRes.data || []}
            initialPayouts={payoutsRes.data || []}
            initialSettings={settingsMap}
            initialTab="overview"
          />
        </main>
      </div>
    </div>
  );
}
