'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, MessageSquare, Settings, LogOut, Home, User, FolderHeart, Landmark, Store, Truck, ShoppingBag, MapPin, Search } from 'lucide-react';
import { BrandLogo } from '@/components/shared/BrandLogo';

interface MobileDashboardDrawerProps {
  isAdmin?: boolean;
  isTeam?: boolean;
  isSeller?: boolean;
  isCourier?: boolean;
  hasPesantren?: boolean;
  userName?: string;
  avatarUrl?: string | null;
  role?: string;
}

export function MobileDashboardDrawer({
  isAdmin = false,
  isTeam = false,
  isSeller = false,
  isCourier = false,
  hasPesantren = false,
  userName = 'User',
  avatarUrl,
  role = 'user'
}: MobileDashboardDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const canAccessAdmin = isAdmin || isTeam;

  const links = [
    { name: 'Beranda Sosial', href: '/feed', icon: Home, show: true },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'Pesanan Saya', href: '/orders', icon: ShoppingBag, show: true },
    { name: 'Pesantren', href: hasPesantren ? '/dashboard/pesantren' : '/dashboard/pesantren/apply', icon: Landmark, show: true },
    { name: 'Toko Saya', href: isSeller ? '/dashboard/products' : '/dashboard/seller/apply', icon: Store, show: true },
    { name: 'Pesanan Toko', href: '/dashboard/orders', icon: ShoppingBag, show: isSeller },
    { name: 'Kurir Saya', href: isCourier ? '/dashboard/courier' : '/dashboard/courier/apply', icon: Truck, show: true },
    { name: 'Forum', href: '/forum', icon: MessageSquare, show: true },
    { name: 'Program', href: '/program', icon: FolderHeart, show: true },
    { name: 'Profil Akun', href: '/dashboard/profile', icon: User, show: true },
    { name: 'Keamanan Akun', href: '/dashboard/security', icon: Settings, show: true },
    { name: 'Admin Panel', href: '/admin', icon: LayoutDashboard, show: canAccessAdmin },
  ].filter(l => l.show);

  let displayRole = 'Member';
  if (role === 'superadmin') displayRole = 'Superadmin';
  else if (role === 'admin') displayRole = 'Admin';
  else if (role === 'team') displayRole = 'Team';

  const drawerContent = (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9998] transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-[9999] w-[84vw] max-w-[340px] bg-white text-slate-900 shadow-2xl border-r border-slate-200 transition-transform duration-300 ease-in-out flex flex-col opacity-100 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="bg-white rounded-lg px-2 py-1">
            <BrandLogo className="scale-90 origin-left" isDark={false} />
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg border border-emerald-200">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 truncate">{userName}</h3>
            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-full mt-1">
              {displayRole}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard' && link.href !== '/feed');
            
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link 
            href="/auth/signout" 
            prefetch={false}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors w-full text-sm font-medium"
          >
            <LogOut className="w-5 h-5" /> Keluar Akun
          </Link>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 -ml-2 text-slate-600 hover:text-emerald-600 transition-colors focus:outline-none"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {mounted && createPortal(drawerContent, document.body)}
    </>
  );
}
