import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { canAccessAdmin } from '@/lib/auth/roles';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { FolderHeart, Plus, Edit } from 'lucide-react';
import Link from 'next/link';

export default async function AdminProgramPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !canAccessAdmin(profile)) redirect('/dashboard');

  const { data: programs } = await supabase.from('programs').select('*').order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar isAdmin={true} userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Manajemen Program Sinergi" userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FolderHeart className="w-6 h-6 text-blue-600" /> Program Sinergi
              </h1>
              <p className="text-slate-500 text-sm mt-1">Kelola program unggulan dan galang donasi antar pesantren.</p>
            </div>
            <Link href="/admin/program/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-colors whitespace-nowrap">
              <Plus className="w-5 h-5" /> Tambah Program
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {programs && programs.length > 0 ? programs.map(prog => (
                    <tr key={prog.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-slate-800">{prog.title}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[250px]">{prog.description}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">
                          {prog.category || 'Umum'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {prog.status === 'published' ? (
                          <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">Published</span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100 capitalize">{prog.status}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/program/${prog.id}/edit`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                        Belum ada program yang ditambahkan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
