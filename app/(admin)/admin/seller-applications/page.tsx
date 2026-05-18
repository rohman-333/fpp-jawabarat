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

  const { data: applications } = await supabase
    .from('seller_applications')
    .select(`
      *,
      profiles:user_id(name, email)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Store className="w-6 h-6 text-emerald-600" /> Tinjau Pengajuan Toko
        </h1>
        <p className="text-slate-500 text-sm mt-1">Kelola permohonan pembukaan toko oleh pengguna (Seller).</p>
      </div>

      <SellerApplicationList initialData={applications || []} />
    </div>
  );
}
