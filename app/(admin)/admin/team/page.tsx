import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Plus, Mail, Clock, MoreVertical, ShieldAlert } from 'lucide-react';
import { getDisplayRole, isSuperAdmin } from '@/lib/auth/roles';

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: currentUser } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-600">Hanya Superadmin yang dapat mengakses manajemen Team FPP.</p>
      </div>
    );
  }

  // Fetch Team Members
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'team', 'superadmin'])
    .order('created_at', { ascending: false });

  // Fetch Pending Invitations
  const { data: invitations } = await supabase
    .from('team_invitations')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" /> Manajemen Team Internal
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kelola akses tim dan administrator WIBAWA NUSANTARA</p>
        </div>
        <Link 
          href="/admin/team/invite"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Undang Team Baru
        </Link>
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
            <h2 className="font-bold text-orange-800 flex items-center gap-2">
              <Mail className="w-5 h-5" /> Undangan Menunggu ({invitations.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {invitations.map(inv => (
              <div key={inv.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-800">{inv.name}</h3>
                  <p className="text-sm text-slate-500">{inv.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">
                    {inv.role === 'admin' ? 'Admin' : 'Team'}
                  </span>
                  {inv.team_division && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold capitalize">
                      {inv.team_division}
                    </span>
                  )}
                  <span className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold">
                    <Clock className="w-3 h-3" /> Kedaluwarsa {new Date(inv.expires_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Daftar Anggota Aktif</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Nama Pengguna</th>
                <th className="px-6 py-3">Role Akses</th>
                <th className="px-6 py-3">Divisi</th>
                <th className="px-6 py-3">Bergabung</th>
                <th className="px-6 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamMembers?.map(member => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                        {member.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{member.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      member.role === 'superadmin' ? 'bg-red-50 text-red-700' :
                      member.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {member.role === 'superadmin' ? 'Superadmin' : member.role === 'admin' ? 'Admin' : 'Team Internal'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {member.team_division ? (
                      <span className="capitalize text-slate-700 font-medium">{member.team_division}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(member.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    {member.role !== 'superadmin' && (
                      <button className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-200 rounded">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
