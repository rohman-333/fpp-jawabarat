'use client';

import { useState } from 'react';
import { Store, ShoppingBag, Phone, MapPin, AlignLeft, Info, Loader2 } from 'lucide-react';
import { submitSellerApplication } from '../actions';

export function SellerApplyForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await submitSellerApplication(formData);
    
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
          <label className="text-sm font-bold text-slate-700 block">Nama Toko / Usaha <span className="text-red-500">*</span></label>
          <div className="relative">
            <Store className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              name="shop_name"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Contoh: Toko Berkah Santri"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 block">Kategori Usaha <span className="text-red-500">*</span></label>
          <div className="relative">
            <ShoppingBag className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <select
              name="business_category"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="">Pilih Kategori</option>
              <option value="fashion">Fashion & Pakaian</option>
              <option value="makanan">Makanan & Minuman</option>
              <option value="buku">Buku & Kitab</option>
              <option value="kerajinan">Kerajinan Tangan</option>
              <option value="agrikultur">Pertanian & Peternakan</option>
              <option value="jasa">Jasa</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 block">Deskripsi Singkat Usaha</label>
        <div className="relative">
          <AlignLeft className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <textarea
            name="description"
            rows={3}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            placeholder="Jelaskan produk atau jasa yang Anda tawarkan..."
          ></textarea>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 block">Nomor WhatsApp Aktif <span className="text-red-500">*</span></label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="tel"
              name="whatsapp"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="081234567890"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 block">Alamat / Lokasi Usaha <span className="text-red-500">*</span></label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              name="address"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Kota / Kabupaten, Provinsi"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700 block">Alasan / Tujuan Membuka Toko</label>
        <div className="relative">
          <Info className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <textarea
            name="reason"
            rows={2}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            placeholder="Alasan Anda bergabung sebagai seller di FPP Jawabarat..."
          ></textarea>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Store className="w-5 h-5" />}
          {loading ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Toko'}
        </button>
      </div>
    </form>
  );
}
