'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShoppingBag, MessageSquare, Settings, LogOut, Home, User, FolderHeart, Landmark, ShieldCheck, Store, Truck } from 'lucide-react';
import { BrandLogo } from '@/components/shared/BrandLogo';

interface SidebarProps {
  isAdmin?: boolean;
  userName?: string;
  avatarUrl?: string | null;
}

export function DashboardSidebar({ isAdmin = false, userName, avatarUrl }: SidebarProps) {
  const pathname = usePathname();

  const adminLinks = [
    { name: 'Beranda Sosial', href: '/feed', icon: Home },
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Pesantren', href: '/admin/pesantren', icon: Landmark },
    { name: 'Marketplace', href: '/admin/marketplace', icon: ShoppingBag },
    { name: 'Pesanan Masuk', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Komisi Platform', href: '/admin/commission', icon: Landmark },
    { name: 'Pengajuan Toko', href: '/admin/seller-applications', icon: Store },
    { name: 'Pengajuan Kurir', href: '/admin/courier-applications', icon: Truck },
    { name: 'Banner/Iklan', href: '/admin/banners', icon: Landmark },
    { name: 'Forum', href: '/admin/forum', icon: MessageSquare },
    { name: 'Program', href: '/admin/program', icon: FolderHeart },
    { name: 'Pengguna', href: '/admin/users', icon: Users },
    { name: 'Manajemen Team', href: '/admin/team', icon: ShieldCheck },
    { name: 'Moderasi Konten', href: '/admin/moderation', icon: ShieldCheck },
    { name: 'Pengaturan', href: '/admin/settings', icon: Settings },
  ];

  const memberLinks = [
    { name: 'Beranda Sosial', href: '/feed', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Pesanan Saya', href: '/orders', icon: ShoppingBag },
    { name: 'Pesantren', href: '/dashboard/pesantren', icon: Landmark },
    { name: 'Toko Saya', href: '/dashboard/seller', icon: Store },
    { name: 'Pesanan Toko', href: '/dashboard/orders', icon: ShoppingBag },
    { name: 'Kurir Saya', href: '/dashboard/courier', icon: Truck },
    { name: 'Forum', href: '/forum', icon: MessageSquare },
    { name: 'Program', href: '/dashboard/program', icon: FolderHeart },
    { name: 'Profil Akun', href: '/dashboard/profile', icon: Settings },
    { name: 'Keamanan Akun', href: '/dashboard/security', icon: ShieldCheck },
  ];

  const links = isAdmin ? adminLinks : memberLinks;

  // Bottom nav links for mobile (max 5 items)
  const bottomNavLinks = isAdmin ? [
    { name: 'Feed', href: '/feed', icon: Home },
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pesantren', href: '/admin/pesantren', icon: Landmark },
    { name: 'Pasar', href: '/admin/marketplace', icon: ShoppingBag },
    { name: 'Profil', href: '/admin/settings', icon: User },
  ] : [
    { name: 'Feed', href: '/feed', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Pesantren', href: '/dashboard/pesantren', icon: Landmark },
    { name: 'Toko', href: '/dashboard/seller', icon: Store },
    { name: 'Profil', href: '/dashboard/profile', icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-blue-950 text-blue-50 flex-col hidden md:flex min-h-screen sticky top-0 border-r border-blue-900 z-40">
        <div className="p-6 pb-2">
          <BrandLogo variant="compact" isDark={true} />
          <div className="mt-2 pl-14">
          <span className="text-[10px] text-blue-300 font-medium uppercase tracking-wider">{isAdmin ? 'Super Admin' : 'Member Panel'}</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-blue-500/70 uppercase tracking-wider mb-3 px-3">Menu Utama</div>
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && link.href !== '/admin' && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-900/80 text-blue-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-blue-800/50' 
                    : 'text-blue-300/70 hover:bg-blue-900/40 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-300' : 'text-blue-500'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-blue-900/50 bg-blue-950/50">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-blue-900/40 border border-blue-800/50 mb-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName || 'User'} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-blue-200 font-bold text-xs uppercase">
                {(userName || 'U').charAt(0)}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userName || 'User Name'}</p>
              <p className="text-[10px] text-blue-400 truncate">{isAdmin ? 'Administrator' : 'Member'}</p>
            </div>
          </div>
          <Link href="/auth/signout" prefetch={false} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-sm font-medium">
            <LogOut className="w-4 h-4" /> Keluar Akun
          </Link>
        </div>
      </aside>
    </>
  );
}
