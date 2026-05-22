'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { savePesantren } from '../actions';
import { 
  Building2, MapPin, Users, Target, Lightbulb, CheckCircle2, ChevronRight, ChevronLeft, Loader2
} from 'lucide-react';

export function PesantrenStepperForm({ userId, initialData }: { userId: string, initialData?: any }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State to hold form values for the Review step
  const [formData, setFormData] = useState<Record<string, string>>({
    name: initialData?.name || '',
    pendiri: initialData?.pendiri || '',
    pengasuh: initialData?.pengasuh || '',
    hp: initialData?.hp || initialData?.phone || '',
    alamat_desa: initialData?.alamat_desa || '',
    kecamatan: initialData?.kecamatan || '',
    tahun_berdiri: initialData?.tahun_berdiri || '',
    lembaga_formal: initialData?.lembaga_formal ? 'true' : 'false',
    jenis_pesantren: initialData?.jenis_pesantren || 'kombinasi',
    santri_sd: initialData?.santri_sd || '0',
    santri_smp: initialData?.santri_smp || '0',
    santri_sma: initialData?.santri_sma || '0',
    guru_ustadz: initialData?.guru_ustadz || '0',
    program_unggulan: initialData?.program_unggulan || '',
    media_sosial: initialData?.media_sosial || '',
    potensi_ekonomi: initialData?.potensi_ekonomi || '',
    kebutuhan_utama: initialData?.kebutuhan_utama || '',
    koperasi_bmt_usaha: initialData?.koperasi_bmt_usaha || '',
    minat_digital_ai: initialData?.minat_digital_ai || '',
    saran_pemda: initialData?.saran_pemda || '',
    harapan_pemda_forum: initialData?.harapan_pemda_forum || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const steps = [
    { id: 1, title: 'Identitas', icon: Building2 },
    { id: 2, title: 'Lokasi & Profil', icon: MapPin },
    { id: 3, title: 'Santri & SDM', icon: Users },
    { id: 4, title: 'Program & Potensi', icon: Target },
    { id: 5, title: 'Sinergi & Digital', icon: Lightbulb },
    { id: 6, title: 'Review', icon: CheckCircle2 },
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Stepper Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">Formulir Pendataan Pesantren</h2>
        
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full hidden sm:block"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full transition-all duration-500 hidden sm:block"
            style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
          ></div>
          
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div 
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors duration-300 border-4 border-white ${
                    isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 
                    isCompleted ? 'bg-blue-100 text-blue-600' : 
                    'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className={`text-[10px] sm:text-xs font-bold hidden sm:block ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form action={(formData) => {
        setLoading(true);
        savePesantren(formData);
      }} className="p-6 sm:p-8">
        
        {/* Step 1: Identitas Pesantren */}
        <div className={currentStep === 1 ? 'block space-y-6' : 'hidden'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ImageUploader 
              name="logo_url"
              label="Logo Pesantren"
              defaultValue={initialData?.logo_url}
              type="logo"
              userId={userId}
            />
            <ImageUploader 
              name="foto_url"
              label="Foto Fasilitas Utama (Pesantren)"
              defaultValue={initialData?.foto_url}
              type="photo"
              userId={userId}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nama Pondok Pesantren <span className="text-red-500">*</span></label>
              <input required name="name" value={formData.name} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Contoh: PP. Darussalam" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nama Pendiri</label>
              <input name="pendiri" value={formData.pendiri} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Nama lengkap pendiri" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nama Pimpinan / Pengasuh <span className="text-red-500">*</span></label>
              <input required name="pengasuh" value={formData.pengasuh} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Nama lengkap pimpinan saat ini" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nomor HP / WhatsApp Aktif <span className="text-red-500">*</span></label>
              <input required name="hp" value={formData.hp} onChange={handleChange} type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="0812xxxxxx" />
            </div>
          </div>
        </div>

        {/* Step 2: Lokasi dan Profil */}
        <div className={currentStep === 2 ? 'block space-y-6' : 'hidden'}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Alamat Desa / Jalan <span className="text-red-500">*</span></label>
              <input required name="alamat_desa" value={formData.alamat_desa} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Nama Jalan, Blok, RT/RW, Desa" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Kecamatan <span className="text-red-500">*</span></label>
              <input required name="kecamatan" value={formData.kecamatan} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Nama Kecamatan" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tahun Berdiri</label>
                <input name="tahun_berdiri" value={formData.tahun_berdiri} onChange={handleChange} type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Contoh: 1990" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Jenis Pesantren <span className="text-red-500">*</span></label>
                <select required name="jenis_pesantren" value={formData.jenis_pesantren} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                  <option value="salafiyah">Salafiyah (Tradisional / Kitab Kuning)</option>
                  <option value="khalafiyah">Khalafiyah (Modern / Ashriyah)</option>
                  <option value="kombinasi">Kombinasi (Salaf & Modern)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Memiliki Lembaga Pendidikan Formal?</label>
              <select name="lembaga_formal" value={formData.lembaga_formal} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none">
                <option value="false">Tidak Ada (Hanya Madrasah Diniyah/Salaf)</option>
                <option value="true">Ada (SD/MI, SMP/MTs, SMA/MA, dll)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Data Santri dan SDM */}
        <div className={currentStep === 3 ? 'block space-y-6' : 'hidden'}>
          <p className="text-slate-500 text-sm mb-4">Masukkan estimasi jumlah santri aktif dan tenaga pengajar saat ini. Isi angka 0 jika tidak ada.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Jumlah Santri Tingkat Dasar (SD/MI/Sederajat)</label>
              <input name="santri_sd" value={formData.santri_sd} onChange={handleChange} type="number" min="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Jumlah Santri Tingkat Menengah (SMP/MTs/Sederajat)</label>
              <input name="santri_smp" value={formData.santri_smp} onChange={handleChange} type="number" min="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Jumlah Santri Tingkat Atas (SMA/MA/SMK/Sederajat)</label>
              <input name="santri_sma" value={formData.santri_sma} onChange={handleChange} type="number" min="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Jumlah Total Guru / Ustadz</label>
              <input name="guru_ustadz" value={formData.guru_ustadz} onChange={handleChange} type="number" min="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Step 4: Program dan Potensi */}
        <div className={currentStep === 4 ? 'block space-y-6' : 'hidden'}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Program Unggulan Pesantren</label>
              <textarea name="program_unggulan" value={formData.program_unggulan} onChange={handleChange} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Contoh: Tahfidz Qur'an 30 Juz, Kajian Kitab Kuning Alfiyah, Kewirausahaan Santri..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Link Media Sosial / Website</label>
              <input name="media_sosial" value={formData.media_sosial} onChange={handleChange} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Contoh: Instagram @pondokku, www.pondokku.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Potensi Ekonomi / Produk Unggulan</label>
              <textarea name="potensi_ekonomi" value={formData.potensi_ekonomi} onChange={handleChange} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Contoh: Peternakan Lele, Konveksi Busana Muslim, Air Minum Kemasan..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Koperasi / BMT / Unit Usaha Mandiri</label>
              <textarea name="koperasi_bmt_usaha" value={formData.koperasi_bmt_usaha} onChange={handleChange} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Jelaskan jika pesantren memiliki Koperasi Santri atau lembaga keuangan mikro..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Kebutuhan Utama Pengembangan Saat Ini</label>
              <textarea name="kebutuhan_utama" value={formData.kebutuhan_utama} onChange={handleChange} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Contoh: Bantuan modal usaha koperasi, Pembangunan asrama putri, Pelatihan manajemen..." />
            </div>
          </div>
        </div>

        {/* Step 5: Sinergi dan Digitalisasi */}
        <div className={currentStep === 5 ? 'block space-y-6' : 'hidden'}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Minat Pelatihan Santri Digitalpreneur / AI & Teknologi</label>
              <textarea name="minat_digital_ai" value={formData.minat_digital_ai} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Seberapa berminat pesantren dalam mengikutsertakan santri dalam pelatihan teknologi digital dan AI?" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Saran terhadap sinergi dengan Pemerintah Daerah</label>
              <textarea name="saran_pemda" value={formData.saran_pemda} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Saran Anda agar kerjasama Pemerintah Daerah dengan Pesantren lebih efektif..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Harapan terhadap Pemda dan Forum Pondok Pesantren</label>
              <textarea name="harapan_pemda_forum" value={formData.harapan_pemda_forum} onChange={handleChange} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Harapan besar Anda untuk kemajuan pendidikan pesantren di Nusantara..." />
            </div>
          </div>
        </div>

        {/* Step 6: Review */}
        <div className={currentStep === 6 ? 'block space-y-6' : 'hidden'}>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-6">
            <h3 className="text-blue-800 font-bold text-lg mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Tinjauan Akhir
            </h3>
            <p className="text-blue-700/80 text-sm">Pastikan semua data di bawah ini sudah benar sebelum Anda mengirimkan pengajuan ke Admin WIBAWA NUSANTARA.</p>
          </div>

          <div className="space-y-6 divide-y divide-slate-100 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span className="text-slate-500 font-medium">Nama Pesantren</span>
              <span className="sm:col-span-2 font-bold text-slate-800">{formData.name || '-'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
              <span className="text-slate-500 font-medium">Pengasuh</span>
              <span className="sm:col-span-2 font-bold text-slate-800">{formData.pengasuh || '-'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
              <span className="text-slate-500 font-medium">No. HP / WA</span>
              <span className="sm:col-span-2 font-bold text-slate-800">{formData.hp || '-'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
              <span className="text-slate-500 font-medium">Lokasi</span>
              <span className="sm:col-span-2 font-bold text-slate-800">{formData.alamat_desa}, Kec. {formData.kecamatan}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
              <span className="text-slate-500 font-medium">Total Santri</span>
              <span className="sm:col-span-2 font-bold text-slate-800">
                {parseInt(formData.santri_sd) + parseInt(formData.santri_smp) + parseInt(formData.santri_sma)} Orang
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
              <span className="text-slate-500 font-medium">Program Unggulan</span>
              <span className="sm:col-span-2 font-bold text-slate-800">{formData.program_unggulan || '-'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4">
              <span className="text-slate-500 font-medium">Saran Pemda</span>
              <span className="sm:col-span-2 font-bold text-slate-800 italic">"{formData.saran_pemda || '-'}"</span>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
          <Button 
            type="button" 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 1 || loading}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali
          </Button>
          
          {currentStep < 6 ? (
            <Button 
              type="button" 
              onClick={nextStep} 
              className="bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2"
            >
              Lanjut <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {loading ? 'Menyimpan...' : 'Kirim Pengajuan'}
            </Button>
          )}
        </div>

      </form>
    </div>
  );
}
