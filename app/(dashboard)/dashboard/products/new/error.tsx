'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PRODUCTS_NEW_ERROR]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Form produk gagal dimuat</h2>
      <p className="text-slate-600 max-w-md mb-8">
        Terjadi kesalahan saat memuat halaman ini. Silakan coba muat ulang atau kembali ke katalog.
      </p>
      
      <div className="flex gap-4">
        <Button 
          onClick={() => reset()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Coba Lagi (Reload)
        </Button>
        <Link href="/dashboard/products">
          <Button variant="outline">
            Kembali ke Produk
          </Button>
        </Link>
      </div>
    </div>
  );
}
