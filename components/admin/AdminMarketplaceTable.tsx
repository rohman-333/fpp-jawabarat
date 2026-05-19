'use client';

import { useTransition } from 'react';
import { Eye, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { setProductStatus } from '@/app/(admin)/admin/marketplace/actions';

export function AdminMarketplaceTable({ products }: { products: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('id', id);
      formData.append('status', newStatus);
      try {
        await setProductStatus(formData);
      } catch (err) {
        console.error(err);
        alert('Gagal memperbarui status');
      }
    });
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Semua Produk Marketplace</h1>
        <p className="text-slate-500 text-sm">Tinjau dan kelola status produk dari semua pesantren.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
             <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Produk</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Pesantren</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Harga & Stok</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ubah Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products && products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 overflow-hidden shrink-0">
                          {product.image_url && <img src={product.image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm line-clamp-1">{product.name}</p>
                          <Link href={`/marketplace/${product.slug}`} target="_blank" className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                            <Eye className="w-3 h-3" /> Lihat Publik
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 font-medium">
                      {product.pesantren?.name || 'Tidak diketahui'}
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <p className="font-bold text-blue-700">Rp {product.price.toLocaleString('id-ID')}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Stok: {product.stock}</p>
                    </td>
                    <td className="py-4 px-6">
                      {product.status === 'active' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider border border-blue-200"><CheckCircle className="w-3 h-3"/> Aktif</span>}
                      {product.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider border border-amber-200"><Clock className="w-3 h-3"/> Pending</span>}
                      {product.status === 'hidden' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider border border-slate-200"><XCircle className="w-3 h-3"/> Hidden</span>}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 relative">
                        <select 
                          value={product.status}
                          onChange={(e) => handleStatusChange(product.id, e.target.value)}
                          disabled={isPending}
                          className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer px-2 appearance-none z-10 disabled:opacity-50"
                        >
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="hidden">Hidden</option>
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                           <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Belum ada produk yang didaftarkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
