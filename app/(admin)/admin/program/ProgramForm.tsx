'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

export function ProgramForm({ initialData = null }: { initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isEditing = !!initialData;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const description = formData.get('description') as string;
    const image_url = formData.get('image_url') as string;
    const category = formData.get('category') as string;
    const location = formData.get('location') as string;
    const status = formData.get('status') as string;

    const programData = {
      title, slug, description, image_url, category, location, status
    };

    let error;
    if (isEditing) {
      const res = await supabase.from('programs').update(programData).eq('id', initialData.id);
      error = res.error;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await supabase.from('programs').insert({ ...programData, created_by: user?.id });
      error = res.error;
    }

    if (error) {
      alert('Gagal menyimpan program: ' + error.message);
      setLoading(false);
    } else {
      router.push('/admin/program');
      router.refresh();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/program" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{isEditing ? 'Edit Program' : 'Tambah Program Baru'}</h1>
          <p className="text-slate-500 text-sm">Kelola program sinergi dan donasi.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Judul Program *</label>
                <input type="text" name="title" required defaultValue={initialData?.title} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Slug URL (Opsional)</label>
                <input type="text" name="slug" defaultValue={initialData?.slug} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Otomatis dari judul jika kosong" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Deskripsi Lengkap *</label>
              <textarea name="description" required rows={5} defaultValue={initialData?.description} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">URL Gambar Cover</label>
              <input type="url" name="image_url" defaultValue={initialData?.image_url} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Kategori</label>
                <select name="category" defaultValue={initialData?.category || 'Donasi'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="Donasi">Donasi</option>
                  <option value="Pelatihan">Pelatihan</option>
                  <option value="Beasiswa">Beasiswa</option>
                  <option value="Acara">Acara</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Lokasi (Opsional)</label>
                <input type="text" name="location" defaultValue={initialData?.location} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nusantara" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Status *</label>
                <select name="status" required defaultValue={initialData?.status || 'draft'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t flex justify-end gap-3">
            <Link href="/admin/program" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
              Batal
            </Link>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-200">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Simpan Program</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
