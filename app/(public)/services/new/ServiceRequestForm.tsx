'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculateShippingFee, createServiceRequest } from '@/app/actions/delivery';
import { Button } from '@/components/ui/button';
import { 
  Package, ShoppingCart, HelpCircle, UserCheck, MapPin, Calculator, CheckCircle2, AlertCircle 
} from 'lucide-react';

interface ServiceRequestFormProps {
  serviceTypes: any[];
  zones: any[];
}

export function ServiceRequestForm({ serviceTypes, zones }: ServiceRequestFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dynamic Fare States
  const [fareDetails, setFareDetails] = useState({
    fare: 0,
    platformFee: 0,
    total: 0
  });
  const [calculating, setCalculating] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    service_type_code: serviceTypes[0]?.code || 'package_delivery',
    origin_name: '',
    origin_phone: '',
    origin_address: '',
    origin_zone_id: '',
    destination_name: '',
    destination_phone: '',
    destination_address: '',
    destination_zone_id: '',
    item_description: '',
    item_weight: 1,
    passenger_count: 1,
    pickup_note: '',
    delivery_note: '',
    payment_method: 'cash'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceSelect = (code: string) => {
    setFormData(prev => ({ ...prev, service_type_code: code }));
  };

  // Re-calculate shipping/fare whenever zone or service type code changes
  useEffect(() => {
    const fetchFare = async () => {
      if (!formData.destination_zone_id) return;
      setCalculating(true);
      const res = await calculateShippingFee(
        formData.origin_zone_id || null,
        formData.destination_zone_id,
        formData.service_type_code,
        2.5 // fallback distance
      );
      setCalculating(false);
      if (res) {
        setFareDetails({
          fare: res.fare,
          platformFee: res.platformFee,
          total: res.total
        });
      }
    };
    fetchFare();
  }, [formData.service_type_code, formData.origin_zone_id, formData.destination_zone_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic Validation
    if (!formData.origin_name || !formData.origin_phone || !formData.origin_address) {
      setError('Harap lengkapi informasi penjemputan.');
      return;
    }
    if (!formData.destination_name || !formData.destination_phone || !formData.destination_address || !formData.destination_zone_id) {
      setError('Harap lengkapi informasi tujuan & zona pengantaran.');
      return;
    }
    if (formData.service_type_code !== 'ride' && !formData.item_description) {
      setError('Harap masukkan keterangan barang yang dikirim/dibeli.');
      return;
    }

    setLoading(true);
    const res = await createServiceRequest({
      ...formData,
      item_weight: Number(formData.item_weight),
      passenger_count: Number(formData.passenger_count)
    });
    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess('Order kurir berhasil dibuat! Mencari kurir terdekat...');
      router.push(`/services/${res.deliveryId}`);
      router.refresh();
    }
  };

  const currentService = serviceTypes.find(s => s.code === formData.service_type_code);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs">
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 font-bold rounded-r-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 font-bold rounded-r-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Service Type Selection Catalog Tabs */}
      <div className="space-y-2">
        <label className="font-bold text-slate-700 block">Pilih Kategori Layanan</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {serviceTypes.map((st) => {
            const isSelected = formData.service_type_code === st.code;
            const Icon = st.code === 'package_delivery' ? Package :
                          st.code === 'food_delivery' ? ShoppingCart :
                          st.code === 'ride' ? UserCheck : HelpCircle;
            return (
              <button
                key={st.code}
                type="button"
                onClick={() => handleServiceSelect(st.code)}
                className={`p-3.5 border rounded-2xl flex flex-col items-center gap-2 text-center transition-all ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/40 text-blue-900 shadow-sm ring-1 ring-blue-500' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="font-bold tracking-tight leading-none block">{st.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Safety warnings for passenger ride */}
      {formData.service_type_code === 'ride' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-[11px] text-amber-900 leading-relaxed">
          <p className="font-extrabold flex items-center gap-1.5 text-xs text-amber-800">
            🛡️ Protokol Keselamatan Penumpang (Ojek)
          </p>
          <p>
            Demi keselamatan bersama, Anda **diwajibkan** menggunakan helm standar SNI yang bersih yang disediakan oleh mitra ojek kami. Pastikan nomor plat kendaraan kurir cocok sebelum melakukan perjalanan.
          </p>
          <p className="font-bold">
            Disclaimer: Batas maksimum kapasitas penumpang ojek sepeda motor adalah 1 orang.
          </p>
        </div>
      )}

      {/* Pick up location details */}
      <div className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
        <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
          <MapPin className="w-4 h-4 text-red-500" /> Informasi Penjemputan / Pengirim
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Nama Kontak Pengirim / Toko <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="origin_name"
              value={formData.origin_name}
              onChange={handleInputChange}
              placeholder="Contoh: Koperasi Santri, Nama Seller"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Nomor Telepon Pengirim <span className="text-red-500">*</span></label>
            <input
              type="tel"
              name="origin_phone"
              value={formData.origin_phone}
              onChange={handleInputChange}
              placeholder="Contoh: 08123456789"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Zona Penjemputan (Opsional)</label>
            <select
              name="origin_zone_id"
              value={formData.origin_zone_id}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none"
            >
              <option value="">-- Pilih Zona Asal --</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Alamat Lengkap Penjemputan <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="origin_address"
              value={formData.origin_address}
              onChange={handleInputChange}
              placeholder="Detail gedung, lantai, patokan jalan"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Destination details */}
      <div className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
        <h3 className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
          <MapPin className="w-4 h-4 text-green-600" /> Informasi Tujuan / Penerima
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Nama Kontak Penerima / Penumpang <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="destination_name"
              value={formData.destination_name}
              onChange={handleInputChange}
              placeholder="Masukkan nama penerima"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Nomor Telepon Penerima <span className="text-red-500">*</span></label>
            <input
              type="tel"
              name="destination_phone"
              value={formData.destination_phone}
              onChange={handleInputChange}
              placeholder="Masukkan No. HP penerima"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Zona Tujuan Utama <span className="text-red-500">*</span></label>
            <select
              name="destination_zone_id"
              value={formData.destination_zone_id}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-blue-900 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Pilih Zona Tujuan --</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name} ({zone.city || zone.province})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Alamat Lengkap Tujuan <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="destination_address"
              value={formData.destination_address}
              onChange={handleInputChange}
              placeholder="Detail alamat pengiriman tujuan"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Package Description fields */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-4">
        <h3 className="font-extrabold text-slate-800 text-xs">Detail Pengiriman & Catatan</h3>

        {formData.service_type_code !== 'ride' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-700 block">Deskripsi Barang / Belanjaan <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="item_description"
                value={formData.item_description}
                onChange={handleInputChange}
                placeholder="Misal: Dokumen, Nasi Goreng 2 Porsi, Sembako"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Estimasi Berat Barang (Kg)</label>
              <input
                type="number"
                name="item_weight"
                value={formData.item_weight}
                onChange={handleInputChange}
                min={1}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Jumlah Penumpang</label>
            <select
              name="passenger_count"
              value={formData.passenger_count}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            >
              <option value="1">1 Orang (Batas Maksimal Motor)</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Catatan Penjemputan (Pickup Note)</label>
            <input
              type="text"
              name="pickup_note"
              value={formData.pickup_note}
              onChange={handleInputChange}
              placeholder="Misal: Masuk gerbang pesantren sebelah kanan"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 block">Catatan Pengantaran (Delivery Note)</label>
            <input
              type="text"
              name="delivery_note"
              value={formData.delivery_note}
              onChange={handleInputChange}
              placeholder="Misal: Titipkan di pos security pesantren"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            />
          </div>
        </div>
      </div>

      {/* Payment details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3">
          <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Metode Pembayaran</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="payment_method"
                value="cash"
                checked={formData.payment_method === 'cash'}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 focus:ring-blue-500"
              />
              <span className="font-bold text-slate-700">Tunai / COD</span>
            </label>
          </div>
        </div>

        {/* Dynamic calculation cost summary block */}
        <div className="bg-blue-950 text-blue-50 p-4 rounded-2xl shadow-sm border border-blue-900 space-y-3">
          <div className="flex items-center justify-between border-b border-blue-900 pb-2">
            <span className="font-bold text-[10px] uppercase tracking-wider text-blue-300">Rincian Pembayaran</span>
            <Calculator className="w-4 h-4 text-blue-400" />
          </div>

          {calculating ? (
            <div className="text-center py-2 text-blue-300 font-bold">Menghitung ongkos kirim...</div>
          ) : !formData.destination_zone_id ? (
            <div className="text-center py-2 text-blue-300">Silakan pilih zona tujuan untuk kalkulasi ongkir.</div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-blue-300 font-semibold">Tarif Layanan</span>
                <span className="font-bold">Rp {fareDetails.fare.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-300 font-semibold">Platform Fee</span>
                <span className="font-bold">Rp {fareDetails.platformFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-t border-blue-900 pt-2 font-black text-sm">
                <span className="text-white">Total Bayar</span>
                <span className="text-blue-300">Rp {fareDetails.total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          disabled={loading || calculating || !formData.destination_zone_id}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 h-auto text-sm shadow-md active:scale-95 transition-all"
        >
          {loading ? 'Memproses Order...' : 'Konfirmasi & Kirim Order Sekarang'}
        </Button>
      </div>
    </form>
  );
}
