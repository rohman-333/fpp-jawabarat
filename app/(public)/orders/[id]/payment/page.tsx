// app/(public)/orders/[id]/payment/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { ArrowLeft, CreditCard, Upload, CheckCircle2, Copy, Sparkles, Loader2, AlertCircle, ShieldCheck, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OrderPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  
  // Payment methods selection
  const [activeTab, setActiveTab] = useState<'midtrans' | 'manual'>('midtrans');
  const [isMidtransEnabled, setIsMidtransEnabled] = useState(false);

  const showToastError = (message: string) => {
    setToastError(message);
    setTimeout(() => {
      setToastError(null);
    }, 4500);
  };

  useEffect(() => {
    // Check if client key is configured
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (clientKey && clientKey !== '' && !clientKey.includes('placeholder')) {
      setIsMidtransEnabled(true);
    } else {
      setIsMidtransEnabled(false);
      setActiveTab('manual'); // fallback automatically
    }

    // Load Midtrans Snap script dynamically
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    const snapUrl = isProduction 
      ? 'https://app.midtrans.com/snap/snap.js' 
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    const script = document.createElement('script');
    script.src = snapUrl;
    script.setAttribute('data-client-key', clientKey || 'SB-Mid-client-placeholder');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    async function fetchOrder() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?redirect=/orders/${orderId}/payment`);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (error || !data) {
        setError('Pesanan tidak ditemukan atau Anda tidak memiliki akses.');
      } else {
        setOrder(data);
        setAmount(data.total_amount.toString());
      }
      setLoading(false);
    }

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, router, supabase]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
        showToastError('Format file tidak didukung. Gunakan JPG, PNG atau WEBP.');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        showToastError('File terlalu besar. Maksimal 5MB.');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showToastError('Silakan pilih foto bukti transfer terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const fileExt = file.name.split('.').pop();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const filePath = `payment_proofs/${user.id}/${Date.now()}-${randomStr}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw new Error('Gagal mengunggah bukti transfer: ' + uploadError.message);

      const { data: publicUrlData } = supabase.storage.from('product_images').getPublicUrl(filePath);
      const proofUrl = publicUrlData.publicUrl;

      // 1. Insert into payment_confirmations
      const { error: insertError } = await supabase
        .from('payment_confirmations')
        .insert({
          order_id: orderId,
          buyer_id: user.id,
          proof_url: proofUrl,
          amount: parseFloat(amount),
          status: 'pending',
          note: note
        });

      if (insertError) throw new Error('Gagal menyimpan konfirmasi: ' + insertError.message);

      // 2. Update orders payment_status & status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'waiting_payment',
          payment_method: 'manual_transfer',
          status: 'pending'
        })
        .eq('id', orderId);

      if (updateError) throw new Error('Gagal memperbarui pesanan: ' + updateError.message);

      // 3. Send notification
      try {
        await supabase.from('notifications').insert({
          user_id: order.seller_id,
          type: 'order_status',
          title: 'Pembayaran Diunggah',
          body: `Pembeli telah mengunggah bukti pembayaran untuk invoice ${order.invoice_number}. Menunggu verifikasi admin.`,
          href: `/dashboard/orders`
        });
      } catch (notifErr) {
        console.error(notifErr);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      showToastError(err.message || 'Terjadi kesalahan saat mengonfirmasi pembayaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMidtransPayment = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/payments/midtrans/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Gagal memulai transaksi Midtrans.');
      }

      const snap = (window as any).snap;
      if (!snap) {
        throw new Error('Midtrans Snap SDK gagal dimuat. Gunakan metode transfer manual.');
      }

      snap.pay(data.token, {
        onSuccess: function (result: any) {
          console.log('Midtrans Snap Success:', result);
          router.push('/orders');
          router.refresh();
        },
        onPending: function (result: any) {
          console.log('Midtrans Snap Pending:', result);
          router.push('/orders');
          router.refresh();
        },
        onError: function (result: any) {
          console.error('Midtrans Snap Error:', result);
          showToastError('Pembayaran gagal diproses. Silakan hubungi admin.');
        },
        onClose: function () {
          showToastError('Pembayaran dibatalkan sebelum selesai.');
        }
      });
    } catch (err: any) {
      console.error(err);
      showToastError(err.message || 'Terjadi kesalahan saat memproses pembayaran online.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <p className="text-slate-500 text-sm font-medium">Memuat data pesanan...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <PublicNavbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Terjadi Kesalahan</h2>
            <p className="text-slate-500 text-sm mb-6">{error || 'Pesanan tidak ditemukan.'}</p>
            <Link href="/orders" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-colors">
              Kembali ke Pesanan Saya
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <PublicNavbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl max-w-md w-full text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full"></div>
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Konfirmasi Terkirim!</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Bukti pembayaran Anda berhasil diunggah. Admin akan segera memverifikasi pembayaran Anda dalam 1x24 jam.
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 text-left">
              <div className="text-xs text-slate-400 mb-0.5">No. Invoice</div>
              <div className="font-bold text-slate-800 mb-2">{order.invoice_number}</div>
              <div className="text-xs text-slate-400 mb-0.5">Jumlah Konfirmasi</div>
              <div className="font-bold text-blue-600">Rp {parseFloat(amount).toLocaleString('id-ID')}</div>
            </div>
            <Link href="/orders" className="w-full inline-block bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition-colors">
              Kembali ke Pesanan Saya
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link href="/orders" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Pesanan
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 bg-gradient-to-r from-blue-900 to-blue-700 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full"></div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-300" /> Pilih Metode Pembayaran
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm">Invoice: <span className="font-bold">{order.invoice_number}</span></p>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button
              onClick={() => isMidtransEnabled && setActiveTab('midtrans')}
              className={`flex-1 py-4 text-center text-xs sm:text-sm font-extrabold transition-all border-b-2 ${
                activeTab === 'midtrans'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              } ${!isMidtransEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              🚀 Pembayaran Instan
              {!isMidtransEnabled && <span className="block text-[9px] text-slate-400 font-medium">Belum Aktif</span>}
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-4 text-center text-xs sm:text-sm font-extrabold transition-all border-b-2 ${
                activeTab === 'manual'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              🏦 Transfer Bank Manual
            </button>
          </div>

          <div className="p-6">
            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 mb-6 flex justify-between items-center">
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase block tracking-wider">Total Tagihan Akhir</span>
                <span className="font-black text-xl sm:text-2xl text-blue-800">Rp {order.total_amount.toLocaleString('id-ID')}</span>
              </div>
              <ShieldCheck className="w-8 h-8 text-blue-600" />
            </div>

            {/* Midtrans Snap Tab Panel */}
            {activeTab === 'midtrans' && (
              <div className="space-y-6 py-2">
                <div className="space-y-2 text-slate-600 text-xs sm:text-sm leading-relaxed">
                  <p>
                    Anda akan dialihkan ke gerbang pembayaran online aman <b>Midtrans Snap</b>.
                  </p>
                  <p>
                    Mendukung pembayaran otomatis super praktis via:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 font-semibold text-slate-700">
                    <li>QRIS (Gopay, OVO, ShopeePay, Dana, LinkAja)</li>
                    <li>Virtual Account Bank (BCA, Mandiri, BNI, BRI, BJB)</li>
                    <li>Kartu Kredit / Debit Online</li>
                  </ul>
                </div>

                <Button
                  onClick={handleMidtransPayment}
                  disabled={submitting}
                  className="w-full py-4 h-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/10"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menghubungkan ke Midtrans...
                    </>
                  ) : (
                    'Bayar Instan Sekarang'
                  )}
                </Button>
              </div>
            )}

            {/* Manual Bank Transfer Tab Panel */}
            {activeTab === 'manual' && (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-500 leading-relaxed">
                  Silakan lakukan transfer manual ke salah satu rekening bank resmi WIBAWA NUSANTARA berikut sebesar jumlah tagihan:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col relative group">
                    <span className="text-xs font-bold text-slate-400 mb-1">BANK MANDIRI</span>
                    <span className="font-extrabold text-slate-800 text-sm sm:text-base mb-1 select-all">131-00-2234567-8</span>
                    <span className="text-xs text-slate-500 mb-3">a.n Wibawa Nusantara</span>
                    <button 
                      onClick={() => copyToClipboard('1310022345678', 'mandiri')}
                      className="mt-auto self-start text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <Copy className="w-3.5 h-3.5" /> 
                      {copiedText === 'mandiri' ? 'Tersalin!' : 'Salin Rekening'}
                    </button>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col relative group">
                    <span className="text-xs font-bold text-slate-400 mb-1">BANK BSI</span>
                    <span className="font-extrabold text-slate-800 text-sm sm:text-base mb-1 select-all">711-00-2345-6</span>
                    <span className="text-xs text-slate-500 mb-3">a.n Wibawa Nusantara</span>
                    <button 
                      onClick={() => copyToClipboard('7110023456', 'bsi')}
                      className="mt-auto self-start text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedText === 'bsi' ? 'Tersalin!' : 'Salin Rekening'}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-5 pt-2">
                  <div>
                    <label className="block text-slate-700 font-bold text-xs sm:text-sm mb-2">Jumlah Transfer (Rupiah)</label>
                    <input 
                      type="number"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 text-sm font-bold placeholder-slate-400"
                      placeholder="Contoh: 150000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-xs sm:text-sm mb-2">Catatan / Nama Pengirim</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 text-sm placeholder-slate-400"
                      placeholder="Contoh: Transfer via ATM BCA a.n Ahmad Fauzi"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold text-xs sm:text-sm mb-2">Foto Bukti Transfer</label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 transition-colors text-center relative cursor-pointer">
                      <input 
                        type="file"
                        required
                        accept="image/jpeg,image/png,image/webp"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                      />
                      {previewUrl ? (
                        <div className="relative w-40 h-40 mx-auto border rounded-xl overflow-hidden shadow-sm">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                          <div className="text-slate-600 font-bold text-xs sm:text-sm">Klik atau seret foto ke area ini</div>
                          <div className="text-[10px] text-slate-400">Mendukung file JPG, PNG, WEBP hingga 5MB</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full py-4 h-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-blue-600/10"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sedang Mengirim...
                      </>
                    ) : (
                      'Konfirmasi Pembayaran Transfer'
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {toastError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-extrabold transition-all duration-300 animate-bounce bg-white border-red-100 text-slate-800">
          <span className="text-rose-500">⚠</span>
          <span>{toastError}</span>
        </div>
      )}
      <PublicFooter />
    </div>
  );
}
