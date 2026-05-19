import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { register } from '../actions';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { BRAND } from '@/lib/branding';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: `Buat Akun — ${BRAND.name}`,
};

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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg bg-white/5 border border-blue-800/50 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-5">
            <BrandLogo variant="icon" isDark={true} className="mb-2" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Buat Akun {BRAND.shortName}</h1>
          <p className="text-blue-200/70 text-center text-sm px-2">Bergabung untuk berbagi kabar, terhubung dengan komunitas, dan mulai berbelanja.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form action={register} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-100">Nama Lengkap</label>
            <input
              name="name"
              type="text"
              required
              className="w-full bg-blue-950/50 border border-blue-800/70 rounded-xl px-4 py-3 text-white placeholder-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="Masukkan nama lengkap Anda"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-100">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full bg-blue-950/50 border border-blue-800/70 rounded-xl px-4 py-3 text-white placeholder-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder="nama@email.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-100">Password</label>
              <input
                name="password"
                type="password"
                required
                className="w-full bg-blue-950/50 border border-blue-800/70 rounded-xl px-4 py-3 text-white placeholder-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-100">Konfirmasi Password</label>
              <input
                name="confirmPassword"
                type="password"
                required
                className="w-full bg-blue-950/50 border border-blue-800/70 rounded-xl px-4 py-3 text-white placeholder-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 mt-2 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5">
              Buat Akun Gratis
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-blue-200/70">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-blue-300 hover:text-white font-semibold transition-colors">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
