'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AuthDebug() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data));
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  if (loading) {
    return <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-2 rounded text-xs opacity-50 z-50">Auth Loading...</div>;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900/90 text-slate-200 p-4 rounded-xl text-xs max-w-xs shadow-2xl backdrop-blur-md border border-slate-700 z-50 overflow-hidden">
      <div className="font-bold text-yellow-400 mb-2 border-b border-slate-700 pb-1 flex justify-between">
        <span>AuthDebug</span>
        <span className={session ? 'text-blue-400' : 'text-red-400'}>
          {session ? 'Active' : 'No Session'}
        </span>
      </div>
      {session ? (
        <div className="space-y-1">
          <p><span className="text-slate-400">UID:</span> <span className="font-mono">{session.user.id.substring(0, 8)}...</span></p>
          <p><span className="text-slate-400">Email:</span> {session.user.email}</p>
          <p><span className="text-slate-400">Role (Profile):</span> <span className="text-blue-300 font-bold">{profile?.role || 'null'}</span></p>
          <p><span className="text-slate-400">Status:</span> {profile?.status || 'null'}</p>
        </div>
      ) : (
        <p className="text-slate-400">User not logged in</p>
      )}
    </div>
  );
}
