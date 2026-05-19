'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function MobileBottomSheet({ isOpen, onClose, title, children }: MobileBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
      setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
      const timer = setTimeout(() => {
        setMounted(false);
        document.body.style.overflow = '';
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          animate ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div 
        className={`relative w-full max-w-lg mx-auto bg-white rounded-t-[24px] shadow-2xl z-10 max-h-[85vh] flex flex-col transition-all duration-300 ease-out transform ${
          animate ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-90'
        }`}
      >
        {/* Native drag handle */}
        <div className="w-full flex justify-center py-3 cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1 bg-slate-300 rounded-full hover:bg-slate-400 transition-colors" />
        </div>

        {/* Header */}
        <div className="px-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-lg leading-none">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-all hover:text-slate-800 focus:outline-none"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic content scroll wrapper */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar max-h-[60vh] pb-10">
          {children}
        </div>
      </div>
    </div>
  );
}
