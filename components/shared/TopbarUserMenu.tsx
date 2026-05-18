'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, Settings, LogOut } from 'lucide-react';

interface TopbarUserMenuProps {
  userName: string;
  avatarUrl?: string | null;
}

export function TopbarUserMenu({ userName, avatarUrl }: TopbarUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-emerald-700 overflow-hidden shrink-0 hover:ring-2 hover:ring-emerald-500/50 transition-all focus:outline-none"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
        ) : (
          userName?.charAt(0)?.toUpperCase() || 'U'
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 py-1">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
          </div>
          <Link href="/dashboard/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
            <User className="w-4 h-4" /> Profil Akun
          </Link>
          <Link href="/dashboard/security" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
            <Settings className="w-4 h-4" /> Keamanan Akun
          </Link>
          <div className="border-t border-slate-100 my-1"></div>
          <Link href="/auth/signout" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium">
            <LogOut className="w-4 h-4" /> Keluar Akun
          </Link>
        </div>
      )}
    </div>
  );
}
