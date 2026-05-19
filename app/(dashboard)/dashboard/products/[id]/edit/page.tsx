import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { saveProduct } from '../../actions';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function EditProductPage({ params }: { params: { id: string } }) {
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

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .eq('seller_id', user.id)
    .single();

  if (!product) {
    redirect('/dashboard/products');
  }

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
        isAdmin={profile?.role === 'admin' || profile?.role === 'operator'} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Edit Produk" userName={profile?.name || 'User'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <Link href="/dashboard/products" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-emerald-600 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Katalog
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">Edit Data Produk</h2>
                <p className="text-slate-500 text-sm mt-1">Perbarui informasi produk {product.name}.</p>
              </div>
              
              <form action={saveProduct} className="p-6 space-y-8">
                <input type="hidden" name="id" value={product.id} />
                <input type="hidden" name="slug" value={product.slug} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Foto Produk */}
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Foto Produk Utama</h3>
                    <div className="max-w-md">
                      <ImageUploader 
                        name="image_url"
                        label=""
                        type="product"
                        defaultValue={product.image_url}
                        userId={user.id}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Nama Produk <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      defaultValue={product.name}
                      name="name" 
                      type="text" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Kategori <span className="text-red-500">*</span></label>
                    <select 
                      required 
                      defaultValue={product.category_id || ''}
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
                    <label className="text-sm font-semibold text-slate-700">Status</label>
                    <select 
                      name="status" 
                      defaultValue={product.status || 'pending'}
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
                      defaultValue={product.price}
                      name="price" 
                      type="number" 
                      min="0"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Stok Tersedia <span className="text-red-500">*</span></label>
                    <input 
                      required 
                      defaultValue={product.stock}
                      name="stock" 
                      type="number" 
                      min="0"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Deskripsi Lengkap <span className="text-red-500">*</span></label>
                    <textarea 
                      required 
                      defaultValue={product.description || ''}
                      name="description" 
                      rows={5}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none" 
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <Link href="/dashboard/products">
                    <Button type="button" variant="outline">Batal</Button>
                  </Link>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8">
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
