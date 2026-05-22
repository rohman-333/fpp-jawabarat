'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Users, Search, Shield, ShieldCheck, ShieldAlert,
  Clock, CheckCircle, AlertCircle, Loader2, User
} from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

const VALID_ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'user', label: 'User' },
  { value: 'seller', label: 'Seller' },
  { value: 'courier', label: 'Kurir' },
  { value: 'team', label: 'Team' },
  { value: 'operator', label: 'Operator' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
];

interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  profile_completed: boolean;
  is_seller: boolean;
  is_courier: boolean;
  email?: string; // From auth.users join, only on server
}

export function AdminUsersClient({ users, currentUserId }: { users: UserProfile[]; currentUserId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [userList, setUserList] = useState(users);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const changeRole = async (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      showToast('Anda tidak bisa mengubah role diri sendiri.', 'error');
      return;
    }
    
    startTransition(async () => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        let msg = `Gagal mengubah role: ${error.message}`;
        if (error.code === '23514') {
          msg = `Role "${newRole}" tidak valid dalam constraint database. Role yang diizinkan: member, admin, superadmin, operator, team, seller, courier, user`;
        }
        showToast(msg, 'error');
      } else {
        setUserList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        showToast(`Role berhasil diubah ke ${newRole}`);
      }
    });
  };

  const filtered = userList.filter(u => {
    const matchesSearch = !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase"><ShieldCheck className="w-3 h-3" /> Superadmin</span>;
      case 'admin':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 uppercase"><Shield className="w-3 h-3" /> Admin</span>;
      case 'team':
      case 'operator':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700 border border-teal-200 uppercase"><ShieldAlert className="w-3 h-3" /> {role}</span>;
      case 'seller':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase">Seller</span>;
      case 'courier':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase">Kurir</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">{role || 'user'}</span>;
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-bold">{toast.text}</span>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daftar Pengguna</h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola {userList.length} pengguna terdaftar. Ubah role dan akses pengguna.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / email..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="relative shrink-0">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer font-medium text-slate-700 pr-8"
            >
              <option value="all">Semua Role</option>
              {VALID_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label} ({userList.filter(u => u.role === r.value).length})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-black text-slate-800">{userList.length}</div>
          <div className="text-xs text-slate-500 font-medium">Total User</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-black text-blue-600">{userList.filter(u => ['admin', 'superadmin'].includes(u.role)).length}</div>
          <div className="text-xs text-slate-500 font-medium">Admin/Superadmin</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-black text-emerald-600">{userList.filter(u => u.is_seller).length}</div>
          <div className="text-xs text-slate-500 font-medium">Seller</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-black text-amber-600">{userList.filter(u => u.is_courier).length}</div>
          <div className="text-xs text-slate-500 font-medium">Kurir</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="p-12">
            <EmptyState 
              title="Tidak Ada Pengguna"
              description="Tidak ada pengguna yang cocok dengan pencarian atau filter."
              icon={<Users className="w-10 h-10 text-slate-300" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Pengguna</th>
                  <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Terdaftar</th>
                  <th className="py-4 px-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ubah Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/branding/logo-square.png'; }} />
                          ) : (
                            <User className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm line-clamp-1">{u.name || '(Belum diisi)'}</p>
                          {u.username && <p className="text-xs text-slate-400">@{u.username}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-slate-600 font-medium">
                      {u.email || '-'}
                    </td>
                    <td className="py-3.5 px-5">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-3.5 px-5 text-sm text-slate-500">
                      {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <select 
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          disabled={isPending || u.id === currentUserId}
                          className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pl-2 pr-6 py-1 appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {VALID_ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
