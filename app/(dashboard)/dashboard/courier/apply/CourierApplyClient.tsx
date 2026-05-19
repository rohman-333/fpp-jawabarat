'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { applyAsCourier } from '@/app/actions/delivery';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { 
  User, Truck, MapPin, Shield, CheckCircle, FileText, ArrowRight, ArrowLeft 
} from 'lucide-react';

interface CourierApplyClientProps {
  userId: string;
  zones: any[];
}

export function CourierApplyClient({ userId, zones }: CourierApplyClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    vehicle_type: 'motor',
    vehicle_brand: '',
    vehicle_plate: '',
    service_area: '',
    zone_id: '',
    can_deliver_goods: true,
    can_deliver_food: true,
    can_do_errand: true,
    can_ride_passenger: false // Disabled by default / verified later
  });

  const [docs, setDocs] = useState({
    identity_card_url: '',
    driver_license_url: '',
    vehicle_registration_url: '',
    selfie_url: ''
  });

  const nextStep = () => {
    if (step === 1 && (!formData.full_name || !formData.phone || !formData.zone_id)) {
      setError('Harap lengkapi semua data profil wajib.');
      return;
    }
    if (step === 2 && (formData.vehicle_type !== 'jalan_kaki' && (!formData.vehicle_brand || !formData.vehicle_plate))) {
      setError('Harap lengkapi detail kendaraan Anda.');
      return;
    }
    setError(null);
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleDocUploaded = (name: string, url: string) => {
    setDocs(prev => ({ ...prev, [name]: url }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!docs.identity_card_url || !docs.selfie_url) {
      setError('Dokumen KTP dan Foto Selfie wajib diunggah.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await applyAsCourier({
      ...formData,
      zone_id: formData.zone_id || null,
      identity_card_url: docs.identity_card_url || null,
      driver_license_url: docs.driver_license_url || null,
      vehicle_registration_url: docs.vehicle_registration_url || null,
      selfie_url: docs.selfie_url || null
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push('/dashboard/courier');
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
      {/* Header Banner */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
        <h2 className="text-xl font-extrabold flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-400" />
          Pendaftaran Kemitraan Kurir
        </h2>
        <p className="text-blue-200/80 text-xs mt-1">
          Lengkapi formulir 3 langkah di bawah untuk bergabung menjadi kurir resmi WIBAWA NUSANTARA.
        </p>

        {/* Steps Progress */}
        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= s ? 'bg-blue-500 text-white' : 'bg-blue-950 text-blue-400 border border-blue-800'
              }`}>
                {s}
              </div>
              <span className={`text-[10px] uppercase font-bold hidden sm:inline ${
                step >= s ? 'text-white' : 'text-blue-400'
              }`}>
                {s === 1 ? 'Data Diri' : s === 2 ? 'Layanan' : 'Dokumen'}
              </span>
              {s < 3 && <div className="flex-1 h-[2px] bg-blue-900/60" />}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg font-medium">
            {error}
          </div>
        )}

        {/* STEP 1: Personal Profile */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> 1. Data Diri & Wilayah
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nama Lengkap Sesuai KTP <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleTextChange}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Nomor Handphone / WhatsApp <span className="text-red-500">*</span></label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleTextChange}
                placeholder="Contoh: 08123456789"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Zona Layanan Utama <span className="text-red-500">*</span></label>
                <select
                  name="zone_id"
                  value={formData.zone_id}
                  onChange={handleTextChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">-- Pilih Zona --</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({zone.city || zone.province})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Cakupan Wilayah / Area</label>
                <input
                  type="text"
                  name="service_area"
                  value={formData.service_area}
                  onChange={handleTextChange}
                  placeholder="Misal: Bandung Timur, Bekasi Barat"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Vehicle & Services */}
        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" /> 2. Kendaraan & Tipe Layanan
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Jenis Kendaraan</label>
              <select
                name="vehicle_type"
                value={formData.vehicle_type}
                onChange={handleTextChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              >
                <option value="motor">Sepeda Motor</option>
                <option value="mobil">Mobil</option>
                <option value="sepeda">Sepeda</option>
                <option value="jalan_kaki">Jalan Kaki / Tanpa Kendaraan</option>
              </select>
            </div>

            {formData.vehicle_type !== 'jalan_kaki' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Merk / Model Kendaraan</label>
                  <input
                    type="text"
                    name="vehicle_brand"
                    value={formData.vehicle_brand}
                    onChange={handleTextChange}
                    placeholder="Contoh: Honda Beat, Toyota Avanza"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nomor Plat Kendaraan</label>
                  <input
                    type="text"
                    name="vehicle_plate"
                    value={formData.vehicle_plate}
                    onChange={handleTextChange}
                    placeholder="Contoh: D 1234 ABC"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>
            )}

            {/* Checkboxes of services */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Layanan Yang Dapat Anda Terima:</span>

              <label className="flex items-center gap-3 cursor-pointer group py-1">
                <input
                  type="checkbox"
                  checked={formData.can_deliver_goods}
                  onChange={(e) => handleCheckboxChange('can_deliver_goods', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Kirim & Antar Barang</p>
                  <p className="text-slate-500">Menerima order pengiriman paket dokumen/barang.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group py-1">
                <input
                  type="checkbox"
                  checked={formData.can_deliver_food}
                  onChange={(e) => handleCheckboxChange('can_deliver_food', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Pengantaran Makanan & Belanja</p>
                  <p className="text-slate-500">Menerima order makanan atau belanja kebutuhan harian.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group py-1">
                <input
                  type="checkbox"
                  checked={formData.can_do_errand}
                  onChange={(e) => handleCheckboxChange('can_do_errand', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Jasa Titip Beli / Errand</p>
                  <p className="text-slate-500">Membantu membelikan barang titipan serbaguna.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group py-1 border-t border-slate-200/60 pt-2 opacity-80">
                <input
                  type="checkbox"
                  checked={formData.can_ride_passenger}
                  onChange={(e) => handleCheckboxChange('can_ride_passenger', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    Ojek / Antar Penumpang
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Verifikasi Tambahan</span>
                  </p>
                  <p className="text-slate-500">Mengantar orang/penumpang. Butuh pengecekan berkas & safety ketat oleh admin.</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: Document Uploads */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" /> 3. Dokumen & Verifikasi KTP
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Foto KTP Asli <span className="text-red-500">*</span></h4>
                <div className="w-full h-40 border border-slate-200 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center relative">
                  <ImageUploader
                    name="identity_card_url"
                    label=""
                    defaultValue={docs.identity_card_url}
                    type="photo"
                    userId={userId}
                  />
                  {/* Sync logic in client state */}
                  <FormUploaderObserver 
                    name="identity_card_url" 
                    onChange={(url) => handleDocUploaded('identity_card_url', url)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Foto Selfie dengan KTP <span className="text-red-500">*</span></h4>
                <div className="w-full h-40 border border-slate-200 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center relative">
                  <ImageUploader
                    name="selfie_url"
                    label=""
                    defaultValue={docs.selfie_url}
                    type="avatar"
                    userId={userId}
                  />
                  <FormUploaderObserver 
                    name="selfie_url" 
                    onChange={(url) => handleDocUploaded('selfie_url', url)} 
                  />
                </div>
              </div>
            </div>

            {formData.vehicle_type !== 'sepeda' && formData.vehicle_type !== 'jalan_kaki' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Foto Surat Izin Mengemudi (SIM)</h4>
                  <div className="w-full h-40 border border-slate-200 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center relative">
                    <ImageUploader
                      name="driver_license_url"
                      label=""
                      defaultValue={docs.driver_license_url}
                      type="photo"
                      userId={userId}
                    />
                    <FormUploaderObserver 
                      name="driver_license_url" 
                      onChange={(url) => handleDocUploaded('driver_license_url', url)} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Foto Surat Tanda Nomor Kendaraan (STNK)</h4>
                  <div className="w-full h-40 border border-slate-200 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center relative">
                    <ImageUploader
                      name="vehicle_registration_url"
                      label=""
                      defaultValue={docs.vehicle_registration_url}
                      type="photo"
                      userId={userId}
                    />
                    <FormUploaderObserver 
                      name="vehicle_registration_url" 
                      onChange={(url) => handleDocUploaded('vehicle_registration_url', url)} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            className="flex items-center gap-2 px-5 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        ) : (
          <div />
        )}

        {step < 3 ? (
          <Button
            type="button"
            onClick={nextStep}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 px-5"
          >
            Lanjut <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 px-6"
          >
            {loading ? 'Mengirim...' : 'Kirim Pendaftaran'}
            <CheckCircle className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Inline helper to sync hidden uploader values back to state reactively
import { useEffect } from 'react';
function FormUploaderObserver({ name, onChange }: { name: string; onChange: (val: string) => void }) {
  useEffect(() => {
    const timer = setInterval(() => {
      const el = document.getElementsByName(name)[0] as HTMLInputElement;
      if (el && el.value) {
        onChange(el.value);
      }
    }, 800);
    return () => clearInterval(timer);
  }, [name, onChange]);

  return null;
}
