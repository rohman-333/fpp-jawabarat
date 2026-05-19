'use client';

import { useState } from 'react';
import { User, Phone, MapPin, Truck, Hash, Briefcase, Loader2, Send } from 'lucide-react';
import { submitCourierApplication } from '../actions';

export function CourierApplyForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await submitCourierApplication(formData);
    
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 block">Nama Lengkap <span className="text-red-500">*</span></label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              name="full_name"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Nama sesuai KTP"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 block">Nomor HP/WhatsApp <span className="text-red-500">*</span></label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="tel"
              name="whatsapp"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="081234567890"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 block">Area Layanan / Cakupan <span className="text-red-500">*</span></label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <textarea
            name="service_area"
            required
            rows={2}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            placeholder="Contoh: Kota Bandung, Kab. Bandung, dan sekitarnya"
          ></textarea>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 block">Jenis Kendaraan <span className="text-red-500">*</span></label>
          <div className="relative">
            <Truck className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <select
              name="vehicle_type"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="">Pilih Kendaraan</option>
              <option value="Motor">Motor</option>
              <option value="Mobil">Mobil / MPV</option>
              <option value="Pick Up">Pick Up / Bak Terbuka</option>
              <option value="Truk">Truk Box / Engkel</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 block">Nomor Plat Kendaraan</label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              name="license_plate"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Contoh: D 1234 ABC (Opsional)"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 block">Pengalaman Kurir / Logistik</label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <textarea
            name="experience"
            rows={3}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
            placeholder="Ceritakan singkat pengalaman Anda di bidang ekspedisi atau pengiriman barang..."
          ></textarea>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {loading ? 'Mengirim Lamaran...' : 'Kirim Lamaran Kurir'}
        </button>
      </div>
    </form>
  );
}
