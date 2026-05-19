'use client';

import { createOrder } from '../marketplace/actions';
import { MapPin, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function CheckoutForm({ cartItems, totalPrice, totalItems }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form action={async (formData) => {
      setIsSubmitting(true);
      await createOrder(formData);
    }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-blue-600" /> Alamat Pengiriman
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
            <textarea 
              name="shipping_address"
              required
              rows={3}
              placeholder="Jl. Contoh No. 123, RT 01 RW 02, Desa Contoh, Kecamatan Contoh..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            ></textarea>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-blue-600" /> Kontak Pembeli
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp Aktif</label>
            <input 
              type="tel"
              name="customer_phone"
              required
              placeholder="081234567890"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
            <textarea 
              name="notes"
              rows={2}
              placeholder="Warna merah, ukuran L, titip di pos satpam..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            ></textarea>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50">
        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-2 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-70"
        >
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Memproses Pesanan...</>
          ) : (
            <>Buat Pesanan <ArrowRight className="w-5 h-5" /></>
          )}
        </button>
        <p className="text-center text-sm text-slate-500 mt-4">
          Metode pembayaran saat ini mendukung <b>Transfer Bank Manual</b> atau <b>COD</b> yang dapat didiskusikan langsung dengan Seller via WhatsApp setelah order dibuat.
        </p>
      </div>

    </form>
  );
}
