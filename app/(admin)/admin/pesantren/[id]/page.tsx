import { canAccessAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { Building2, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PesantrenDetailView } from './PesantrenDetailView';

export default async function AdminPesantrenDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const { data: pesantren } = await supabase
    .from('pesantren')
    .select(`
      *,
      profiles:profile_id(name, email, phone)
    `)
    .eq('id', id)
    .single();

  if (!pesantren) {
    redirect('/admin/pesantren');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={true} 
        userName={profile?.name || 'Admin'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Detail Pesantren" userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/pesantren" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-emerald-600" /> Profil Lengkap Pesantren
              </h1>
              <p className="text-slate-500 text-sm mt-1">ID Pengajuan: {pesantren.id}</p>
            </div>
          </div>

          <PesantrenDetailView pesantren={pesantren} />
        </main>
      </div>
    </div>
  );
}
