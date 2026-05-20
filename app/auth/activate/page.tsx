'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { BRAND } from '@/lib/branding';
import { activateLegacyAccount } from '../actions';
import { ShieldCheck, Mail, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export default function ActivatePage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await activateLegacyAccount(email);
      if (res.success) {
        setMessage(res.message || 'Proses berhasil.');
        setEmail('');
      } else {
        setError(res.error || 'Terjadi kesalahan.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memproses permintaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white/5 border border-blue-800/30 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl transition-all">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <BrandLogo variant="icon" isDark={true} className="mb-1" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Aktivasi Akun Lama</h1>
          <p className="text-blue-200/60 text-center text-sm">
            Masukkan email terdaftar Anda pada platform lama untuk memulai proses aktivasi.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 text-sm flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl mb-6 text-sm flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Email Akun Lama
            </label>
            <input
              type="email"
              required
              disabled={isSubmitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/60 border border-blue-800/40 rounded-xl px-4 py-3 text-white placeholder-blue-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
              placeholder="nama@email.com"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 mt-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin animate-infinite" />
                Memproses...
              </>
            ) : (
              'Kirim Link Aktivasi'
            )}
          </Button>
        </form>

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
