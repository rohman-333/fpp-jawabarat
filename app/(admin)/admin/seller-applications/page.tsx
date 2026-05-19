import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Store, ShieldAlert } from 'lucide-react';
import { SellerApplicationList } from './SellerApplicationList';

export default async function AdminSellerApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: currentUser } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!currentUser || !['superadmin', 'admin', 'team'].includes(currentUser.role)) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-600">Hanya Admin atau Tim FPP yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  const { data: applications, error } = await supabase
    .from('seller_applications')
    .select(`
      id, user_id, applicant_email, shop_name, store_name, business_category, category, description, whatsapp, address, reason, status, created_at,
      profiles:user_id(name, avatar_url, role, seller_status, is_seller)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[ADMIN_SELLER_APPLICATIONS_FETCH_ERROR]', error);
  }

  let combinedApplications: any[] = applications || [];

  // Fallback if seller_applications is somehow missing entries for pending profiles
  const { data: pendingProfiles } = await supabase
    .from('profiles')
    .select('id, name, seller_status, is_seller, created_at')
    .eq('seller_status', 'pending');

  if (pendingProfiles && pendingProfiles.length > 0) {
    const existingUserIds = combinedApplications.map(a => a.user_id);
    const fallbackApps = pendingProfiles
      .filter(p => !existingUserIds.includes(p.id))
      .map(p => ({
        id: `fallback-${p.id}`,
        user_id: p.id,
        applicant_email: null,
        shop_name: p.name || 'Toko Baru',
        store_name: p.name || 'Toko Baru',
        status: 'pending',
        created_at: p.created_at,
        profiles: { name: p.name, seller_status: p.seller_status, is_seller: p.is_seller }
      }));
    
    combinedApplications = [...combinedApplications, ...fallbackApps];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Store className="w-6 h-6 text-blue-600" /> Tinjau Pengajuan Toko
        </h1>
        <p className="text-slate-500 text-sm mt-1">Kelola permohonan pembukaan toko oleh pengguna (Seller).</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl">
          Terjadi kesalahan saat memuat data dari server: {error.message}
        </div>
      )}

      <SellerApplicationList initialData={combinedApplications} />
    </div>
  );
}
