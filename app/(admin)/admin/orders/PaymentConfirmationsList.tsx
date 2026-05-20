// app/(admin)/admin/orders/PaymentConfirmationsList.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, X, Eye, ExternalLink, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PaymentConfirmationsList({ initialPayments }: { initialPayments: any[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);
  const supabase = createClient();

  // Custom modal state
  const [activeConfirmModal, setActiveConfirmModal] = useState<{
    type: 'approve' | 'reject';
    paymentId: string;
    orderId: string;
  } | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleVerify = async (paymentId: string, orderId: string, action: 'approve' | 'reject', rejectReason = '') => {
    setLoadingId(paymentId);
    try {
      const isApproved = action === 'approve';
      const paymentStatus = isApproved ? 'approved' : 'rejected';
      const orderPaymentStatus = isApproved ? 'paid' : 'rejected';
      const orderStatus = isApproved ? 'processing' : 'pending';

      // 1. Update payment confirmation status
      const { error: paymentErr } = await supabase
        .from('payment_confirmations')
        .update({ status: paymentStatus, note: rejectReason || null })
        .eq('id', paymentId);

      if (paymentErr) throw paymentErr;

      // 2. Update order payment & logistics statuses
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ 
          payment_status: orderPaymentStatus,
          status: orderStatus
        })
        .eq('id', orderId);

      if (orderErr) throw orderErr;

      // 3. Dispatch in-app alerts to buyers
      const payment = payments.find(p => p.id === paymentId);
      const invoiceNumber = payment?.order?.invoice_number || 'Pesanan';

      try {
        await supabase.from('notifications').insert({
          user_id: payment.buyer_id,
          type: 'order_status',
          title: isApproved ? 'Pembayaran Disetujui' : 'Pembayaran Ditolak',
          body: isApproved 
            ? `Pembayaran Anda untuk invoice ${invoiceNumber} telah berhasil diverifikasi. Pesanan kini sedang diproses penjual.` 
            : `Pembayaran Anda untuk invoice ${invoiceNumber} ditolak. Alasan: ${rejectReason || 'Bukti bayar tidak valid'}. Silakan unggah bukti baru.`,
          href: `/orders`
        });
      } catch (e) {
        console.error('Failed to dispatch user notification:', e);
      }

      // Update state local
      setPayments(prev => prev.map(p => {
        if (p.id === paymentId) {
          return {
            ...p,
            status: paymentStatus,
            note: rejectReason || p.note,
            order: { ...p.order, payment_status: orderPaymentStatus, status: orderStatus }
          };
        }
        return p;
      }));

      showToast(isApproved ? 'Pembayaran berhasil disetujui!' : 'Pembayaran berhasil ditolak.');
    } catch (err: any) {
      console.error(err);
      showToast('Gagal memverifikasi: ' + (err.message || 'Terjadi kendala. Coba lagi.'));
    } finally {
      setLoadingId(null);
      setActiveConfirmModal(null);
      setRejectReasonInput('');
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">Tidak ada konfirmasi pembayaran</h3>
          <p className="text-slate-400 text-xs mt-1">Belum ada unggahan bukti transfer dari pembeli.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col relative">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-blue-700 text-xs tracking-wider mb-0.5">{payment.order?.invoice_number}</div>
                  <div className="text-[10px] text-slate-400">{new Date(payment.created_at).toLocaleString('id-ID')}</div>
                </div>
                <div>
                  {payment.status === 'pending' && <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-yellow-100 text-yellow-800 rounded-full tracking-wider">Menunggu</span>}
                  {payment.status === 'approved' && <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 rounded-full tracking-wider">Disetujui</span>}
                  {payment.status === 'rejected' && <span className="px-2.5 py-1 text-[9px] font-black uppercase bg-rose-100 text-rose-800 rounded-full tracking-wider">Ditolak</span>}
                </div>
              </div>

              <div className="p-5 flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pembeli</span>
                    <span className="text-xs font-bold text-slate-800">{payment.buyer?.name || 'User'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Toko / Seller</span>
                    <span className="text-xs font-bold text-slate-800">{payment.order?.seller?.name || 'Seller'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jumlah Transfer</span>
                    <span className="text-xs font-black text-blue-600">{formatRupiah(payment.amount)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tagihan Pesanan</span>
                    <span className="text-xs font-black text-slate-700">{formatRupiah(payment.order?.total_amount)}</span>
                  </div>
                </div>

                {payment.note && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs text-slate-600 flex items-start gap-1.5 italic">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>Catatan: {payment.note}</span>
                  </div>
                )}

                {/* Proof Attachment */}
                <div className="relative border border-slate-200/80 rounded-2xl overflow-hidden group bg-slate-100 flex items-center justify-center h-48 select-none">
                  {payment.proof_url ? (
                    <>
                      <img src={payment.proof_url} alt="Receipt" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button 
                          onClick={() => setActiveProofUrl(payment.proof_url)}
                          size="sm" 
                          variant="secondary" 
                          className="h-8 text-xs font-bold rounded-lg"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Zoom
                        </Button>
                        <a 
                          href={payment.proof_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="px-3 py-1.5 h-8 bg-white/20 hover:bg-white/30 text-white border border-white/20 text-xs font-bold rounded-lg flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Buka
                        </a>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">Bukti transfer kosong</span>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              {payment.status === 'pending' && (
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                  <Button 
                    onClick={() => {
                      setActiveConfirmModal({
                        type: 'reject',
                        paymentId: payment.id,
                        orderId: payment.order_id
                      });
                    }}
                    disabled={loadingId === payment.id}
                    variant="outline" 
                    className="flex-1 border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs h-10 rounded-xl"
                  >
                    {loadingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
                    Tolak
                  </Button>

                  <Button 
                    onClick={() => {
                      setActiveConfirmModal({
                        type: 'approve',
                        paymentId: payment.id,
                        orderId: payment.order_id
                      });
                    }}
                    disabled={loadingId === payment.id}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl"
                  >
                    {loadingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                    Setujui
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dynamic State Overlay Modal instead of window.confirm/prompt */}
      {activeConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm">
              {activeConfirmModal.type === 'approve' ? '✔️ Konfirmasi Persetujuan' : '❌ Konfirmasi Penolakan'}
            </h3>
            
            <p className="text-slate-500 text-xs leading-relaxed">
              {activeConfirmModal.type === 'approve' 
                ? 'Apakah Anda yakin ingin menyetujui bukti pembayaran transfer manual ini?' 
                : 'Silakan masukkan alasan penolakan bukti pembayaran:'}
            </p>

            {activeConfirmModal.type === 'reject' && (
              <textarea
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                placeholder="Contoh: Bukti buram atau jumlah tidak sesuai..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium"
                rows={3}
              />
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button
                onClick={() => {
                  setActiveConfirmModal(null);
                  setRejectReasonInput('');
                }}
                variant="outline"
                className="text-xs font-bold h-10 rounded-xl px-4"
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  handleVerify(
                    activeConfirmModal.paymentId,
                    activeConfirmModal.orderId,
                    activeConfirmModal.type,
                    rejectReasonInput
                  );
                }}
                className={`text-xs font-bold h-10 rounded-xl px-5 ${
                  activeConfirmModal.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                Konfirmasi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom Slips */}
      {activeProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center">
            <button 
              onClick={() => setActiveProofUrl(null)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={activeProofUrl} alt="Zoom Receipt" className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10" />
          </div>
        </div>
      )}

      {/* Inline Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-extrabold bg-white border-blue-100 text-slate-800 animate-bounce">
          <span className="text-blue-600">ℹ</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
