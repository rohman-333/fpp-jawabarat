import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { saveProfile } from './actions';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { User, ShieldCheck } from 'lucide-react';

export default async function ProfilePage() {
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

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar 
        isAdmin={profile?.role === 'admin' || profile?.role === 'operator'} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Profil Pengguna" userName={profile?.name || 'User'} avatarUrl={profile?.avatar_url} />

        <main className="p-8">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Pengaturan Akun</h2>
                <p className="text-slate-500 text-sm mt-1">Kelola identitas dan kredensial Anda di platform FPP JAWABARAT.</p>
              </div>
              <div className="hidden sm:flex w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center">
                <User className="w-6 h-6" />
              </div>
            </div>
            
            <form action={saveProfile} className="p-6 space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Photo Uploaders */}
                <div className="w-full md:w-1/3 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Foto Sampul / Cover</h3>
                    <div className="aspect-[21/9] w-full max-w-full mx-auto bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      <ImageUploader 
                        name="cover_url"
                        label=""
                        defaultValue={profile?.cover_url}
                        type="profile"
                        userId={user.id}
                        bucket="covers"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Foto Profil</h3>
                    <div className="aspect-square w-full max-w-[150px] mx-auto bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                      <ImageUploader 
                        name="avatar_url"
                        label=""
                        defaultValue={profile?.avatar_url}
                        type="avatar"
                        userId={user.id}
                      />
                    </div>
                  </div>
                </div>

                {/* Profil Data */}
                <div className="w-full md:w-2/3 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nama Lengkap / Penanggung Jawab <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      defaultValue={profile?.name || ''} 
                      name="name" 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                      placeholder="Nama Anda" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Bio Singkat</label>
                    <textarea 
                      defaultValue={profile?.bio || ''} 
                      name="bio" 
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none" 
                      placeholder="Ceritakan sedikit tentang Anda..." 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Lokasi / Kota</label>
                      <input 
                        defaultValue={profile?.location || ''} 
                        name="location" 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                        placeholder="Misal: Bandung, Jawa Barat" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Tanggal Lahir</label>
                      <input 
                        defaultValue={profile?.birth_date || ''} 
                        name="birth_date" 
                        type="date" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Nomor WhatsApp</label>
                      <input 
                        defaultValue={profile?.phone || ''} 
                        name="phone" 
                        type="tel" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                        placeholder="Contoh: 081234567890" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Website</label>
                      <input 
                        defaultValue={profile?.website || ''} 
                        name="website" 
                        type="url" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                        placeholder="https://" 
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="pt-2 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Sosial Media</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <input defaultValue={profile?.social_links?.instagram || ''} name="instagram" type="text" placeholder="Username Instagram" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" />
                      <input defaultValue={profile?.social_links?.facebook || ''} name="facebook" type="text" placeholder="Username Facebook" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" />
                      <input defaultValue={profile?.social_links?.tiktok || ''} name="tiktok" type="text" placeholder="Username TikTok" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-sm font-semibold text-slate-700">Email Login</label>
                    <input 
                      readOnly 
                      disabled
                      value={user.email || ''} 
                      type="email" 
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed" 
                    />
                    <p className="text-xs text-slate-400">Email tidak dapat diubah secara mandiri.</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-2.5 rounded-lg h-auto">
                  Simpan Profil
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
