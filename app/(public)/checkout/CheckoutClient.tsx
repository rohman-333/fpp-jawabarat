'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ShoppingBag, MapPin, Phone, CreditCard, ShieldCheck, Loader2, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sendOrderNotifications } from '@/lib/notifications/orderActions';

export function CheckoutClient({ items, currentUserId, profile }: { items: any[], currentUserId: string, profile: any }) {
  const [address, setAddress] = useState(profile?.location || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const total = items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
  
  // Group items by seller
  const itemsBySeller = items.reduce((acc, item) => {
    const sellerId = item.product.seller_id;
    if (!acc[sellerId]) acc[sellerId] = [];
    acc[sellerId].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const [errorToast, setErrorToast] = useState<string | null>(null);
  
  const showError = (message: string) => {
    setErrorToast(message);
    setTimeout(() => {
      setErrorToast(null);
    }, 4000);
  };

  const handleCheckout = async () => {
    if (!address) {
      showError('Mohon isi alamat pengiriman.');
      return;
    }
    if (!phone) {
      showError('Mohon isi nomor telepon aktif.');
      return;
    }

    setLoading(true);

    try {
      // Create an order for each seller
      for (const sellerId of Object.keys(itemsBySeller)) {
        const sellerItems = itemsBySeller[sellerId];
        const sellerTotal = sellerItems.reduce((sum: number, item: any) => sum + ((item.product?.price || 0) * item.quantity), 0);
        const invoiceNumber = `INV-${Date.now()}-${sellerId.slice(0, 4).toUpperCase()}`;

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: currentUserId,
            seller_id: sellerId,
            invoice_number: invoiceNumber,
            total_amount: sellerTotal,
            shipping_cost: 0,
            status: 'pending',
            payment_method: 'manual',
            shipping_address: address,
            customer_phone: phone,
            notes: notes
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItemsData = sellerItems.map((item: any) => ({
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          product_price: item.product.price,
          quantity: item.quantity,
          subtotal: item.product.price * item.quantity
        }));

        await supabase.from('order_items').insert(orderItemsData);

        // Deduct stock
        for (const item of sellerItems) {
          const newStock = Math.max(0, (item.product.stock || 0) - item.quantity);
          await supabase.from('products').update({ stock: newStock }).eq('id', item.product.id);
        }

        // Send order notifications (buyer + seller)
        await sendOrderNotifications({
          orderId: order.id,
          buyerId: currentUserId,
          sellerId: sellerId,
          invoiceNumber,
        });
      }

      // Clear cart
      await supabase.from('cart_items').delete().eq('user_id', currentUserId);
      
      router.push('/orders');
      router.refresh();
    } catch (err: any) {
      showError('Terjadi kesalahan: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" /> Alamat Pengiriman
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Alamat Lengkap</label>
              <textarea 
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-24 resize-none"
                placeholder="Masukkan alamat lengkap (Jalan, RT/RW, Desa, Kecamatan, Kabupaten/Kota, Provinsi, Kode Pos)"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Nomor WhatsApp Aktif</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Contoh: 081234567890"
                />
              </div>
            </div>
          </div>
        </div>

        {Object.keys(itemsBySeller).map((sellerId, idx) => {
          const sellerItems = itemsBySeller[sellerId];
          const sellerName = sellerItems[0].product.seller?.name || sellerItems[0].product.pesantren?.name || 'Seller WIBAWA NUSANTARA';
          
          return (
            <div key={sellerId} className="bg-white p-6 rounded-2xl border border-slate-200">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                <Store className="w-4 h-4 text-slate-500" /> Pesanan {idx + 1} dari <span className="text-blue-600">{sellerName}</span>
              </h2>
              <div className="space-y-4">
                {sellerItems.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-6 h-6 m-auto mt-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800 text-sm mb-1">{item.product.name}</div>
                      <div className="text-xs text-slate-500 mb-1">{item.quantity} barang x {formatRupiah(item.product.price)}</div>
                      <div className="font-bold text-slate-800 text-sm">{formatRupiah(item.product.price * item.quantity)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
          <textarea 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-20 resize-none"
            placeholder="Tulis pesan untuk penjual di sini..."
          />
        </div>
      </div>
      
      <div className="lg:w-96 shrink-0">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 sticky top-24 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-4 text-lg">Metode Pembayaran</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 mb-6">
            <CreditCard className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-blue-800 text-sm mb-1">Transfer Manual / Bayar di Tempat</div>
              <div className="text-xs text-blue-600/80 leading-relaxed">
                Pembayaran dilakukan langsung ke pihak penjual (seller). Instruksi akan diberikan setelah checkout selesai via WhatsApp.
              </div>
            </div>
          </div>

          <h2 className="font-bold text-slate-800 mb-4 text-lg border-t border-slate-100 pt-6">Ringkasan Belanja</h2>
          <div className="space-y-3 mb-6 border-b border-slate-100 pb-6">
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Total Harga ({items.length} Barang)</span>
              <span>{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Total Ongkos Kirim</span>
              <span>Rp 0</span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-8">
            <span className="font-bold text-slate-800">Total Tagihan</span>
            <span className="font-extrabold text-2xl text-blue-600">{formatRupiah(total)}</span>
          </div>
          <Button 
            onClick={handleCheckout}
            disabled={loading || !address || !phone}
            className="w-full bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-14 text-lg shadow-md shadow-blue-600/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (
              <>
                <ShieldCheck className="w-5 h-5 mr-2" /> Buat Pesanan
              </>
            )}
          </Button>
          <p className="text-center text-[10px] text-slate-400 mt-4 leading-relaxed">
            Dengan membuat pesanan, Anda menyetujui Syarat & Ketentuan WIBAWA NUSANTARA.
          </p>
        </div>
      </div>

      {errorToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-xl border text-xs sm:text-sm font-extrabold transition-all duration-300 animate-bounce bg-white border-red-100 text-slate-800">
          <span className="text-rose-500">⚠</span>
          <span>{errorToast}</span>
        </div>
      )}
    </div>
  );
}
