'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Landmark, Search, Filter, CheckCircle, Clock, XCircle, MapPin, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { setPesantrenStatus } from '@/app/(admin)/admin/pesantren/actions';

export function AdminPesantrenTable({ pesantrenList }: { pesantrenList: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQ = searchParams.get('q') || '';
  const currentStatus = searchParams.get('status') || 'all';

  const [q, setQ] = useState(currentQ);
  const [statusFilter, setStatusFilter] = useState(currentStatus);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(q, statusFilter);
  };

  const updateUrl = (searchQuery: string, status: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (status && status !== 'all') params.set('status', status);
    
    startTransition(() => {
      router.push(`/admin/pesantren?${params.toString()}`);
    });
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('status', newStatus);
      try {
        await setPesantrenStatus(formData);
      } catch (err) {
        console.error(err);
        alert('Gagal memperbarui status');
      }
    });
  };

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Direktori Pesantren</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data dan verifikasi pendaftaran pesantren di Jawa Barat.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama / kecamatan..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </form>
          <div className="relative shrink-0">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                updateUrl(q, e.target.value);
              }}
              className="w-full sm:w-auto pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer font-medium text-slate-700"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Tertunda (Pending)</option>
              <option value="verified">Terverifikasi (Verified)</option>
              <option value="rejected">Ditolak (Rejected)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
             <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        )}
        
        {(!pesantrenList || pesantrenList.length === 0) ? (
          <div className="p-12">
            <EmptyState 
              title="Data Tidak Ditemukan" 
              description="Tidak ada data pesantren yang cocok dengan pencarian atau filter yang diterapkan." 
              icon={<Landmark className="w-12 h-12 text-slate-300" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Pesantren</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Pengasuh</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Tgl Daftar</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pesantrenList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.logo_url ? (
                            <img src={p.logo_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <Landmark className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm line-clamp-1">{p.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{p.nspp ? `NSPP: ${p.nspp}` : 'NSPP: -'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                      {p.pengasuh || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{p.kecamatan || '-'}, {p.city || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-500">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      {p.status === 'verified' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider border border-emerald-200"><CheckCircle className="w-3 h-3"/> Verified</span>}
                      {p.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider border border-amber-200"><Clock className="w-3 h-3"/> Pending</span>}
                      {p.status === 'rejected' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider border border-red-200"><XCircle className="w-3 h-3"/> Rejected</span>}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="inline-flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm relative">
                          <select 
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value)}
                            disabled={isPending}
                            className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pl-2 pr-6 py-1 appearance-none z-10 w-full disabled:opacity-50"
                          >
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                             <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/admin/pesantren/${p.id}`)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200 shadow-sm"
                          title="Detail"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
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
