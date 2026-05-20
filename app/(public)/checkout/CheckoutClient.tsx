'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ShoppingBag, MapPin, Phone, CreditCard, ShieldCheck, Loader2, Store, Truck, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sendOrderNotifications } from '@/lib/notifications/orderActions';
import { calculateDeliveryFare } from '@/lib/logistics/fareEngine';

export function CheckoutClient({ items, currentUserId, profile }: { items: any[], currentUserId: string, profile: any }) {
  const [address, setAddress] = useState(profile?.location || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Logistics States
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('internal_courier');
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [codFee, setCodFee] = useState<number>(0);

  const [activeZones, setActiveZones] = useState<any[]>([]);
  const [activeMethods, setActiveMethods] = useState<any[]>([]);
  const [fareRules, setFareRules] = useState<any[]>([]);
  const [activeProviders, setActiveProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  
  // Custom bottom sheet states
  const [showZoneSheet, setShowZoneSheet] = useState(false);
  const [zoneSearchQuery, setZoneSearchQuery] = useState('');
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadLogisticsOptions() {
      try {
        const [zonesRes, methodsRes, rulesRes, providersRes] = await Promise.all([
          supabase.from('delivery_zones').select('*').eq('is_active', true),
          supabase.from('shipping_methods').select('*').eq('is_active', true),
          supabase.from('delivery_fare_rules').select('*'),
          supabase.from('external_shipping_providers').select('*').eq('is_active', true)
        ]);
        if (zonesRes.data) setActiveZones(zonesRes.data);
        if (methodsRes.data) setActiveMethods(methodsRes.data);
        if (rulesRes.data) setFareRules(rulesRes.data);
        if (providersRes.data) {
          setActiveProviders(providersRes.data);
          if (providersRes.data.length > 0) {
            setSelectedProvider(providersRes.data[0].code);
          }
        }
      } catch (err) {
        console.error('[LOAD_CHECKOUT_LOGISTICS_ERR]', err);
      }
    }
    loadLogisticsOptions();
  }, [supabase]);

  // Re-calculate shipping argo and COD fees dynamically using our Fare Engine
  useEffect(() => {
    if (!selectedZone) {
      setShippingCost(0);
      setCodFee(0);
      return;
    }

    const rule = fareRules.find(r => r.zone_id === selectedZone);
    const fare = calculateDeliveryFare({
      shippingMethodCode: selectedMethod,
      destinationZoneId: selectedZone,
      isCod: selectedMethod === 'cod',
      orderAmount: total,
      distanceKm: 3
    });

    if (selectedMethod === 'internal_courier' || selectedMethod === 'cod') {
      const calculatedBase = rule ? Number(rule.base_fare) : 8000;
      setShippingCost(calculatedBase);
      setCodFee(selectedMethod === 'cod' ? 3000 : 0);
    } else {
      setShippingCost(fare.totalFare - fare.codFee);
      setCodFee(fare.codFee);
    }
  }, [selectedZone, selectedMethod, fareRules]);

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
    if (!selectedZone) {
      showError('Mohon pilih wilayah tujuan pengiriman.');
      return;
    }

    setLoading(true);

    try {
      // Create an order for each seller
      for (const sellerId of Object.keys(itemsBySeller)) {
        const sellerItems = itemsBySeller[sellerId];
        const sellerTotal = sellerItems.reduce((sum: number, item: any) => sum + ((item.product?.price || 0) * item.quantity), 0);
        const invoiceNumber = `INV-${Date.now()}-${sellerId.slice(0, 4).toUpperCase()}`;

        // Get shipping method ID
        const currentMethodObj = activeMethods.find(m => m.code === selectedMethod);

        // Calculate fare breakdown using the fare engine
        const rule = fareRules.find(r => r.zone_id === selectedZone);
        const fareInput = {
          shippingMethodCode: selectedMethod,
          destinationZoneId: selectedZone,
          isCod: selectedMethod === 'cod',
          orderAmount: sellerTotal,
          distanceKm: 3
        };
        const fareResult = calculateDeliveryFare(fareInput);

        // Adjust fare breakdown for internal couriers if rule is present
        if (rule && (selectedMethod === 'internal_courier' || selectedMethod === 'cod')) {
          fareResult.baseFare = Number(rule.base_fare || 5000);
          fareResult.platformFee = Number(rule.platform_fee || 1000);
          fareResult.totalFare = shippingCost + codFee;
          fareResult.courierEarning = Math.max(0, fareResult.totalFare - fareResult.platformFee);
        }

        const selectedProvObj = activeProviders.find(p => p.code === selectedProvider);

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: currentUserId,
            seller_id: sellerId,
            invoice_number: invoiceNumber,
            total_amount: sellerTotal + shippingCost + codFee,
            shipping_cost: shippingCost,
            cod_fee: codFee,
            shipping_method_id: currentMethodObj?.id || null,
            shipping_method_code: selectedMethod,
            shipping_provider_id: selectedMethod === 'external_shipping' ? (selectedProvObj?.id || null) : null,
            shipping_provider_name: selectedMethod === 'external_shipping' ? (selectedProvObj?.name || null) : null,
            shipping_tracking_number: null,
            shipping_status: 'pending',
            delivery_fee: (selectedMethod === 'internal_courier' || selectedMethod === 'cod') ? shippingCost : 0,
            is_cod: selectedMethod === 'cod',
            fare_breakdown: fareResult,
            status: selectedMethod === 'cod' ? 'processing' : 'pending',
            payment_status: selectedMethod === 'cod' ? 'cod_pending' : 'unpaid',
            payment_method: selectedMethod === 'cod' ? 'cod' : 'manual',
            shipping_address: address,
            customer_phone: phone,
            notes: notes,
            delivery_zone_id: selectedZone || null
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

        // Create delivery row if courier is required
        if (selectedMethod === 'internal_courier' || selectedMethod === 'cod') {
          // Get seller profile details
          const { data: sellerProfile } = await supabase
            .from('profiles')
            .select('name, phone, location')
            .eq('id', sellerId)
            .single();

          // Get service type for marketplace delivery
          const { data: serviceType } = await supabase
            .from('service_types')
            .select('id')
            .eq('code', 'marketplace_delivery')
            .single();

          await supabase.from('deliveries').insert({
            order_id: order.id,
            service_type_id: serviceType?.id || null,
            buyer_id: currentUserId,
            seller_id: sellerId,
            origin_name: sellerProfile?.name || 'Pesantren Seller',
            origin_phone: sellerProfile?.phone || '',
            origin_address: sellerProfile?.location || 'Lokasi Pesantren',
            destination_name: profile?.name || 'Buyer',
            destination_phone: phone,
            destination_address: address,
            item_description: sellerItems.map((item: any) => `${item.product.name} (x${item.quantity})`).join(', '),
            item_weight: sellerItems.reduce((acc: number, item: any) => acc + (item.quantity * (item.product.weight || 1)), 0),
            distance_km: fareResult.distanceKm,
            fare_amount: shippingCost,
            platform_fee: fareResult.platformFee,
            courier_earning: fareResult.courierEarning,
            payment_status: selectedMethod === 'cod' ? 'unpaid' : 'paid',
            status: 'pending'
          });
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

  // Filter zones by search query
  const filteredZones = activeZones.filter(z => 
    z.name.toLowerCase().includes(zoneSearchQuery.toLowerCase()) || 
    z.city?.toLowerCase().includes(zoneSearchQuery.toLowerCase()) ||
    z.district?.toLowerCase().includes(zoneSearchQuery.toLowerCase())
  );

  const selectedZoneObj = activeZones.find(z => z.id === selectedZone);

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
            
            {/* Searchable Custom Zone Picker */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Wilayah Tujuan Pengiriman</label>
              <button
                type="button"
                onClick={() => setShowZoneSheet(true)}
                className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl px-4 py-3 text-sm text-left flex justify-between items-center transition-all cursor-pointer font-medium text-slate-700"
              >
                <span>{selectedZoneObj ? `${selectedZoneObj.name} (${selectedZoneObj.city})` : '-- Pilih Wilayah Tujuan --'}</span>
                <Search className="w-4 h-4 text-slate-400" />
              </button>

              {activeZones.length === 0 && (
                <div className="mt-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
                  ⚠️ Zona pengiriman belum tersedia. Pilih pengiriman manual atau hubungi admin.
                </div>
              )}
            </div>

            {/* Custom Bottom Sheet Dialog Overlay */}
            {showZoneSheet && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 space-y-4 border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[600px] animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg">Pilih Wilayah Tujuan</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowZoneSheet(false)}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Search Input inside Bottom Sheet */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={zoneSearchQuery}
                      onChange={e => setZoneSearchQuery(e.target.value)}
                      placeholder="Cari kecamatan, kota, atau nama wilayah..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Scrollable list of zones */}
                  <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
                    {filteredZones.length > 0 ? (
                      filteredZones.map(z => (
                        <button
                          key={z.id}
                          type="button"
                          onClick={() => {
                            setSelectedZone(z.id);
                            setShowZoneSheet(false);
                            setZoneSearchQuery('');
                          }}
                          className={`w-full p-3.5 rounded-xl border text-left active:scale-98 transition-all flex flex-col gap-1 min-h-[48px] ${
                            selectedZone === z.id
                              ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-bold text-sm text-slate-800">{z.name}</span>
                          <span className="text-xs text-slate-500 leading-tight">
                            {z.city} {z.district ? `• Kec. ${z.district}` : ''} {z.postal_code ? `(${z.postal_code})` : ''}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 font-bold py-6 text-sm">Tidak ada wilayah yang cocok.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

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

        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-blue-600" /> Metode Pengiriman
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'internal_courier', label: 'Kurir WIBAWA', desc: 'Kurir internal aman' },
              { id: 'pickup', label: 'Ambil Sendiri', desc: 'Ambil di toko penjual' },
              { id: 'cod', label: 'COD (Bayar di Tempat)', desc: 'Bayar saat sampai' },
              { id: 'external_shipping', label: 'Ekspedisi Eksternal', desc: 'JNE / J&T / POS' },
              { id: 'manual_shipping', label: 'Kurir Toko', desc: 'Toko kirim langsung' }
            ].map(method => {
              const isEnabled = activeMethods.length === 0 || activeMethods.some(m => m.code === method.id);
              if (!isEnabled) return null;

              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-3.5 rounded-xl border text-left active:scale-95 transition-all flex flex-col justify-between h-[84px] min-h-[44px] ${
                    selectedMethod === method.id 
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-xs sm:text-sm text-slate-800">{method.label}</span>
                  <span className="text-[10px] text-slate-500 leading-tight">{method.desc}</span>
                </button>
              );
            })}
          </div>

          {/* External Shipping Provider selector */}
          {selectedMethod === 'external_shipping' && activeProviders.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-3">
              <label className="block text-xs font-bold text-slate-600">Pilih Ekspedisi Eksternal</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activeProviders.map(provider => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.code)}
                    className={`p-2.5 rounded-lg border text-left active:scale-95 transition-all text-xs font-bold min-h-[44px] ${
                      selectedProvider === provider.code
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {provider.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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
          {selectedMethod === 'cod' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
              <Truck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-800 text-sm mb-1">Cash on Delivery (COD)</div>
                <div className="text-xs text-amber-600/80 leading-relaxed">
                  Bayar tunai sebesar total tagihan langsung ke kurir ketika paket Anda telah sampai.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 mb-6">
              <CreditCard className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-blue-800 text-sm mb-1">Transfer Manual / WhatsApp</div>
                <div className="text-xs text-blue-600/80 leading-relaxed">
                  Pembayaran dilakukan langsung ke pihak penjual (seller). Instruksi akan diberikan setelah checkout selesai via WhatsApp.
                </div>
              </div>
            </div>
          )}

          <h2 className="font-bold text-slate-800 mb-4 text-lg border-t border-slate-100 pt-6">Ringkasan Belanja</h2>
          <div className="space-y-3 mb-6 border-b border-slate-100 pb-6">
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Total Harga ({items.length} Barang)</span>
              <span>{formatRupiah(total)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-sm">
              <span>Total Ongkos Kirim</span>
              <span>{formatRupiah(shippingCost)}</span>
            </div>
            {codFee > 0 && (
              <div className="flex justify-between text-slate-600 text-sm">
                <span>Biaya Penanganan COD</span>
                <span>{formatRupiah(codFee)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mb-8">
            <span className="font-bold text-slate-800">Total Tagihan</span>
            <span className="font-extrabold text-2xl text-blue-600">{formatRupiah(total + shippingCost + codFee)}</span>
          </div>
          <Button 
            onClick={handleCheckout}
            disabled={loading || !address || !phone || !selectedZone}
            className="w-full bg-blue-600 hover:bg-blue-700 font-bold rounded-xl h-14 text-lg shadow-md shadow-blue-600/20 active:scale-98 transition-all min-h-[44px]"
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
          <span className="text-rose-500">⚠️</span>
          <span>{errorToast}</span>
        </div>
      )}
    </div>
  );
}
