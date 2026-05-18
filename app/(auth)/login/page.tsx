import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { login } from '../actions';
import { BrandLogo } from '@/components/shared/BrandLogo';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, message?: string }>
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/feed');
  }

  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-emerald-900/30 border border-emerald-800 rounded-3xl p-8 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <BrandLogo variant="icon" isDark={true} className="mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Selamat Datang Kembali</h1>
          <p className="text-emerald-200/70 text-center text-sm">Masuk ke dashboard pesantren Anda</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}
        
        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-lg mb-4 text-sm text-center">
            {message}
          </div>
        )}

        <form action={login} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-emerald-100">Email</label>
            <input 
              name="email"
              type="email" 
              required
              className="w-full bg-emerald-950/50 border border-emerald-800 rounded-lg px-4 py-3 text-white placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
              placeholder="nama@pesantren.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-emerald-100">Password</label>
              <Link href="#" className="text-xs text-yellow-400 hover:text-yellow-300">Lupa password?</Link>
            </div>
            <input 
              name="password"
              type="password" 
              required
              className="w-full bg-emerald-950/50 border border-emerald-800 rounded-lg px-4 py-3 text-white placeholder-emerald-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-emerald-950 font-bold h-12 mt-6">
            Masuk
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-emerald-200/70">
          Belum mendaftarkan pesantren?{' '}
          <Link href="/register" className="text-yellow-400 hover:text-yellow-300 font-medium">
            Daftar sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
