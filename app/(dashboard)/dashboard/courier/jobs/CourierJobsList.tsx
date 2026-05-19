'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { acceptDeliveryJob, updateDeliveryStep } from '@/app/actions/delivery';
import { 
  Truck, Package, MapPin, Phone, MessageSquare, Check, ArrowRight, ClipboardCheck, History, Landmark, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';

interface CourierJobsListProps {
  available: any[];
  active: any[];
  completed: any[];
  courierProfile: any;
}

export function CourierJobsList({ available, active, completed, courierProfile }: CourierJobsListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('active');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAccept = async (id: string) => {
    setLoading(id);
    setError(null);
    setSuccess(null);

    const res = await acceptDeliveryJob(id);

    setLoading(null);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess('Tugas berhasil diterima! Silakan selesaikan pengiriman.');
      setActiveTab('active');
      router.refresh();
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: string, logNote: string) => {
    setLoading(id);
    setError(null);
    setSuccess(null);

    const res = await updateDeliveryStep(id, nextStatus, logNote);

    setLoading(null);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(`Status pengiriman berhasil diperbarui menjadi: ${nextStatus.toUpperCase()}`);
      router.refresh();
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'waiting_assignment': return 'Menunggu Kurir';
      case 'assigned': return 'Ditugaskan';
      case 'accepted': return 'Diterima';
      case 'pickup': return 'Menuju Penjemputan';
      case 'picked_up': return 'Barang Diambil';
      case 'in_progress': return 'Dalam Perjalanan';
      case 'delivered': return 'Terkirim';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting_assignment': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pickup': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'picked_up': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'in_progress': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Notifications banner */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded-r-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs font-bold rounded-r-xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Tabs Header */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'active' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" /> Tugas Aktif ({active.length})
        </button>

        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'available' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" /> Tugas Baru ({available.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'completed' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" /> Riwayat ({completed.length})
        </button>
      </div>

      {/* Render selected Tab List */}
      <div className="space-y-4">
        {activeTab === 'active' && (
          active.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
              <span className="text-3xl block">📦</span>
              <h3 className="font-extrabold text-slate-800 text-sm">Tidak Ada Tugas Aktif</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Silakan lihat tab "Tugas Baru" untuk mengambil order pengantaran yang tersedia di zona Anda.</p>
            </div>
          ) : (
            active.map((job) => (
              <div key={job.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {job.service_types?.name || 'Pengantaran'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">#{job.id.substring(0, 8)}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusColor(job.status)}`}>
                    {getStatusLabel(job.status)}
                  </span>
                </div>

                {/* Routing Addresses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Titik Penjemputan / Seller</span>
                    <p className="font-extrabold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      {job.origin_name} ({job.origin_phone})
                    </p>
                    <p className="text-slate-500 pl-4.5">{job.origin_address || 'Alamat toko'}</p>
                    {job.pickup_note && <p className="text-[10px] text-amber-600 bg-amber-50 p-1.5 rounded-md italic mt-1">Catatan: {job.pickup_note}</p>}
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Titik Tujuan / Buyer</span>
                    <p className="font-extrabold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      {job.destination_name} ({job.destination_phone})
                    </p>
                    <p className="text-slate-500 pl-4.5">{job.destination_address}</p>
                    {job.delivery_note && <p className="text-[10px] text-blue-600 bg-blue-50 p-1.5 rounded-md italic mt-1">Catatan: {job.delivery_note}</p>}
                  </div>
                </div>

                {/* Description of packages */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span>{job.item_description || 'Paket Marketplace'} ({job.item_weight || 1} kg)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Pendapatan Anda</span>
                    <span className="font-extrabold text-slate-800">Rp {Number(job.courier_earning || Math.round(job.fare_amount * 0.8)).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Actions timeline for status changes */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                  {job.status === 'assigned' && (
                    <button
                      disabled={loading === job.id}
                      onClick={() => handleAccept(job.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all"
                    >
                      Terima Tugas <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {job.status === 'accepted' && (
                    <button
                      disabled={loading === job.id}
                      onClick={() => handleUpdateStatus(job.id, 'pickup', 'Kurir sedang menuju lokasi penjemputan barang.')}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all"
                    >
                      Mulai Menuju Penjemputan 🚀
                    </button>
                  )}

                  {job.status === 'pickup' && (
                    <button
                      disabled={loading === job.id}
                      onClick={() => handleUpdateStatus(job.id, 'picked_up', 'Barang belanjaan/paket sudah diterima oleh kurir dari pengirim.')}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all"
                    >
                      Tandai Barang Diambil ✅
                    </button>
                  )}

                  {job.status === 'picked_up' && (
                    <button
                      disabled={loading === job.id}
                      onClick={() => handleUpdateStatus(job.id, 'in_progress', 'Kurir sedang dalam perjalanan mengantar paket/belanjaan ke tujuan.')}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all"
                    >
                      Mulai Mengantar Paket 🏍️
                    </button>
                  )}

                  {job.status === 'in_progress' && (
                    <button
                      disabled={loading === job.id}
                      onClick={() => handleUpdateStatus(job.id, 'completed', 'Tugas selesai, barang telah sampai di penerima dengan selamat.')}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-1 shadow-md active:scale-95 transition-all"
                    >
                      Tandai Pengiriman Selesai 🏁
                    </button>
                  )}

                  <a 
                    href={`tel:${job.origin_phone}`}
                    className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" /> Telp Toko
                  </a>

                  <a 
                    href={`tel:${job.destination_phone}`}
                    className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" /> Telp Buyer
                  </a>
                </div>
              </div>
            ))
          )
        )}

        {/* available jobs */}
        {activeTab === 'available' && (
          available.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
              <span className="text-3xl block">📭</span>
              <h3 className="font-extrabold text-slate-800 text-sm">Tidak Ada Tugas Baru</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Saat ini belum ada order baru di zona Anda. Tetap stand-by dan aktifkan status online Anda.</p>
            </div>
          ) : (
            available.map((job) => (
              <div key={job.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {job.service_types?.name || 'Kurir'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">#{job.id.substring(0, 8)}</span>
                  </div>
                  <span className="bg-amber-50 text-amber-800 border border-amber-100 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    Tersedia
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Titik Penjemputan</span>
                    <p className="font-extrabold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      {job.origin_name}
                    </p>
                    <p className="text-slate-500 pl-4.5">{job.origin_address}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block uppercase tracking-wider text-[9px]">Titik Tujuan</span>
                    <p className="font-extrabold text-slate-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      {job.destination_name}
                    </p>
                    <p className="text-slate-500 pl-4.5">{job.destination_address}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block">Keterangan: {job.item_description || 'Paket Marketplace'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Tarif Bersih</span>
                    <span className="font-extrabold text-blue-600">Rp {Number(job.courier_earning || Math.round(job.fare_amount * 0.8)).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    disabled={loading === job.id}
                    onClick={() => handleAccept(job.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1"
                  >
                    {loading === job.id ? 'Memproses...' : 'Terima Tugas Sekarang'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {/* completed history list */}
        {activeTab === 'completed' && (
          completed.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
              <span className="text-3xl block">📜</span>
              <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Kosong</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Anda belum menyelesaikan tugas pengantaran apa pun.</p>
            </div>
          ) : (
            completed.map((job) => (
              <div key={job.id} className="bg-white border border-slate-100 rounded-3xl p-5 space-y-3 opacity-90 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700 font-bold">{job.service_types?.name}</span>
                    <span className="text-slate-400 font-mono">#{job.id.substring(0, 8)}</span>
                  </div>
                  <span className="bg-green-100 text-green-800 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Selesai
                  </span>
                </div>
                <div className="text-slate-500 space-y-1">
                  <p>🗺️ Dari: <strong className="text-slate-700">{job.origin_name}</strong> ({job.origin_address})</p>
                  <p>📍 Ke: <strong className="text-slate-700">{job.destination_name}</strong> ({job.destination_address})</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-400">Terselesaikan pada {new Date(job.completed_at || job.updated_at).toLocaleDateString('id-ID')}</span>
                  <span className="font-bold text-slate-700">Rp {Number(job.courier_earning).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
