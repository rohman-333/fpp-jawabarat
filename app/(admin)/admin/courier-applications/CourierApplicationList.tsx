'use client';

import { useState } from 'react';
import { Truck, Check, X, Loader2, MapPin, Phone, User, Calendar, Hash, Briefcase } from 'lucide-react';
import { updateCourierApplicationStatus } from '@/app/(dashboard)/dashboard/courier/actions';

export function CourierApplicationList({ initialData }: { initialData: any[] }) {
  const [applications, setApplications] = useState(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleUpdate = async (id: string, status: 'approved' | 'rejected', reason: string = '') => {
    setLoadingId(id);
    const formData = new FormData();
    formData.append('id', id);
    formData.append('status', status);
    formData.append('rejection_reason', reason);

    const res = await updateCourierApplicationStatus(formData);
    
    if (res?.success) {
      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status, rejection_reason: reason } : app
      ));
    } else {
      alert(res?.error || 'Terjadi kesalahan');
    }
    setLoadingId(null);
  };

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        Belum ada lamaran kurir saat ini.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {applications.map(app => (
        <div key={app.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{app.full_name}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(app.created_at).toLocaleDateString('id-ID')}</span>
                  <span className="uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Truck className="w-3 h-3" /> {app.vehicle_type}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center sm:justify-end gap-2">
              {app.status === 'pending' ? (
                <>
                  <button
                    onClick={() => {
                      const reason = prompt('Masukkan alasan penolakan:');
                      if (reason !== null) {
                        handleUpdate(app.id, 'rejected', reason);
                      }
                    }}
                    disabled={loadingId === app.id}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> Tolak
                  </button>
                  <button
                    onClick={() => handleUpdate(app.id, 'approved')}
                    disabled={loadingId === app.id}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {loadingId === app.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Setujui
                  </button>
                </>
              ) : (
                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold uppercase ${app.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                  {app.status}
                </span>
              )}
            </div>
          </div>
          
          <div className="p-4 sm:p-6 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kontak & Area</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" /> {app.whatsapp}
                    </p>
                    <p className="text-sm text-slate-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" /> {app.service_area}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kendaraan</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-700 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400" /> {app.license_plate || 'Plat belum diisi'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Pengalaman
                  </h4>
                  <p className="text-sm text-slate-700 italic bg-white p-3 rounded-lg border border-slate-200 mt-2">
                    "{app.experience || 'Tidak ada pengalaman yang dituliskan.'}"
                  </p>
                </div>
                {app.status === 'rejected' && app.rejection_reason && (
                  <div>
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Alasan Penolakan</h4>
                    <p className="text-sm text-red-700">{app.rejection_reason}</p>
                  </div>
                )}
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
