'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getAuthMigrationStats, 
  sendResetPasswordAdmin, 
  updateLegacyEmailAdmin 
} from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  UserX, 
  MailWarning, 
  RefreshCw, 
  Search, 
  Send, 
  Edit3, 
  Check, 
  AlertCircle,
  Database,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function AdminAuthMigrationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [editEmailId, setEditEmailId] = useState<string | null>(null);
  const [newEmailVal, setNewEmailVal] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuthMigrationStats();
      if (res.success) {
        setData(res);
      } else {
        setError(res.error || 'Gagal memuat statistik migrasi.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleSendReset = async (userId: string, email: string) => {
    setActionLoadingId(userId + '-reset');
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await sendResetPasswordAdmin(userId, email);
      if (res.success) {
        setSuccessMsg(`Link reset berhasil dibuat! ${res.recoveryLink ? `Tautan: ${res.recoveryLink}` : 'Email telah terkirim.'}`);
        loadStats();
      } else {
        setError(res.error || 'Gagal mengirim link reset.');
      }
    } catch (err) {
      setError('Terjadi kesalahan internal.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateEmail = async (userId: string) => {
    if (!newEmailVal || !newEmailVal.includes('@')) {
      alert('Masukkan email baru yang valid.');
      return;
    }
    setActionLoadingId(userId + '-email');
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await updateLegacyEmailAdmin(userId, newEmailVal);
      if (res.success) {
        setSuccessMsg(res.message || 'Email berhasil diperbarui.');
        setEditEmailId(null);
        setNewEmailVal('');
        loadStats();
      } else {
        setError(res.error || 'Gagal memperbarui email.');
      }
    } catch (err) {
      setError('Terjadi kesalahan internal.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-semibold">Memuat Data Migrasi Akun...</p>
      </div>
    );
  }

  const stats = data?.stats;
  const profiles = data?.profiles || [];
  const localUsers = data?.localUsers || [];

  const filteredProfiles = profiles.filter((p: any) => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.auth_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/admin" className="hover:text-blue-600 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" />
                Kembali ke Admin
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-600 animate-pulse" />
              Logistics & Account Migration Center
            </h1>
            <p className="text-slate-500 mt-1">
              Pantau migrasi akun, perbarui email local, dan kirim pemulihan password secara aman.
            </p>
          </div>
          <Button onClick={loadStats} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 rounded-xl h-11 shrink-0">
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 text-sm flex gap-3 items-start animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl mb-6 text-sm flex gap-3 items-start animate-in fade-in">
            <Check className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <div className="break-all font-medium">
              <p>{successMsg}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Profiles</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats?.totalProfiles || 0}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Auth Users</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats?.totalAuthUsers || 0}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Terhubung (Auth)</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats?.profilesWithAuth || 0}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
              <UserX className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Belum Terhubung</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats?.profilesWithoutAuth || 0}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
              <MailWarning className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Akun .local</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{stats?.localEmailCount || 0}</h3>
            </div>
          </div>
        </div>

        {/* Section 1: Legacy accounts (.local) requiring action */}
        {localUsers.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MailWarning className="w-5 h-5 text-amber-500" />
              Tindakan Diperlukan: Akun Placeholder (.local)
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Akun-akun berikut diimpor dengan email buatan `.local`. Anda harus memperbarui email mereka ke email aktif asli sebelum mereka dapat mengaktifkan akun dan login.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase">
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Email Placeholder</th>
                    <th className="py-3 px-4">Dibuat Pada</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {localUsers.map((u: any) => (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-sm">
                      <td className="py-4 px-4 font-mono text-xs text-slate-500">{u.id}</td>
                      <td className="py-4 px-4 font-semibold text-amber-700">{u.email}</td>
                      <td className="py-4 px-4 text-slate-500">{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="py-4 px-4 text-right">
                        {editEmailId === u.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="email"
                              value={newEmailVal}
                              onChange={(e) => setNewEmailVal(e.target.value)}
                              placeholder="email.aktif@gmail.com"
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            />
                            <Button 
                              onClick={() => handleUpdateEmail(u.id)}
                              disabled={actionLoadingId === u.id + '-email'}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg h-auto flex items-center gap-1"
                            >
                              {actionLoadingId === u.id + '-email' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Simpan
                            </Button>
                            <Button 
                              onClick={() => setEditEmailId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-xs px-2.5 py-1.5 rounded-lg h-auto"
                            >
                              Batal
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => {
                              setEditEmailId(u.id);
                              setNewEmailVal('');
                            }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs px-3 py-1.5 rounded-lg h-auto flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Perbarui Email
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 2: Profiles & Auth Users List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800">Daftar Akun & Status Migrasi</h2>
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, username, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase">
                  <th className="py-3 px-4">Nama / Username</th>
                  <th className="py-3 px-4">Role / Tipe</th>
                  <th className="py-3 px-4">Email Login (Auth)</th>
                  <th className="py-3 px-4">Status Migrasi</th>
                  <th className="py-3 px-4 text-right">Aksi Pemulihan</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map((p: any) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 text-sm">
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-800">{p.name || 'User Tanpa Nama'}</p>
                      <p className="text-xs text-slate-400">@{p.username || 'username'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-block bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md uppercase">
                        {p.role}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5 capitalize">{p.account_type?.replace('_', ' ')}</p>
                    </td>
                    <td className="py-4 px-4">
                      {p.auth_email ? (
                        <span className="font-medium text-slate-700">{p.auth_email}</span>
                      ) : (
                        <span className="text-xs text-rose-500 font-semibold">Tidak Ada Auth User</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {p.auth_email ? (
                        p.auth_email.endsWith('.local') ? (
                          <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2 py-1 rounded-full">
                            Butuh Update Email
                          </span>
                        ) : (
                          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2 py-1 rounded-full">
                            Aktif / Siap Pakai
                          </span>
                        )
                      ) : (
                        <span className="inline-block bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-2 py-1 rounded-full">
                          Unmigrated
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {p.auth_email && !p.auth_email.endsWith('.local') && (
                        <Button 
                          onClick={() => handleSendReset(p.id, p.auth_email)}
                          disabled={actionLoadingId === p.id + '-reset'}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg h-auto flex items-center gap-1.5 ml-auto"
                        >
                          {actionLoadingId === p.id + '-reset' ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          Kirim Reset
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProfiles.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                Tidak ada data profiles yang cocok dengan pencarian Anda.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
