import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Plus, Edit, Trash2, Eye, ShieldCheck, Store, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { deleteProduct } from './actions';
import { resolveMediaUrlWithFallback } from '@/lib/media/resolveMediaUrl';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 1. Safe Profile Query
  let profile: any = null;
  let profileErrorMsg: string | null = null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, is_seller, seller_status, has_pesantren, pesantren_id, avatar_url')
      .eq('id', user.id)
      .single();

    if (error) {
      profileErrorMsg = error.message;
    } else {
      profile = data;
    }
  } catch (err: any) {
    profileErrorMsg = err?.message || 'Gagal memuat profil pengguna.';
  }

  // 2. Logic Akses: Admin/Superadmin/Team/Operator
  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'operator' || profile?.role === 'team';

  // 3. Logic Akses: Bukan Seller
  const isApprovedSeller = profile?.is_seller && profile?.seller_status === 'approved';

  // Can manage products if approved seller OR admin
  const canManageProducts = isApprovedSeller || isAdmin;

  // 4. Safe Products Query
  let products: any[] = [];
  let productsError: any = null;
  let queryStepFailed = '';

  if (canManageProducts && profile) {
    try {
      queryStepFailed = 'primary_query';
      let dbQuery = supabase
        .from('products')
        .select('id, name, slug, description, price, stock, category, category_id, image_url, status, seller_id, created_at')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        dbQuery = dbQuery.eq('seller_id', user.id);
      }

      const { data, error } = await dbQuery;

      if (error) {
        throw error;
      }
      products = data || [];
    } catch (primaryErr: any) {
      console.error('[SELLER_PRODUCTS_PAGE_ERROR_DETAIL] Primary query failed. Attempting fallback query.', {
        message: primaryErr?.message,
        code: primaryErr?.code,
        details: primaryErr?.details,
        queryStep: queryStepFailed
      });

      try {
        queryStepFailed = 'fallback_query';
        let dbQuery = supabase
          .from('products')
          .select('id, name, price, created_at')
          .order('created_at', { ascending: false });

        if (!isAdmin) {
          dbQuery = dbQuery.eq('seller_id', user.id);
        }

        const { data, error } = await dbQuery;

        if (error) {
          throw error;
        }
        products = data || [];
      } catch (fallbackErr: any) {
        productsError = fallbackErr;
        console.error('[SELLER_PRODUCTS_PAGE_ERROR_DETAIL] Fallback query failed:', {
          message: fallbackErr?.message,
          code: fallbackErr?.code,
          details: fallbackErr?.details,
          queryStep: queryStepFailed
        });
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar 
        isAdmin={isAdmin} 
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
                <p className="text-sm text-slate-500 mt-1">Kelola barang dan produk toko Anda</p>
              </div>
              {canManageProducts && (
                <Link href="/dashboard/products/new">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Produk
                  </Button>
                </Link>
              )}
            </div>

            {/* Error state for profile fetch */}
            {profileErrorMsg && (
              <div className="bg-red-50 border border-red-200 p-6 rounded-2xl mb-8 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-900 mb-1">Gagal memuat profil</h2>
                  <p className="text-red-700/80 text-sm">{profileErrorMsg}</p>
                </div>
              </div>
            )}

            {/* Error state for products fetch */}
            {productsError && (
              <div className="bg-red-50 border border-red-200 p-6 rounded-2xl mb-8 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-900 mb-1">Produk belum dapat dimuat</h2>
                  {isAdmin && (
                    <p className="text-red-700/85 text-xs font-mono mt-1 whitespace-pre-wrap">
                      Error: {productsError.message || JSON.stringify(productsError)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Akses Logic UI */}
            {!canManageProducts ? (
              <div className="bg-amber-50 border border-amber-200 p-8 rounded-3xl mb-8 shadow-sm text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <Store className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-amber-950 mb-2">Anda belum menjadi seller</h2>
                <p className="text-amber-700/80 text-sm mb-6 max-w-md">
                  Untuk dapat menambahkan dan mengelola produk di marketplace, Anda harus membuka toko dan disetujui oleh admin terlebih dahulu.
                </p>
                <Link href="/dashboard/seller/apply">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 px-6 rounded-xl border-none shadow-lg shadow-amber-600/20">
                    Ajukan Buka Toko
                  </Button>
                </Link>
              </div>
            ) : (
              /* Approved Seller / Admin View */
              <>
                {isAdmin && !isApprovedSeller && (
                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-3xl mb-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-blue-950">Akses Administrator</h2>
                        <p className="text-blue-700/80 text-xs mt-0.5">
                          Anda masuk sebagai administrator. Anda dapat membuat produk Anda sendiri langsung dari sini.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href="/admin/marketplace">
                        <Button variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-50 font-bold px-4 py-2 rounded-xl text-xs">
                          Admin Marketplace
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
                {products.length === 0 ? (
                  <div className="mt-10">
                    <EmptyState 
                      title="Belum ada produk" 
                      description="Mulai tambahkan produk pertama Anda agar dapat dilihat oleh pengunjung marketplace."
                      icon={<ShoppingBag className="w-8 h-8 text-slate-400" />}
                      action={
                        <Link href="/dashboard/products/new">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold mt-2">
                            Tambah Produk
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
                                      <img src={resolveMediaUrlWithFallback(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <ShoppingBag className="w-5 h-5" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 text-sm line-clamp-1">{product.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">/{product.slug || product.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-600">
                                {product.category || 'Lainnya'}
                              </td>
                              <td className="py-4 px-6 font-semibold text-blue-700 text-sm">
                                Rp {product.price?.toLocaleString('id-ID') || 0}
                              </td>
                              <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                                {product.stock || 0}
                              </td>
                              <td className="py-4 px-6">
                                {(product.status === 'active' || !product.status) && <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider border border-blue-200">Aktif</span>}
                                {product.status === 'pending' && <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider border border-amber-200">Pending</span>}
                                {product.status === 'hidden' && <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider border border-slate-200">Hidden</span>}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Link href={`/marketplace/${product.slug || product.id}`} target="_blank">
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
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
