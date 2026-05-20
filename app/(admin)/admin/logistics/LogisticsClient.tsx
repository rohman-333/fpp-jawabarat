// app/(admin)/admin/logistics/LogisticsClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Truck, MapPin, DollarSign, Award, FileText, 
  Settings, Users, CheckCircle, Plus, AlertCircle, 
  Loader2, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';

interface LogisticsClientProps {
  initialServices: any[];
  initialZones: any[];
  initialFares: any[];
  initialMethods: any[];
  initialCouriers: any[];
  initialDeliveries: any[];
  initialPayouts: any[];
  initialSettings: Record<string, any>;
  initialTab?: string;
}

export function LogisticsClient({
  initialServices,
  initialZones,
  initialFares,
  initialMethods,
  initialCouriers,
  initialDeliveries,
  initialPayouts,
  initialSettings,
  initialTab = 'overview'
}: LogisticsClientProps) {
  const supabase = createClient();
  const searchParams = useSearchParams();
  
  // Navigation active tab state
  const [activeTab, setActiveTab] = useState(initialTab);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Data collections state
  const [serviceTypes, setServiceTypes] = useState(initialServices);
  const [zones, setZones] = useState(initialZones);
  const [fares, setFares] = useState(initialFares);
  const [methods, setMethods] = useState(initialMethods);
  const [couriers, setCouriers] = useState(initialCouriers);
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [payouts, setPayouts] = useState(initialPayouts);
  const [settings, setSettings] = useState(initialSettings);

  // Forms states
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [newZone, setNewZone] = useState({ name: '', province: 'Jawa Barat', city: '', district: '', postal_code: '' });
  const [showFareModal, setShowFareModal] = useState(false);
  const [newFare, setNewFare] = useState({ service_type_id: '', zone_id: '', base_fare: 5000, per_km_fare: 2500, minimum_fare: 7000, platform_fee: 1000 });

  const triggerToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle service types toggle
  const toggleServiceActive = async (id: string, current: boolean) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from('service_types').update({ is_active: !current }).eq('id', id);
      if (error) throw error;
      setServiceTypes(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
      triggerToast('Kategori layanan berhasil diperbarui!');
    } catch (err: any) {
      triggerToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle shipping method toggle
  const toggleMethodActive = async (id: string, current: boolean) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from('shipping_methods').update({ is_active: !current }).eq('id', id);
      if (error) throw error;
      setMethods(prev => prev.map(m => m.id === id ? { ...m, is_active: !current } : m));
      triggerToast('Metode pengiriman berhasil diperbarui!');
    } catch (err: any) {
      triggerToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Zone
  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZone.name || !newZone.city) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.from('delivery_zones').insert([newZone]).select();
      if (error) throw error;
      if (data) setZones(prev => [...prev, data[0]]);
      setShowZoneModal(false);
      setNewZone({ name: '', province: 'Jawa Barat', city: '', district: '', postal_code: '' });
      triggerToast('Zona pengiriman baru berhasil ditambahkan!');
    } catch (err: any) {
      triggerToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Fare Rule
  const handleAddFare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFare.service_type_id || !newFare.zone_id) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.from('delivery_fare_rules').insert([newFare]).select('*, service_types(name), delivery_zones(name)');
      if (error) throw error;
      if (data) setFares(prev => [...prev, data[0]]);
      setShowFareModal(false);
      triggerToast('Aturan tarif ongkir berhasil ditambahkan!');
    } catch (err: any) {
      triggerToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Courier approvals & Safety verifications
  const approveCourier = async (id: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from('courier_profiles').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      setCouriers(prev => prev.map(c => c.id === id ? { ...c, status: 'approved' } : c));
      triggerToast('Profil Kurir berhasil disetujui!');
    } catch (err: any) {
      triggerToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSafetyVerified = async (id: string, current: boolean) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.from('courier_profiles').update({ safety_verified: !current }).eq('id', id);
      if (error) throw error;
      setCouriers(prev => prev.map(c => c.id === id ? { ...c, safety_verified: !current } : c));
      triggerToast('Status verifikasi safety kurir berhasil diperbarui!');
    } catch (err: any) {
      triggerToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle settings
  const toggleSettingBool = async (key: string, field: string, current: boolean) => {
    setActionLoading(true);
    try {
      const updatedValue = { ...settings[key], [field]: !current };
      const { error } = await supabase.from('logistics_settings').update({ value: updatedValue }).eq('key', key);
      if (error) throw error;
      setSettings(prev => ({ ...prev, [key]: updatedValue }));
      triggerToast('Pengaturan global berhasil diperbarui!');
    } catch (err: any) {
      triggerToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Approve payout
  const approvePayout = async (id: string, amount: number, courierId: string) => {
    setActionLoading(true);
    try {
      const { error: payoutErr } = await supabase.from('courier_payouts').update({ status: 'approved' }).eq('id', id);
      if (payoutErr) throw payoutErr;

      await supabase.from('courier_wallet_transactions').insert([{
        courier_id: courierId,
        type: 'payout',
        amount: -amount,
        status: 'paid',
        description: 'Pencairan saldo komisi kurir disetujui admin'
      }]);

      setPayouts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
      triggerToast('Pencairan komisi berhasil disetujui & dicairkan!');
    } catch (err: any) {
      triggerToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-lg transition-all ${
          toastMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold">{toastMsg.text}</span>
        </div>
      )}

      {/* Navigation Submenu tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Ringkasan', icon: <Truck className="w-4 h-4" /> },
          { id: 'services', label: 'Kategori Layanan', icon: <Award className="w-4 h-4" /> },
          { id: 'zones', label: 'Zona Layanan', icon: <MapPin className="w-4 h-4" /> },
          { id: 'fares', label: 'Tarif Ongkir', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'methods', label: 'Pilihan Pengiriman', icon: <FileText className="w-4 h-4" /> },
          { id: 'couriers', label: 'Kelola Kurir', icon: <Users className="w-4 h-4" /> },
          { id: 'payouts', label: 'Pencairan Komisi', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'settings', label: 'Pengaturan Global', icon: <Settings className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap active:scale-95 transition-all ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-slate-400 text-xs font-bold uppercase">Total Pengiriman</p>
              <p className="text-2xl font-bold text-slate-800 mt-2">{deliveries.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-slate-400 text-xs font-bold uppercase">Kurir Terdaftar</p>
              <p className="text-2xl font-bold text-slate-800 mt-2">{couriers.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-slate-400 text-xs font-bold uppercase">Zona Aktif</p>
              <p className="text-2xl font-bold text-slate-800 mt-2">{zones.filter(z => z.is_active).length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-slate-400 text-xs font-bold uppercase">Tarif Ditetapkan</p>
              <p className="text-2xl font-bold text-slate-800 mt-2">{fares.length}</p>
            </div>
          </div>

          {/* Recent Deliveries */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>Pengiriman Aktif Terbaru</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 pb-3">
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Order ID</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Layanan</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Kurir</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Tujuan</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Tarif Argo</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deliveries.length > 0 ? (
                    deliveries.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-mono text-xs text-slate-500 truncate max-w-[100px]">{d.order_id}</td>
                        <td className="py-4 font-bold text-slate-700">{d.service_types?.name || 'Logistik'}</td>
                        <td className="py-4 text-slate-600">{d.courier?.name || 'Mencari Kurir...'}</td>
                        <td className="py-4 text-slate-500 truncate max-w-[180px]">{d.destination_address}</td>
                        <td className="py-4 font-bold text-slate-800">Rp {d.fare_amount?.toLocaleString('id-ID')}</td>
                        <td className="py-4 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            d.status === 'completed' || d.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">Belum ada aktivitas pengantaran.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICE TYPES */}
      {activeTab === 'services' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Jenis Layanan Multi-Service</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {serviceTypes.map(s => (
              <div key={s.id} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-slate-800">{s.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
                    }`}>
                      {s.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{s.description || 'Tidak ada deskripsi'}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold font-mono text-slate-400">{s.code}</span>
                  
                  {s.code === 'ride' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        Butuh Safety Verify
                      </span>
                      <button
                        onClick={() => toggleServiceActive(s.id, s.is_active)}
                        disabled={actionLoading}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                          s.is_active 
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' 
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {s.is_active ? 'Matikan Layanan' : 'Aktifkan Layanan'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => toggleServiceActive(s.id, s.is_active)}
                      disabled={actionLoading}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        s.is_active 
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' 
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {s.is_active ? 'Matikan' : 'Aktifkan'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DELIVERY ZONES */}
      {activeTab === 'zones' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Zona Wilayah Operasional</h2>
              <p className="text-xs text-slate-500">Daftar wilayah pengiriman kurir internal</p>
            </div>
            <Button onClick={() => setShowZoneModal(true)} className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Tambah Zona</span>
            </Button>
          </div>

          {showZoneModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-xs">
              <form onSubmit={handleAddZone} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
                <h3 className="font-bold text-slate-800 text-lg">Tambah Zona Layanan Baru</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Nama Zona</label>
                    <input
                      type="text"
                      required
                      value={newZone.name}
                      onChange={e => setNewZone(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Contoh: Bandung Barat, Sumedang"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-blue-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Provinsi</label>
                      <input
                        type="text"
                        required
                        value={newZone.province}
                        onChange={e => setNewZone(prev => ({ ...prev, province: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Kota/Kabupaten</label>
                      <input
                        type="text"
                        required
                        value={newZone.city}
                        onChange={e => setNewZone(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-blue-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Kecamatan</label>
                      <input
                        type="text"
                        value={newZone.district}
                        onChange={e => setNewZone(prev => ({ ...prev, district: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Kode Pos</label>
                      <input
                        type="text"
                        value={newZone.postal_code}
                        onChange={e => setNewZone(prev => ({ ...prev, postal_code: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-blue-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setShowZoneModal(false)}>Batal</Button>
                  <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 font-bold">Simpan</Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 pb-3">
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Nama Zona</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Kota/Kabupaten</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Kecamatan</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Kode Pos</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zones.length > 0 ? (
                    zones.map(z => (
                      <tr key={z.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-bold text-slate-800">{z.name}</td>
                        <td className="py-4 text-slate-600">{z.city}</td>
                        <td className="py-4 text-slate-500">{z.district || '-'}</td>
                        <td className="py-4 font-mono text-slate-500">{z.postal_code || '-'}</td>
                        <td className="py-4 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            z.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {z.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">Belum ada zona pengiriman.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DELIVERY FARES */}
      {activeTab === 'fares' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Tarif Ongkir & Argo Otomatis</h2>
              <p className="text-xs text-slate-500">Aturan basis argo untuk estimasi kurir per km</p>
            </div>
            <Button onClick={() => setShowFareModal(true)} className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Tambah Tarif</span>
            </Button>
          </div>

          {showFareModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-xs">
              <form onSubmit={handleAddFare} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
                <h3 className="font-bold text-slate-800 text-lg">Tambah Aturan Tarif Ongkir</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Jenis Layanan</label>
                    <select
                      required
                      value={newFare.service_type_id}
                      onChange={e => setNewFare(prev => ({ ...prev, service_type_id: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-blue-600"
                    >
                      <option value="">Pilih Kategori Layanan...</option>
                      {serviceTypes.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Zona Tujuan</label>
                    <select
                      required
                      value={newFare.zone_id}
                      onChange={e => setNewFare(prev => ({ ...prev, zone_id: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-blue-600"
                    >
                      <option value="">Pilih Zona Wilayah...</option>
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Base Fare (Rp)</label>
                      <input
                        type="number"
                        required
                        value={newFare.base_fare}
                        onChange={e => setNewFare(prev => ({ ...prev, base_fare: parseInt(e.target.value) || 0 }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Per Km (Rp)</label>
                      <input
                        type="number"
                        required
                        value={newFare.per_km_fare}
                        onChange={e => setNewFare(prev => ({ ...prev, per_km_fare: parseInt(e.target.value) || 0 }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Minimum Fare (Rp)</label>
                      <input
                        type="number"
                        required
                        value={newFare.minimum_fare}
                        onChange={e => setNewFare(prev => ({ ...prev, minimum_fare: parseInt(e.target.value) || 0 }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1">Platform Fee (Rp)</label>
                      <input
                        type="number"
                        required
                        value={newFare.platform_fee}
                        onChange={e => setNewFare(prev => ({ ...prev, platform_fee: parseInt(e.target.value) || 0 }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-blue-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={() => setShowFareModal(false)}>Batal</Button>
                  <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 font-bold">Simpan</Button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 pb-3">
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Layanan</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Zona Wilayah</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Base Fare</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Ongkir per Km</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Min. Argo</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Potongan Platform</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fares.length > 0 ? (
                    fares.map(f => (
                      <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-bold text-slate-800">{f.service_types?.name || 'Semua'}</td>
                        <td className="py-4 text-slate-700">{f.delivery_zones?.name || 'Global'}</td>
                        <td className="py-4 text-slate-600">Rp {f.base_fare?.toLocaleString('id-ID')}</td>
                        <td className="py-4 text-slate-600">Rp {f.per_km_fare?.toLocaleString('id-ID')} / km</td>
                        <td className="py-4 text-slate-600">Rp {f.minimum_fare?.toLocaleString('id-ID')}</td>
                        <td className="py-4 text-right font-bold text-rose-700">Rp {f.platform_fee?.toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">Belum ada aturan tarif.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SHIPPING METHODS */}
      {activeTab === 'methods' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Pilihan Kurir & Metode Pengiriman</h2>
          <div className="space-y-4">
            {methods.map(m => (
              <div key={m.id} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">{m.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      m.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {m.is_active ? 'Aktif' : 'Mati'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{m.description || 'Tidak ada deskripsi'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMethodActive(m.id, m.is_active)}
                    disabled={actionLoading}
                    className={`px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all ${
                      m.is_active 
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    }`}
                  >
                    {m.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: MANAGE COURIERS */}
      {activeTab === 'couriers' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800">Manajemen Pengemudi & Mitra Kurir</h2>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 pb-3">
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Nama Kurir</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Kontak</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Kendaraan / Plat</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Safety Verified</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {couriers.length > 0 ? (
                    couriers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4">
                          <p className="font-bold text-slate-800">{c.full_name || c.user?.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{c.user?.email}</p>
                        </td>
                        <td className="py-4 text-slate-600">{c.phone || c.user?.phone || '-'}</td>
                        <td className="py-4">
                          <p className="font-bold text-slate-700 uppercase text-xs">{c.vehicle_type} - {c.vehicle_brand}</p>
                          <p className="text-xs text-slate-500 font-mono">{c.vehicle_plate || 'No Plate'}</p>
                        </td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                            c.safety_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {c.safety_verified ? <ShieldCheck className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
                            <span>{c.safety_verified ? 'Verified' : 'Belum'}</span>
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-4 text-right space-y-2">
                          {c.status !== 'approved' && (
                            <button
                              onClick={() => approveCourier(c.id)}
                              disabled={actionLoading}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-xs"
                            >
                              Approve Kurir
                            </button>
                          )}
                          <button
                            onClick={() => toggleSafetyVerified(c.id, c.safety_verified)}
                            disabled={actionLoading}
                            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg"
                          >
                            {c.safety_verified ? 'Cabut Safety' : 'Set Safety'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">Belum ada kurir terdaftar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: COURIER PAYOUT WALLETS */}
      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800">Verifikasi Pencairan Komisi Kurir</h2>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 pb-3">
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Kurir</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Jumlah Pencairan</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Tujuan Transfer</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Tanggal</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.length > 0 ? (
                    payouts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-bold text-slate-800">{p.courier?.name || 'Kurir'}</td>
                        <td className="py-4 font-bold text-slate-800">Rp {p.amount?.toLocaleString('id-ID')}</td>
                        <td className="py-4">
                          <p className="font-bold text-slate-700 text-xs uppercase">{p.method}</p>
                          <p className="text-xs text-slate-500 font-mono">{p.account_number} a.n {p.account_name}</p>
                        </td>
                        <td className="py-4 text-slate-500">{new Date(p.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {p.status === 'pending' && (
                            <button
                              onClick={() => approvePayout(p.id, p.amount, p.courier_id)}
                              disabled={actionLoading}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
                            >
                              Setujui Cair
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-bold">Belum ada pengajuan pencairan.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: GLOBAL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-800">Pengaturan Global Logistik & COD</h2>
          
          <div className="space-y-6 divide-y divide-slate-100">
            {/* COD Option Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
              <div>
                <h3 className="font-bold text-slate-800">Cash on Delivery (COD) Global</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Izinkan pembeli bertransaksi tunai di tempat. Batas maks Rp {settings.cod_settings?.max_amount?.toLocaleString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => toggleSettingBool('cod_settings', 'enabled', settings.cod_settings?.enabled)}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all ${
                  settings.cod_settings?.enabled 
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                {settings.cod_settings?.enabled ? 'Matikan COD' : 'Aktifkan COD'}
              </button>
            </div>

            {/* Ride Passenger Safety */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6">
              <div>
                <h3 className="font-bold text-slate-800">Layanan Ojek Penumpang (Ride)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kunci opsional ride/ojek instan. Driver wajib lulus safety verifications untuk menerima orderan penumpang.
                    </p>
              </div>
              <button
                onClick={() => toggleSettingBool('ride_settings', 'enabled', settings.ride_settings?.enabled)}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all ${
                  settings.ride_settings?.enabled 
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                {settings.ride_settings?.enabled ? 'Matikan Ojek' : 'Aktifkan Ojek'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
