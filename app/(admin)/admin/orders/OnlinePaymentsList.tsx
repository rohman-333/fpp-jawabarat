// app/(admin)/admin/orders/OnlinePaymentsList.tsx
'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Eye, EyeOff, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OnlinePaymentsList({ initialTransactions }: { initialTransactions: any[] }) {
  const [txs, setTxs] = useState<any[]>(initialTransactions);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [activeRawPayload, setActiveRawPayload] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleCheckStatus = async (txId: string, midtransOrderId: string) => {
    setCheckingId(txId);
    try {
      const res = await fetch('/api/payments/midtrans/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ midtransOrderId })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal menyinkronkan status.');
      }

      showToast(`Status disinkronkan: ${data.transactionStatus} (${data.paymentStatus})`);
      
      // Update local state
      setTxs(prev => prev.map(t => {
        if (t.id === txId) {
          return {
            ...t,
            status: data.transactionStatus,
            order: t.order ? { ...t.order, payment_status: data.paymentStatus, status: data.orderStatus } : null
          };
        }
        return t;
      }));

    } catch (err: any) {
      console.error(err);
      showToast(`Kesalahan: ${err.message}`);
    } finally {
      setCheckingId(null);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (['settlement', 'capture'].includes(s)) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">Settlement</span>;
    }
    if (s === 'pending') {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">Pending</span>;
    }
    if (['deny', 'cancel', 'expire', 'failure'].includes(s)) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">Expired / Failed</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">{status || 'Pending'}</span>;
  };

  // Filter & Search Logic
  const filteredTxs = txs.filter(t => {
    const matchesStatus = filterStatus === 'all' 
      ? true 
      : filterStatus === 'settlement' 
        ? ['settlement', 'capture'].includes(t.status?.toLowerCase())
        : filterStatus === 'pending'
          ? t.status?.toLowerCase() === 'pending'
          : ['deny', 'cancel', 'expire', 'failure'].includes(t.status?.toLowerCase());

    const matchesSearch = searchQuery === ''
      ? true
      : t.midtrans_order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.buyer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.order?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Invoice / ID / Pembeli..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
          />
        </div>

        {/* Status Select filter */}
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: 'Semua Status', val: 'all' },
            { label: 'Settlement / Lunas', val: 'settlement' },
            { label: 'Pending / Menunggu', val: 'pending' },
            { label: 'Gagal / Expired', val: 'failed' }
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setFilterStatus(opt.val)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                filterStatus === opt.val
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

      </div>

      {/* Main Listing Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Invoice & ID Midtrans</th>
                <th className="px-6 py-4">Pembeli / Toko</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Tipe Bayar</th>
                <th className="px-6 py-4">Status Instan</th>
                <th className="px-6 py-4 text-center">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-medium text-slate-600">Tidak ada transaksi online ditemukan</p>
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-blue-700">{tx.order?.invoice_number || 'INV-UNKNOWN'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">ID: {tx.midtrans_order_id}</div>
                      <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                        {new Date(tx.created_at).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Pembeli</span>
                        <span className="font-extrabold text-slate-800">{tx.buyer?.name || 'User'}</span>
                      </div>
                      <div className="text-xs mt-1">
                        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wider">Toko Seller</span>
                        <span className="font-bold text-slate-600">{tx.order?.seller?.name || 'Seller'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-800">{formatRupiah(tx.amount)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase">
                        {tx.payment_type || 'snap'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Check Status direct inquiry */}
                        <Button
                          onClick={() => handleCheckStatus(tx.id, tx.midtrans_order_id)}
                          disabled={checkingId === tx.id}
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-black rounded-lg border-blue-200 hover:bg-blue-50 text-blue-600"
                        >
                          {checkingId === tx.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5 mr-1" />
                          )}
                          Cek Status
                        </Button>

                        {/* Raw JSON Inspect */}
                        <Button
                          onClick={() => setActiveRawPayload(tx.raw_response)}
                          size="sm"
                          variant="secondary"
                          className="h-8 text-[10px] font-bold rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Response Modals Payload Inspector */}
      {activeRawPayload && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col space-y-4 border border-slate-200/80 shadow-2xl relative">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
              🔍 Detail Respon Mentah Midtrans
            </h3>
            
            <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-[11px] leading-relaxed">
              <pre>{JSON.stringify(activeRawPayload, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setActiveRawPayload(null)}
                className="bg-slate-800 hover:bg-slate-900 font-extrabold text-xs h-10 rounded-xl px-6"
              >
                Tutup Detail
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bounce Toast Alerts */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-extrabold bg-white border-blue-100 text-slate-800 animate-bounce">
          <span className="text-blue-600">ℹ</span>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
