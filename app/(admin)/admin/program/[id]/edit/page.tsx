import { ProgramForm } from '../../ProgramForm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { canAccessAdmin } from '@/lib/auth/roles';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !canAccessAdmin(profile)) redirect('/dashboard');

  const { data: program } = await supabase.from('programs').select('*').eq('id', id).single();

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar isAdmin={true} userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Manajemen Program Sinergi" userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {!program ? (
            <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Program Tidak Ditemukan</h2>
              <p className="text-slate-500 text-sm mb-6">Program dengan ID tersebut tidak ditemukan atau sudah dihapus.</p>
              <Link href="/admin/program" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-colors">
                <ArrowLeft className="w-5 h-5" /> Kembali ke Daftar
              </Link>
            </div>
          ) : (
            <ProgramForm initialData={program} />
          )}
        </main>
      </div>
    </div>
  );
}

