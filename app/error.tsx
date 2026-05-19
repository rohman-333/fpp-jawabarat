'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, LogIn, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ROOT_PAGE_ERROR]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white rounded-3xl border border-red-100 shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Halaman gagal dimuat</h1>
        <p className="text-slate-500 mb-6 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
          {error.message || 'Terjadi kesalahan pada server. Kami sedang berusaha memperbaikinya.'}
        </p>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => reset()} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl flex items-center justify-center"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Coba Muat Ulang
          </Button>
          
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full h-12 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50 font-bold flex items-center justify-center">
              <LogIn className="w-5 h-5 mr-2" />
              Masuk ke Akun
            </Button>
          </Link>
          
          <Link href="/feed" className="w-full">
            <Button variant="ghost" className="w-full h-12 rounded-xl text-blue-600 hover:bg-blue-50 font-bold flex items-center justify-center">
              Ke Beranda Konten
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
