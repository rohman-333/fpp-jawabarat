'use client';

import { useState } from 'react';
import { acceptInvite, claimInviteLoggedIn } from './actions';
import { Loader2, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AcceptInviteForm({ token, inviteEmail, currentUserEmail }: { token: string, inviteEmail: string, currentUserEmail?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEmailMismatch = currentUserEmail && currentUserEmail !== inviteEmail;
  const isCorrectUserLoggedIn = currentUserEmail && currentUserEmail === inviteEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('token', token);
    
    if (!isCorrectUserLoggedIn) {
      if (password.length < 8) {
        setError('Password minimal 8 karakter');
        setLoading(false);
        return;
      }
      formData.append('password', password);
    }

    try {
      const res = isCorrectUserLoggedIn 
        ? await claimInviteLoggedIn(formData)
        : await acceptInvite(formData);

      if (res?.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (isEmailMismatch) {
    return (
      <div className="text-center">
        <div className="p-4 bg-orange-50 text-orange-800 rounded-xl text-sm border border-orange-200 mb-6 text-left">
          <strong>Perhatian:</strong> Anda sedang login dengan email <strong>{currentUserEmail}</strong>. Undangan ini ditujukan untuk <strong>{inviteEmail}</strong>.
        </div>
        <button 
          onClick={async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            await supabase.auth.signOut();
            router.refresh();
          }}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors w-full"
        >
          Logout Terlebih Dahulu
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {isCorrectUserLoggedIn ? (
        <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>Anda sudah login dengan email yang sesuai. Klik tombol di bawah untuk menerima undangan.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 block">Buat Password Baru</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Minimal 8 karakter"
              minLength={8}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Gunakan password ini untuk login di masa mendatang.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || (!isCorrectUserLoggedIn && password.length < 8)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
        {loading ? 'Memproses...' : 'Terima Undangan & Bergabung'}
      </button>
    </form>
  );
}
