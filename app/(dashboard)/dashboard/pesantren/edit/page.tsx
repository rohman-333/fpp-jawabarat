import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { savePesantren } from '../actions';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/shared/ImageUploader';

export default async function EditPesantrenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: pesantren } = await supabase
    .from('pesantren')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar 
        isAdmin={false} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Lengkapi Profil Pesantren" userName={profile?.name || 'Pesantren'} avatarUrl={profile?.avatar_url} />

        <main className="p-8">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800">Formulir Data Pesantren</h2>
              <p className="text-slate-500 text-sm mt-1">Lengkapi data dengan sebenar-benarnya untuk keperluan verifikasi direktori FPP JAWABARAT.</p>
            </div>
            
            <form action={savePesantren} className="p-6 space-y-8">
              {/* Seksi 1: Informasi Dasar */}
              <div>
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">1</span>
                  Informasi Dasar
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <ImageUploader 
                    name="logo_url"
                    label="Logo Pesantren"
                    defaultValue={pesantren?.logo_url}
                    type="logo"
                    userId={user.id}
                  />
                  <ImageUploader 
                    name="foto_url"
                    label="Foto Fasilitas Utama (Pesantren)"
                    defaultValue={pesantren?.foto_url}
                    type="photo"
                    userId={user.id}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nama Pesantren <span className="text-red-500">*</span></label>
                    <input required defaultValue={pesantren?.name || ''} name="name" type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="Contoh: PP. Darussalam" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Tahun Berdiri</label>
                    <input defaultValue={pesantren?.tahun_berdiri || ''} name="tahun_berdiri" type="number" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="Contoh: 1990" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nama Pendiri</label>
                    <input defaultValue={pesantren?.pendiri || ''} name="pendiri" type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="Nama lengkap pendiri" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Pengasuh Saat Ini <span className="text-red-500">*</span></label>
                    <input required defaultValue={pesantren?.pengasuh || ''} name="pengasuh" type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="Nama lengkap pengasuh" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Jenis Pesantren <span className="text-red-500">*</span></label>
                    <select required defaultValue={pesantren?.jenis_pesantren || ''} name="jenis_pesantren" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none">
                      <option value="">Pilih Jenis</option>
                      <option value="salafiyah">Salafiyah (Tradisional)</option>
                      <option value="khalafiyah">Khalafiyah (Modern)</option>
                      <option value="kombinasi">Kombinasi</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">No. HP / WhatsApp <span className="text-red-500">*</span></label>
                    <input required defaultValue={pesantren?.phone || ''} name="phone" type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="0812xxxxxx" />
                  </div>
                </div>
              </div>

              {/* Seksi 2: Lokasi */}
              <div>
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">2</span>
                  Lokasi Lengkap
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Alamat Jalan / Kp.</label>
                    <input defaultValue={pesantren?.address || ''} name="address" type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="Jalan, RT/RW, Patokan" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Desa/Kelurahan <span className="text-red-500">*</span></label>
                    <input required defaultValue={pesantren?.alamat_desa || ''} name="alamat_desa" type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="Nama desa" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Kecamatan <span className="text-red-500">*</span></label>
                    <input required defaultValue={pesantren?.kecamatan || ''} name="kecamatan" type="text" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="Nama kecamatan" />
                  </div>
                </div>
              </div>

              {/* Seksi 3: Pemetaan Potensi */}
              <div>
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">3</span>
                  Pemetaan Potensi FPP
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Program Pendidikan Unggulan</label>
                    <textarea defaultValue={pesantren?.program_unggulan || ''} name="program_unggulan" rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="Contoh: Tahfidz Qur'an, Kitab Kuning, Bahasa Arab" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Potensi Ekonomi Pesantren Saat Ini</label>
                    <textarea defaultValue={pesantren?.potensi_ekonomi || ''} name="potensi_ekonomi" rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="Contoh: Pertanian organik, Konveksi busana muslim, Peternakan" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Kebutuhan Utama Pengembangan</label>
                    <textarea defaultValue={pesantren?.kebutuhan_utama || ''} name="kebutuhan_utama" rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="Contoh: Modal usaha koperasi, Pembangunan asrama, Pelatihan bisnis" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Minat terhadap Ekosistem Digital AI</label>
                    <textarea defaultValue={pesantren?.minat_digital_ai || ''} name="minat_digital_ai" rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" placeholder="Seberapa jauh ketertarikan/kesiapan pesantren dalam mengadopsi teknologi digital?" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                <Button type="button" variant="outline">Batal</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8">
                  {pesantren ? 'Simpan Perubahan' : 'Kirim Data Pesantren'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
