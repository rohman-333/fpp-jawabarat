'use client';

import { useState } from 'react';
import { updateSellerApplicationStatus } from '@/app/(dashboard)/dashboard/seller/actions';
import { Store, Check, X, Loader2, MapPin, Phone, User, Calendar } from 'lucide-react';
import Link from 'next/link';

export function SellerApplicationList({ initialData }: { initialData: any[] }) {
  const [applications, setApplications] = useState(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUpdate = async (id: string, status: 'approved' | 'rejected') => {
    setLoadingId(id);
    const res = await updateSellerApplicationStatus(id, status);
    
    if (res?.success) {
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status } : app
      ));
    } else {
      alert(res?.error || 'Terjadi kesalahan');
    }
    setLoadingId(null);
  };

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        Belum ada pengajuan toko saat ini.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {applications.map(app => (
        <div key={app.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{app.shop_name || app.store_name || 'Toko Tanpa Nama'}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {app.profiles?.name || 'User'}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(app.created_at).toLocaleDateString('id-ID')}</span>
                  <span className="uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{app.business_category || app.category || 'Lainnya'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center sm:justify-end gap-2">
              {app.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleUpdate(app.id, 'rejected')}
                    disabled={loadingId === app.id}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Tolak
                  </button>
                  <button
                    onClick={() => handleUpdate(app.id, 'approved')}
                    disabled={loadingId === app.id}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {loadingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Setujui
                  </button>
                </>
              ) : (
                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase ${app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {app.status}
                </span>
              )}
            </div>
          </div>
          
          <div className="p-4 sm:p-6 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Deskripsi Usaha</h4>
                  <p className="text-sm text-slate-700">{app.description || '-'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Alasan Bergabung</h4>
                  <p className="text-sm text-slate-700 italic">{app.reason || '-'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kontak & Lokasi</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" /> {app.applicant_email || 'Email tidak tersedia'}
                    </p>
                    <p className="text-sm text-slate-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" /> {app.whatsapp}
                    </p>
                    <p className="text-sm text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" /> {app.address}
                    </p>
                  </div>
                </div>
                {app.status !== 'pending' && app.reviewed_by && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ditinjau Oleh</h4>
                    <p className="text-sm text-slate-700">Admin ID: {app.reviewed_by}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
