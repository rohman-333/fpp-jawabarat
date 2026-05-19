import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { saveProduct } from '../actions';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewProductPage() {
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

  const { data: fetchedCategories, error: fetchError } = await supabase
    .from('product_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const categories = (!fetchError && fetchedCategories && fetchedCategories.length > 0)
    ? fetchedCategories
    : [{ id: '', name: 'Lainnya', slug: 'lainnya' }];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar 
        isAdmin={profile?.role === 'admin' || profile?.role === 'operator' || profile?.role === 'superadmin'} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Tambah Produk" userName={profile?.name || 'User'} avatarUrl={profile?.avatar_url} />

        {!profile?.is_seller && (profile?.role === 'superadmin' || profile?.role === 'admin') ? (
          <main className="p-4 md:p-8 flex-1 flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center max-w-md w-full">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Administrator</h2>
              <p className="text-slate-500 mb-6">Akun Anda belum terdaftar sebagai Seller, namun Anda memiliki hak akses Administrator untuk mengelola seluruh Marketplace.</p>
              <div className="space-y-3">
                <Link href="/admin/marketplace/products/new" className="block w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                  Tambah Produk dari Admin
                </Link>
                <Link href="/admin/marketplace" className="block w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">
                  Kelola Marketplace
                </Link>
              </div>
            </div>
          </main>
        ) : !profile?.is_seller ? (
          <main className="p-4 md:p-8 flex-1 flex items-center justify-center">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center max-w-md w-full">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Anda Belum Menjadi Seller</h2>
              <p className="text-slate-500 mb-6">Silakan ajukan pembukaan toko terlebih dahulu untuk mulai berjualan di Marketplace FPP JAWABARAT.</p>
              <div className="space-y-3">
                <Link href="/dashboard/seller/apply" className="block w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                  Ajukan Buka Toko
                </Link>
                <Link href="/dashboard" className="block w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors">
                  Kembali ke Dashboard
                </Link>
              </div>
            </div>
          </main>
        ) : (
          <main className="p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <Link href="/dashboard/products" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-emerald-600 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Katalog
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">Detail Produk Baru</h2>
                <p className="text-slate-500 text-sm mt-1">Lengkapi informasi produk yang akan dijual di Marketplace.</p>
              </div>
              
              <form action={saveProduct} className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Foto Produk */}
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Foto Produk Utama</h3>
                    <div className="max-w-md">
                      <ImageUploader 
                        name="image_url"
                        label=""
                        type="product"
                        userId={user.id}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Nama Produk <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      name="name" 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                      placeholder="Contoh: Madu Hutan Asli 500ml" 
                    />
                  </div>

                  {/* Hidden slug will be generated in actions.ts if not provided */}

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Kategori <span className="text-red-500">*</span></label>
                    <select 
                      required 
                      name="category_id" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    >
                      <option value="">Pilih Kategori</option>
                      {categories?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Status Awal</label>
                    <select 
                      name="status" 
                      defaultValue="pending"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                    >
                      <option value="pending">Pending (Menunggu Review)</option>
                      <option value="active">Active (Tampil di Marketplace)</option>
                      <option value="hidden">Hidden (Sembunyikan Sementara)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Harga (Rp) <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      name="price" 
                      type="number" 
                      min="0"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                      placeholder="0" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Stok Tersedia <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      name="stock" 
                      type="number" 
                      min="0"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                      placeholder="0" 
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Deskripsi Lengkap <span className="text-red-500">*</span></label>
                    <textarea 
                      required 
                      name="description" 
                      rows={5}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                      placeholder="Jelaskan detail produk, bahan, ukuran, dan keunggulan..." 
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <Link href="/dashboard/products">
                    <Button type="button" variant="outline">Batal</Button>
                  </Link>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8">
                    Simpan Produk
                  </Button>
                </div>
              </form>
            </div>
          </div>
          </main>
        )}
      </div>
    </div>
  );
}
