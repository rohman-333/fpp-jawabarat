'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// Valid statuses matching database constraint programs_status_check
const VALID_PROGRAM_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
] as const;

export function ProgramForm({ initialData = null }: { initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const isEditing = !!initialData;

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 6000);
  };

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

    // Validate status client-side before sending
    const validStatuses = VALID_PROGRAM_STATUSES.map(s => s.value) as string[];
    if (!validStatuses.includes(status)) {
      showToast('error', `Status "${status}" tidak valid. Pilih salah satu: ${validStatuses.join(', ')}`);
      setLoading(false);
      return;
    }

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
      let msg = error.message;
      if (error.code === '23514') {
        msg = `Constraint violation pada tabel programs: Status "${status}" tidak diterima database. Status yang valid: draft, published, archived. Detail: ${error.message}`;
      } else if (error.code === '23505') {
        msg = `Data duplikat: Slug "${slug}" sudah dipakai program lain. Gunakan slug berbeda. Detail: ${error.message}`;
      } else if (error.code === '23503') {
        msg = `Referensi tidak valid: ${error.message}`;
      }
      showToast('error', msg);
      setLoading(false);
    } else {
      router.push('/admin/program');
      router.refresh();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] max-w-md px-5 py-3.5 rounded-2xl shadow-xl border flex items-start gap-3 animate-in slide-in-from-right duration-300
          ${toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' 
            ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            : <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          }
          <span className="text-sm font-semibold leading-relaxed">{toast.message}</span>
        </div>
      )}

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
                  {VALID_PROGRAM_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
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

