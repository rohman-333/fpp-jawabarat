'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, XCircle, FileText, Users, Target, MapPin, Building2, Smartphone } from 'lucide-react';
import { setPesantrenStatus } from '@/app/(admin)/admin/pesantren/actions';

export function PesantrenDetailView({ pesantren }: { pesantren: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState(pesantren.rejection_reason || '');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleUpdateStatus = async (status: string) => {
    if (status === 'rejected' && !rejectReason) {
      alert('Mohon isi alasan penolakan.');
      return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('id', pesantren.id);
    formData.append('status', status);
    if (status === 'rejected') {
      formData.append('rejection_reason', rejectReason);
    }
    
    try {
      await setPesantrenStatus(formData);
      router.refresh();
      setShowRejectForm(false);
    } catch (e) {
      alert('Gagal memperbarui status');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header / Status */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {pesantren.logo_url ? <img src={pesantren.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <Building2 className="w-8 h-8 text-slate-400" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{pesantren.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                {pesantren.status === 'verified' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5"/> Verified</span>}
                {pesantren.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-wider"><Clock className="w-3.5 h-3.5"/> Pending</span>}
                {pesantren.status === 'rejected' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wider"><XCircle className="w-3.5 h-3.5"/> Rejected</span>}
                
                <span className="text-slate-500 text-sm">Oleh: {pesantren.profiles?.name}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {pesantren.status !== 'verified' && (
              <Button 
                onClick={() => handleUpdateStatus('verified')}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex-1 md:flex-none"
              >
                Setujui (Verify)
              </Button>
            )}
            
            {pesantren.status !== 'rejected' && !showRejectForm && (
              <Button 
                onClick={() => setShowRejectForm(true)}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex-1 md:flex-none"
              >
                Tolak
              </Button>
            )}
          </div>
        </div>

        {showRejectForm && (
          <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100">
            <h4 className="text-sm font-bold text-red-800 mb-2">Alasan Penolakan</h4>
            <textarea 
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full p-3 rounded-lg border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
              rows={3}
              placeholder="Jelaskan alasan mengapa pengajuan ini ditolak..."
            />
            <div className="flex gap-2 justify-end mt-3">
              <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)} className="text-slate-600">Batal</Button>
              <Button size="sm" onClick={() => handleUpdateStatus('rejected')} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">Simpan Penolakan</Button>
            </div>
          </div>
        )}
        
        {pesantren.status === 'rejected' && pesantren.rejection_reason && (
          <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100 text-sm">
            <span className="font-bold text-red-800 block mb-1">Alasan Penolakan:</span>
            <span className="text-red-700">{pesantren.rejection_reason}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Identitas & Legalitas</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
              <div>
                <span className="text-slate-500 block mb-1">NSPP</span>
                <span className="font-bold text-slate-800">{pesantren.nspp || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Tahun Berdiri</span>
                <span className="font-bold text-slate-800">{pesantren.tahun_berdiri || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Pendiri</span>
                <span className="font-bold text-slate-800">{pesantren.pendiri || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Pengasuh Saat Ini</span>
                <span className="font-bold text-slate-800">{pesantren.pengasuh || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Jenis Pesantren</span>
                <span className="font-bold text-slate-800 capitalize">{pesantren.jenis_pesantren || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Punya Lembaga Formal?</span>
                <span className="font-bold text-slate-800">{pesantren.lembaga_formal ? 'Ya' : 'Tidak (Hanya Salaf/Diniyah)'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Target className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Profil & Potensi</h3>
            </div>
            <div className="p-6 space-y-6 text-sm">
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Program Pendidikan Unggulan</span>
                <p className="text-slate-800 leading-relaxed">{pesantren.program_unggulan || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Potensi Ekonomi / Unit Usaha</span>
                <p className="text-slate-800 leading-relaxed">{pesantren.potensi_ekonomi || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Koperasi / BMT Santri</span>
                <p className="text-slate-800 leading-relaxed">{pesantren.koperasi_bmt_usaha || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Kebutuhan Utama Saat Ini</span>
                <p className="text-slate-800 leading-relaxed">{pesantren.kebutuhan_utama || '-'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Target className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Sinergi & Digitalisasi</h3>
            </div>
            <div className="p-6 space-y-6 text-sm">
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Minat Digital & AI</span>
                <p className="text-slate-800 leading-relaxed">{pesantren.minat_digital_ai || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Saran untuk Pemda</span>
                <p className="text-slate-800 leading-relaxed">{pesantren.saran_pemda || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block mb-1">Harapan untuk Forum PP</span>
                <p className="text-slate-800 leading-relaxed">{pesantren.harapan_pemda_forum || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Contact */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Data Santri & SDM</h3>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-500">Santri SD/MI</span>
                <span className="font-bold text-slate-800">{pesantren.santri_sd || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-500">Santri SMP/MTs</span>
                <span className="font-bold text-slate-800">{pesantren.santri_smp || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-500">Santri SMA/MA</span>
                <span className="font-bold text-slate-800">{pesantren.santri_sma || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-500">Total Guru/Ustadz</span>
                <span className="font-bold text-slate-800">{pesantren.guru_ustadz || 0}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-slate-800">Total Santri Aktif</span>
                <span className="font-black text-emerald-600 text-lg">
                  {(pesantren.santri_sd || 0) + (pesantren.santri_smp || 0) + (pesantren.santri_sma || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Kontak & Alamat</h3>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <span className="flex items-center gap-2 text-slate-500 mb-1"><Smartphone className="w-4 h-4"/> No. HP / WA</span>
                <span className="font-bold text-slate-800">{pesantren.hp || pesantren.phone || '-'}</span>
              </div>
              <div>
                <span className="flex items-center gap-2 text-slate-500 mb-1">Sosial Media / Web</span>
                <span className="font-bold text-blue-600">{pesantren.media_sosial || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Alamat Lengkap</span>
                <span className="font-medium text-slate-800 leading-relaxed block">{pesantren.alamat_desa}</span>
                <span className="font-medium text-slate-800 block">Kec. {pesantren.kecamatan}</span>
                <span className="font-medium text-slate-800 block">{pesantren.city || ''} {pesantren.province || ''}</span>
              </div>
            </div>
          </div>

          {pesantren.foto_url && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <h3 className="font-bold text-slate-800">Foto Fasilitas</h3>
              </div>
              <div className="p-4">
                <img src={pesantren.foto_url} alt="Fasilitas" className="w-full h-auto rounded-xl" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
