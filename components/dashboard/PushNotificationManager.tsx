'use client';

import { useState, useEffect } from 'react';
import { Bell, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    } else {
      setLoading(false);
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const registration = await navigator.serviceWorker.ready;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID key belum dikonfigurasi di server.');
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      setSubscription(sub);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');

      const p256dh = sub.getKey('p256dh') ? btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('p256dh') as ArrayBuffer) as any)) : null;
      const auth = sub.getKey('auth') ? btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('auth') as ArrayBuffer) as any)) : null;

      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent
      }, { onConflict: 'user_id, endpoint' });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal mengaktifkan notifikasi.');
    } finally {
      setSaving(false);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      setSaving(true);
      setError(null);

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        setSubscription(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal menonaktifkan notifikasi.');
    } finally {
      setSaving(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-600">
          <p className="font-semibold text-slate-700">Notifikasi Push Tidak Didukung</p>
          <p className="mt-1">Browser Anda saat ini tidak mendukung fitur notifikasi push.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="h-20 animate-pulse bg-slate-100 rounded-xl"></div>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${subscription ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Notifikasi Perangkat</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              {subscription 
                ? 'Perangkat ini menerima notifikasi langsung.' 
                : 'Aktifkan agar Anda mendapat pemberitahuan pesan dan pesanan meskipun aplikasi ditutup.'}
            </p>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          </div>
        </div>
        
        {!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? (
          <div className="text-sm font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
            Push notification belum dikonfigurasi server.
          </div>
        ) : (
          <Button 
            onClick={subscription ? unsubscribeFromPush : subscribeToPush}
            disabled={saving}
            variant={subscription ? 'outline' : 'default'}
            className={subscription ? 'border-slate-200 hover:bg-slate-50' : 'bg-emerald-600 hover:bg-emerald-700 font-bold'}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {subscription ? 'Nonaktifkan' : 'Aktifkan Notifikasi'}
          </Button>
        )}
      </div>

      {!subscription && /iPhone|iPad|iPod/.test(navigator.userAgent) && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
          <strong>Pengguna iOS:</strong> Anda harus menambahkan website ini ke "Layar Utama" (Add to Home Screen) terlebih dahulu melalui menu Share Safari untuk bisa mengaktifkan notifikasi push.
        </div>
      )}
    </div>
  );
}
