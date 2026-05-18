import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Plus, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { deleteProduct } from './actions';

export default async function ProductsPage() {
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
    .select('id, status')
    .eq('profile_id', user.id)
    .single();

  const { data: products } = await supabase
    .from('products')
    .select('*, product_categories(name)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar 
        isAdmin={profile?.role === 'admin' || profile?.role === 'operator'} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Manajemen Produk" userName={profile?.name || 'User'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Katalog Produk</h1>
                <p className="text-sm text-slate-500 mt-1">Kelola barang dan produk unggulan pesantren Anda</p>
              </div>
              <Link href="/dashboard/products/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  <Plus className="w-4 h-4 mr-2" /> Tambah Produk
                </Button>
              </Link>
            </div>

            {(!pesantren || pesantren.status !== 'verified') && (!profile?.is_seller || profile?.seller_status !== 'approved') ? (
              <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl mb-8 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-amber-900 mb-1">Akses Terbatas</h2>
                  <p className="text-amber-700/80 text-sm mb-3">Produk Anda mungkin tidak akan tampil di Marketplace publik hingga status pesantren atau toko Anda terverifikasi.</p>
                  <Link href="/dashboard/seller/apply">
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none">Ajukan Buka Toko</Button>
                  </Link>
                </div>
              </div>
            ) : null}

            {(!products || products.length === 0) ? (
              <div className="mt-10">
                <EmptyState 
                  title="Belum Ada Produk" 
                  description="Mulai tambahkan produk pertama Anda agar dapat dilihat oleh pengunjung marketplace FPP JAWABARAT."
                  icon={<ShoppingBag className="w-8 h-8 text-slate-400" />}
                  action={
                    <Link href="/dashboard/products/new">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold mt-2">
                        Tambah Produk Baru
                      </Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Produk</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Harga</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Stok</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                {product.image_url ? (
                                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <ShoppingBag className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm line-clamp-1">{product.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">/{product.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600">
                            {product.product_categories?.name || '-'}
                          </td>
                          <td className="py-4 px-6 font-semibold text-emerald-700 text-sm">
                            Rp {product.price.toLocaleString('id-ID')}
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                            {product.stock}
                          </td>
                          <td className="py-4 px-6">
                            {product.status === 'active' && <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider border border-emerald-200">Aktif</span>}
                            {product.status === 'pending' && <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider border border-amber-200">Pending</span>}
                            {product.status === 'hidden' && <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider border border-slate-200">Hidden</span>}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/marketplace/${product.slug}`} target="_blank">
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Publik">
                                  <Eye className="w-4 h-4" />
                                </button>
                              </Link>
                              <Link href={`/dashboard/products/${product.id}/edit`}>
                                <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                                  <Edit className="w-4 h-4" />
                                </button>
                              </Link>
                              <form action={deleteProduct} className="inline-block" onSubmit={(e) => {
                                if(!confirm('Yakin ingin menghapus produk ini?')) e.preventDefault();
                              }}>
                                <input type="hidden" name="id" value={product.id} />
                                <button type="submit" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
