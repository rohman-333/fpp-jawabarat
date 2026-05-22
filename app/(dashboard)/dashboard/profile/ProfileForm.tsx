'use client';

import { useState, useRef } from 'react';
import { saveProfile } from './actions';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { User, Loader2, Check, AlertCircle } from 'lucide-react';

export function ProfileForm({ profile: initialProfile, userEmail, userId }: { profile: any; userEmail: string; userId: string }) {
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current || saving) return;

    console.log('[PROFILE_SAVE_START]');
    setSaving(true);

    try {
      const formData = new FormData(formRef.current);
      const res = await saveProfile(formData);

      if (res.success && res.profile) {
        console.log('[PROFILE_SAVE_SUCCESS]');
        setProfile(res.profile);
        showToast('success', 'Profil berhasil diperbarui!');
        console.log('[PROFILE_STATE_UPDATED]');
      } else {
        console.error('[PROFILE_SAVE_FAILED]', res.error);
        showToast('error', res.error || 'Gagal menyimpan profil.');
      }
    } catch (err: any) {
      console.error('[PROFILE_SAVE_FAILED]', err);
      showToast('error', 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] max-w-sm px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-right duration-300
          ${toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' 
            ? <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          }
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Pengaturan Akun</h2>
            <p className="text-slate-500 text-sm mt-1">Kelola identitas dan kredensial Anda di platform WIBAWA NUSANTARA.</p>
          </div>
          <div className="hidden sm:flex w-12 h-12 rounded-full bg-blue-100 text-blue-600 items-center justify-center">
            <User className="w-6 h-6" />
          </div>
        </div>
        
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Foto Sampul / Cover - Full Width */}
          <div className="w-full">
            <h3 className="text-sm font-bold text-slate-700 mb-3">Foto Sampul / Cover</h3>
            <div className="w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200" style={{ minHeight: '160px', height: '220px' }}>
              <ImageUploader 
                name="cover_url"
                label=""
                defaultValue={profile?.cover_url}
                type="photo"
                userId={userId}
                bucket="covers"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Ukuran ideal: 1200x400px. Tampil di profil publik.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Foto Profil Uploader */}
            <div className="w-full md:w-1/3 space-y-6 flex flex-col items-center">
              <div className="w-full">
                <h3 className="text-sm font-bold text-slate-700 mb-3 text-center md:text-left">Foto Profil</h3>
                <div className="aspect-square w-full max-w-[150px] mx-auto md:mx-0 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                  <ImageUploader 
                    name="avatar_url"
                    label=""
                    defaultValue={profile?.avatar_url}
                    type="avatar"
                    userId={userId}
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                  placeholder="Nama Anda" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Bio Singkat</label>
                <textarea 
                  defaultValue={profile?.bio || ''} 
                  name="bio" 
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none" 
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                    placeholder="Misal: Bandung, Jawa Barat" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tanggal Lahir</label>
                  <input 
                    defaultValue={profile?.birth_date || ''} 
                    name="birth_date" 
                    type="date" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                    placeholder="Contoh: 081234567890" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Website</label>
                  <input 
                    defaultValue={profile?.website || ''} 
                    name="website" 
                    type="url" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" 
                    placeholder="https://" 
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="pt-2 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Sosial Media</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <input defaultValue={profile?.social_links?.instagram || ''} name="instagram" type="text" placeholder="Username Instagram" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                  <input defaultValue={profile?.social_links?.facebook || ''} name="facebook" type="text" placeholder="Username Facebook" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                  <input defaultValue={profile?.social_links?.tiktok || ''} name="tiktok" type="text" placeholder="Username TikTok" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-sm font-semibold text-slate-700">Email Login</label>
                <input 
                  readOnly 
                  disabled
                  value={userEmail} 
                  type="email" 
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed" 
                />
                <p className="text-xs text-slate-400">Email tidak dapat diubah secara mandiri.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2.5 rounded-lg h-auto min-w-[140px] disabled:opacity-70"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                'Simpan Profil'
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
