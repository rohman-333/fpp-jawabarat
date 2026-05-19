import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { ServiceRequestForm } from './ServiceRequestForm';

export default async function NewServiceRequestPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/services/new');
  }

  // Fetch active service types to enforce feature flags
  const { data: serviceTypes } = await supabase
    .from('service_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  // Fetch active zones
  const { data: zones } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <PublicNavbar />

      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-8 mt-16 pb-20">
        <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-xl font-black text-slate-800">Buat Order Layanan Kurir</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Silakan isi formulir pemesanan pengantaran paket, belanja makanan, atau ojek santri di bawah ini.
            </p>
          </div>

          <ServiceRequestForm 
            serviceTypes={serviceTypes || []} 
            zones={zones || []} 
          />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
