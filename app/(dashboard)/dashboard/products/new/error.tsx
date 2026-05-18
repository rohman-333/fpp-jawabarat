'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PRODUCT_NEW_PAGE_ERROR]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Gagal Memuat Halaman</h2>
        <p className="text-slate-500 mb-6">Terjadi kesalahan saat memuat form produk. Silakan coba lagi.</p>
        <div className="space-y-3">
          <Button 
            onClick={() => reset()} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-colors"
          >
            Coba Lagi (Reload)
          </Button>
          <Link href="/dashboard/products">
            <Button 
              variant="outline" 
              className="w-full mt-2"
            >
              Kembali ke Katalog
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
