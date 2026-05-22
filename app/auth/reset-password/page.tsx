'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { createClient } from '@/lib/supabase/client';
import { Key, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      // 1. If there's a code query parameter, exchange it for a session
      const code = searchParams.get('code');
      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Error exchanging code:', exchangeError);
            setError('Token reset password tidak valid atau telah kedaluwarsa.');
            setSessionValid(false);
            setCheckingSession(false);
            return;
          }
          
          // Clear query params to clean URL
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          window.history.replaceState({}, '', url.pathname + url.search);
        } catch (e) {
          console.error('Exception exchanging code:', e);
        }
      }

      // 2. Check if we have an active session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Check if there is an access_token in the URL hash (Implicit flow)
        if (window.location.hash.includes('access_token=')) {
          // Wait for Supabase client to parse the hash fragment
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              setSessionValid(true);
            } else {
              setError('Sesi reset password tidak valid atau telah kedaluwarsa.');
              setSessionValid(false);
            }
            setCheckingSession(false);
          }, 800);
        } else {
          setError('Sesi reset password tidak ditemukan. Silakan minta tautan baru.');
          setSessionValid(false);
          setCheckingSession(false);
        }
      } else {
        setSessionValid(true);
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [searchParams, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal harus 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      
      if (updateError) {
        setError(updateError.message || 'Gagal memperbarui password.');
      } else {
        setMessage('Password berhasil diperbarui, silakan login');
        setPassword('');
        setConfirmPassword('');
        
        // Wait a short moment to let the user see the success message, then redirect
        setTimeout(() => {
          router.push('/auth/login?message=Password%20berhasil%20diperbarui%2C%20silakan%20login');
        }, 1500);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memproses permintaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4 animate-infinite" />
        <p className="text-blue-200/60 text-sm">Memverifikasi sesi reset password...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center mb-8">
        <div className="mb-4">
          <BrandLogo variant="icon" isDark={true} className="mb-1" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
        <p className="text-blue-200/60 text-center text-sm">
          {sessionValid ? 'Masukkan password baru Anda untuk mengamankan akun.' : 'Tautan tidak valid atau kedaluwarsa.'}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 text-sm flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Terjadi Kesalahan</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl mb-6 text-sm flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-1">{message}</p>
            <p className="text-xs text-emerald-400/80">Mengalihkan ke halaman login...</p>
          </div>
        </div>
      )}

      {!sessionValid && !checkingSession && (
        <div className="space-y-4">
          <p className="text-sm text-blue-200/70 text-center mb-6">
            Sesi reset password Anda tidak ditemukan, tidak valid, atau sudah kedaluwarsa. Silakan kirim ulang tautan reset baru ke email Anda.
          </p>
          <Button
            onClick={() => router.push('/auth/forgot-password')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            Kirim Ulang Link Reset
          </Button>
        </div>
      )}

      {sessionValid && !message && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              Password Baru
            </label>
            <input
              type="password"
              required
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/60 border border-blue-800/40 rounded-xl px-4 py-3 text-white placeholder-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              Konfirmasi Password
            </label>
            <input
              type="password"
              required
              disabled={isSubmitting}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950/60 border border-blue-800/40 rounded-xl px-4 py-3 text-white placeholder-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
              placeholder="Konfirmasi password baru"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 mt-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Password Baru'
            )}
          </Button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white/5 border border-blue-800/30 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl transition-all">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-blue-200/60 text-sm">Memuat halaman...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>

        <div className="mt-8 pt-6 border-t border-blue-900/30 flex justify-between items-center text-xs">
          <Link href="/login" className="text-blue-400 hover:text-white flex items-center gap-1.5 transition-colors font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Login
          </Link>
          <span className="text-slate-500">WIBAWA NUSANTARA</span>
        </div>
      </div>
    </div>
  );
}
