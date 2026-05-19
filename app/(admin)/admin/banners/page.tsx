import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { canAccessAdmin } from '@/lib/auth/roles';
import { Image as ImageIcon, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default async function AdminBannersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !canAccessAdmin(profile)) redirect('/dashboard');

  const { data: banners } = await supabase.from('site_banners').select('*').order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-blue-600" /> Kelola Banner & Iklan
          </h1>
          <p className="text-slate-500 text-sm mt-1">Atur tampilan banner promo dan sponsor di berbagai area.</p>
        </div>
        <Link href="/admin/banners/new" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-colors whitespace-nowrap">
          <Plus className="w-5 h-5" /> Tambah Banner
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Banner</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Penempatan</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Sponsor</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {banners && banners.length > 0 ? banners.map(banner => (
                <tr key={banner.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 bg-slate-100 rounded overflow-hidden shrink-0">
                        {banner.image_url ? (
                          <img src={banner.image_url} alt={banner.title || 'Banner'} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-slate-300 m-auto mt-3" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{banner.title || 'Tanpa Judul'}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{banner.subtitle || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                      {banner.placement}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {banner.status === 'active' ? (
                      <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">Aktif</span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">{banner.status}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {banner.is_sponsored ? (
                      <div>
                        <p className="text-sm font-bold text-amber-600">{banner.sponsor_name || 'Ya'}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/banners/${banner.id}/edit`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    Belum ada banner yang ditambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
