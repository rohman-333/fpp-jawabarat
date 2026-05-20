'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export function PushPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    // Don't show immediately — delay 3s after mount
    const timer = setTimeout(() => {
      checkAndShow();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const checkAndShow = () => {
    // Check if push is supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return; // Unsupported browser
    }

    // Check if VAPID key is configured
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      return;
    }

    // Check if user already granted or denied
    if (Notification.permission === 'granted') {
      return; // Already enabled
    }

    if (Notification.permission === 'denied') {
      return; // Already denied, can't ask again
    }

    // Check if user dismissed this prompt before (stored in localStorage)
    const dismissed = localStorage.getItem('push_prompt_dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    setShow(true);
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Register SW and subscribe
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        await navigator.serviceWorker.ready;

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        // Send to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON())
        });

        setShow(false);
      } else if (permission === 'denied') {
        setDenied(true);
        setShow(false);
      }
    } catch (err) {
      console.error('[PUSH_PROMPT_ERROR]', err);
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push_prompt_dismissed', Date.now().toString());
    setShow(false);
  };

  if (denied) {
    return (
      <div className="mx-4 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <Bell className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-800">Notifikasi Diblokir</p>
          <p className="text-xs text-amber-600 mt-1">
            Untuk mengaktifkan notifikasi, buka Pengaturan Browser &gt; Izin Situs &gt; Notifikasi, lalu izinkan notifikasi untuk situs ini.
          </p>
        </div>
        <button onClick={() => setDenied(false)} className="p-1 hover:bg-amber-100 rounded-full transition-colors shrink-0">
          <X className="w-4 h-4 text-amber-500" />
        </button>
      </div>
    );
  }

  if (!show) return null;

  return (
    <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top duration-300">
      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <Bell className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">Aktifkan Notifikasi</p>
        <p className="text-xs text-slate-500 mt-1">
          Agar tidak ketinggalan pesan, komentar, dan pesanan baru.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleEnable}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors active:scale-95"
          >
            Aktifkan
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors"
          >
            Nanti Saja
          </button>
        </div>
      </div>
      <button onClick={handleDismiss} className="p-1 hover:bg-blue-100 rounded-full transition-colors shrink-0">
        <X className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
}
