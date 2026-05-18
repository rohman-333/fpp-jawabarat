'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-300/80 hover:bg-red-950/40 hover:text-red-300 transition-colors w-full justify-center border border-transparent hover:border-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoggingOut ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Keluar...
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4" />
          Keluar Akun
        </>
      )}
    </button>
  );
}

export function LogoutIconOnly() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
      title="Keluar Akun"
    >
      {isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
    </button>
  );
}
