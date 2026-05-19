'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

export function BannerForm({ initialData = null }: { initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isEditing = !!initialData;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const image_url = formData.get('image_url') as string;
    const cta_label = formData.get('cta_label') as string;
    const cta_url = formData.get('cta_url') as string;
    const placement = formData.get('placement') as string;
    const is_sponsored = formData.get('is_sponsored') === 'on';
    const sponsor_name = formData.get('sponsor_name') as string;
    const sponsor_url = formData.get('sponsor_url') as string;
    const status = formData.get('status') as string;

    const bannerData = {
      title, subtitle, image_url, cta_label, cta_url, placement,
      is_sponsored, sponsor_name, sponsor_url, status
    };

    let error;
    if (isEditing) {
      const res = await supabase.from('site_banners').update(bannerData).eq('id', initialData.id);
      error = res.error;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await supabase.from('site_banners').insert({ ...bannerData, created_by: user?.id });
      error = res.error;
    }

    if (error) {
      alert('Gagal menyimpan banner: ' + error.message);
      setLoading(false);
    } else {
      router.push('/admin/banners');
      router.refresh();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/banners" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEditing ? 'Edit Banner' : 'Tambah Banner Baru'}</h1>
          <p className="text-slate-500 text-sm">Sesuaikan informasi dan penempatan banner.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Detail Banner</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Judul Banner</label>
                <input type="text" name="title" defaultValue={initialData?.title} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Misal: Promo Bulan Ini" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Sub Judul</label>
                <input type="text" name="subtitle" defaultValue={initialData?.subtitle} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Deskripsi singkat" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">URL Gambar *</label>
              <input type="url" name="image_url" required defaultValue={initialData?.image_url} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="https://..." />
              <p className="text-xs text-slate-500 mt-1">Gunakan URL gambar yang valid. Pastikan gambar sudah di-host (contoh dari Supabase Storage).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Teks Tombol (CTA)</label>
                <input type="text" name="cta_label" defaultValue={initialData?.cta_label} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Beli Sekarang" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">URL Tombol</label>
                <input type="text" name="cta_url" defaultValue={initialData?.cta_url} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="/marketplace" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-2 pt-4">Penempatan & Sponsor</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Penempatan *</label>
                <select name="placement" required defaultValue={initialData?.placement || 'landing_hero'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="landing_hero">Landing Page - Hero (Atas)</option>
                  <option value="landing_card">Landing Page - Card (Bawah)</option>
                  <option value="marketplace_hero">Marketplace - Hero</option>
                  <option value="feed_inline">Social Feed - Inline Sponsor</option>
                  <option value="sidebar">Sidebar (Desktop)</option>
                  <option value="pesantren_detail">Detail Pesantren</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Status Banner *</label>
                <select name="status" required defaultValue={initialData?.status || 'active'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <input type="checkbox" name="is_sponsored" defaultChecked={initialData?.is_sponsored} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <span className="font-bold text-slate-700">Ini adalah iklan sponsor (Sponsored)</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nama Sponsor</label>
                  <input type="text" name="sponsor_name" defaultValue={initialData?.sponsor_name} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="PT Contoh" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">URL Website Sponsor</label>
                  <input type="url" name="sponsor_url" defaultValue={initialData?.sponsor_url} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="https://" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end gap-3">
            <Link href="/admin/banners" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
              Batal
            </Link>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-200">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Simpan Banner</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
