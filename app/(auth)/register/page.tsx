import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { register } from '../actions';
import { BrandLogo } from '@/components/shared/BrandLogo';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/feed');
  }

  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-emerald-900/30 border border-emerald-800 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <BrandLogo variant="icon" isDark={true} className="mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Buat Akun FPP JAWABARAT</h1>
          <p className="text-emerald-200/70 text-center text-sm px-2">Bergabung untuk berbagi kabar, mengikuti pesantren, berbelanja, dan terhubung dengan komunitas.</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form action={register} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-emerald-100">Nama Lengkap</label>
            <input 
              name="name"
              type="text" 
              required
              className="w-full bg-emerald-950/50 border border-emerald-800 rounded-lg px-4 py-3 text-white placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
              placeholder="Masukkan nama lengkap Anda"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-emerald-100">Email</label>
            <input 
              name="email"
              type="email" 
              required
              className="w-full bg-emerald-950/50 border border-emerald-800 rounded-lg px-4 py-3 text-white placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
              placeholder="nama@email.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-emerald-100">Password</label>
              <input 
                name="password"
                type="password" 
                required
                className="w-full bg-emerald-950/50 border border-emerald-800 rounded-lg px-4 py-3 text-white placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-emerald-100">Konfirmasi Password</label>
              <input 
                name="confirmPassword"
                type="password" 
                required
                className="w-full bg-emerald-950/50 border border-emerald-800 rounded-lg px-4 py-3 text-white placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          
          <div className="pt-2">
            <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-emerald-950 font-bold h-12 mt-4">
              Buat Akun
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-emerald-200/70">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-yellow-400 hover:text-yellow-300 font-medium">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
