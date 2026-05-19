'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestPayout } from '@/app/actions/delivery';
import { Button } from '@/components/ui/button';
import { Landmark, Check, AlertCircle } from 'lucide-react';

interface PayoutFormProps {
  available: number;
}

export function PayoutForm({ available }: PayoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: '',
    method: 'bank_transfer',
    account_name: '',
    account_number: '',
    note: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const amt = Number(formData.amount);
    if (!formData.amount || isNaN(amt) || amt <= 0) {
      setError('Harap masukkan nominal pencairan yang valid.');
      return;
    }

    if (amt < 10000) {
      setError('Batas minimum pencairan dana adalah Rp 10.000.');
      return;
    }

    if (amt > available) {
      setError('Nominal pencairan melebihi saldo tersedia Anda.');
      return;
    }

    if (!formData.account_name || !formData.account_number) {
      setError('Harap lengkapi nama pemilik dan nomor rekening tujuan.');
      return;
    }

    setLoading(true);
    const res = await requestPayout({
      amount: amt,
      method: formData.method,
      account_name: formData.account_name,
      account_number: formData.account_number,
      note: formData.note
    });
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess('Pengajuan pencairan berhasil dikirim ke Administrator.');
      setFormData({
        amount: '',
        method: 'bank_transfer',
        account_name: '',
        account_number: '',
        note: ''
      });
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {error && (
        <div className="p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 font-bold rounded-r-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-green-50 border-l-4 border-green-500 text-green-700 font-bold rounded-r-xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      <div className="space-y-1">
        <label className="font-bold text-slate-700 block">Nominal Pencairan (Rupiah) <span className="text-red-500">*</span></label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="Contoh: 50000"
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-slate-800"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="font-bold text-slate-700 block">Metode Pembayaran <span className="text-red-500">*</span></label>
          <select
            name="method"
            value={formData.method}
            onChange={handleChange}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
          >
            <option value="Transfer Bank BJB">Transfer Bank BJB</option>
            <option value="Transfer Bank Syariah Indonesia (BSI)">Transfer Bank Syariah Indonesia (BSI)</option>
            <option value="Transfer Bank BCA">Transfer Bank BCA</option>
            <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
            <option value="Gopay">E-Wallet Gopay</option>
            <option value="OVO">E-Wallet OVO</option>
            <option value="ShopeePay">E-Wallet ShopeePay</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-700 block">Nomor Rekening / E-Wallet <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="account_number"
            value={formData.account_number}
            onChange={handleChange}
            placeholder="Nomor rekening bank atau No. HP wallet"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-semibold text-slate-800"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="font-bold text-slate-700 block">Nama Lengkap Pemilik Rekening <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="account_name"
          value={formData.account_name}
          onChange={handleChange}
          placeholder="Sesuai nama yang tertera di buku tabungan"
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-semibold text-slate-800"
        />
      </div>

      <div className="space-y-1">
        <label className="font-bold text-slate-700 block">Catatan Pendukung (Opsional)</label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows={2}
          placeholder="Tambahkan catatan jika diperlukan..."
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
        />
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 h-auto text-xs"
        >
          {loading ? 'Mengirim...' : 'Kirim Permintaan Payout'}
          <Landmark className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
