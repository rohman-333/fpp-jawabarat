'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function OrderStatusSelect({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;

    if (!confirm(`Ubah status pesanan menjadi ${newStatus}?`)) {
      e.target.value = currentStatus;
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert('Gagal update status: ' + error.message);
      e.target.value = currentStatus;
    } else {
      router.refresh();
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'paid': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'shipped': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
      <select 
        defaultValue={currentStatus}
        onChange={handleStatusChange}
        disabled={loading}
        className={`text-xs font-bold uppercase tracking-wider rounded-lg px-3 py-1.5 border outline-none cursor-pointer disabled:opacity-50 appearance-none ${getStatusColor(currentStatus)}`}
      >
        <option value="pending">Menunggu</option>
        <option value="paid">Dibayar</option>
        <option value="processing">Diproses</option>
        <option value="shipped">Dikirim</option>
        <option value="delivered">Selesai</option>
        <option value="cancelled">Dibatalkan</option>
      </select>
    </div>
  );
}
