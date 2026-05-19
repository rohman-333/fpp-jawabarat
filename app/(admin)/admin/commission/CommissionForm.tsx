'use client';

import { useState } from 'react';
import { updateCommissionSetting } from './actions';
import { Loader2 } from 'lucide-react';

export function CommissionForm({ initialSetting }: { initialSetting: any }) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState(initialSetting?.commission_type || 'percentage');

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    await updateCommissionSetting(formData);
    setLoading(false);
    alert('Pengaturan komisi berhasil diperbarui!');
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Komisi</label>
        <select 
          name="commission_type" 
          value={type} 
          onChange={(e) => setType(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        >
          <option value="percentage">Persentase (%)</option>
          <option value="fixed">Nominal Tetap (Rp)</option>
        </select>
      </div>

      {type === 'percentage' ? (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Besaran Persentase (%)</label>
          <input 
            type="number" 
            name="percentage_rate" 
            step="0.1"
            min="0"
            max="100"
            defaultValue={initialSetting?.percentage_rate || 0}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nominal Tetap (Rp)</label>
          <input 
            type="number" 
            name="fixed_amount" 
            min="0"
            defaultValue={initialSetting?.fixed_amount || 0}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Pengaturan'}
      </button>
    </form>
  );
}
