'use client';

import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (navigator as any).standalone === true;
    
    if (isStandalone) return;

    // 2. Check if dismissed recently (7 days rule)
    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedTime) {
      const parsedTime = parseInt(dismissedTime, 10);
      const now = Date.now();
      const diffDays = (now - parsedTime) / (1000 * 60 * 60 * 24);
      if (diffDays < 7) {
        return; // Skip showing if dismissed in last 7 days
      }
    }

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|opera|twitter|fb_iab|instagram/.test(ua);
    
    if (isAppleMobile) {
      setIsIOS(true);
      // Give iOS users a delay before showing the helpful bubble instruction
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // 4. Standard beforeinstallprompt listener for Android/Chrome/Windows
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show PWA install dialog
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User response to installation:', outcome);
    
    // Clean up
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bg-white border border-blue-100 rounded-2xl shadow-2xl p-4 z-[90] flex flex-col gap-3 animate-bounce-in bg-gradient-to-br from-white via-white to-blue-50/20 backdrop-blur-md">
      <div className="flex gap-3 items-start">
        <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shrink-0">
          <Download className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="font-extrabold text-slate-800 text-sm leading-tight">Install WIBAWA NUSANTARA</h4>
          <p className="text-slate-500 text-[11px] mt-1 leading-snug">
            {isIOS 
              ? 'Tambahkan aplikasi sosial & marketplace ini ke layar utama Anda untuk performa lebih cepat.' 
              : 'Nikmati aplikasi sosial media & direktori komunitas ini lebih ringan, cepat, dan hemat kuota.'
            }
          </p>
        </div>

        <button 
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isIOS ? (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center gap-2 text-slate-700 text-[11px] font-semibold">
          <Share className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Ketuk tombol <strong className="text-blue-700">Bagikan (Share)</strong> lalu pilih <strong className="text-blue-700">"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.
          </span>
        </div>
      ) : (
        <div className="flex gap-2 justify-end pt-1">
          <button 
            onClick={handleDismiss}
            className="px-4 py-2 hover:bg-slate-50 rounded-full text-xs font-extrabold text-slate-500 transition-colors"
          >
            Nanti saja
          </button>
          <button 
            onClick={handleInstallClick}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-extrabold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            Pasang Aplikasi
          </button>
        </div>
      )}
    </div>
  );
}
