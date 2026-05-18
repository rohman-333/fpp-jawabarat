'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShoppingBag, MessageSquare, Settings, LogOut, Home, User, FolderHeart, Landmark } from 'lucide-react';
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
    { name: 'Forum', href: '/admin/forum', icon: MessageSquare },
    { name: 'Program', href: '/admin/program', icon: FolderHeart },
    { name: 'Pengguna', href: '/admin/users', icon: Users },
    { name: 'Pengaturan', href: '/admin/settings', icon: Settings },
  ];

  const memberLinks = [
    { name: 'Beranda Sosial', href: '/feed', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Pesantren', href: '/dashboard/pesantren', icon: Landmark },
    { name: 'Marketplace', href: '/dashboard/products', icon: ShoppingBag },
    { name: 'Forum', href: '/forum', icon: MessageSquare },
    { name: 'Program', href: '/dashboard/program', icon: FolderHeart },
    { name: 'Profil Akun', href: '/dashboard/profile', icon: Settings },
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
    { name: 'Pasar', href: '/dashboard/products', icon: ShoppingBag },
    { name: 'Profil', href: '/dashboard/profile', icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-emerald-950 text-emerald-50 flex-col hidden md:flex min-h-screen sticky top-0 border-r border-emerald-900 z-40">
        <div className="p-6 pb-2">
          <BrandLogo variant="compact" isDark={true} />
          <div className="mt-2 pl-14">
            <span className="text-[10px] text-emerald-300 font-medium uppercase tracking-wider">{isAdmin ? 'Super Admin' : 'Pesantren Panel'}</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-wider mb-3 px-3">Menu Utama</div>
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && link.href !== '/admin' && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive 
                    ? 'bg-emerald-900/80 text-yellow-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-emerald-800/50' 
                    : 'text-emerald-200/70 hover:bg-emerald-900/40 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-yellow-400' : 'text-emerald-500'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-emerald-900/50 bg-emerald-950/50">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-emerald-900/40 border border-emerald-800/50 mb-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName || 'User'} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-200 font-bold text-xs uppercase">
                {(userName || 'U').charAt(0)}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userName || 'User Name'}</p>
              <p className="text-[10px] text-emerald-400 truncate">{isAdmin ? 'Administrator' : 'Member Pesantren'}</p>
            </div>
          </div>
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-300/80 hover:bg-red-950/40 hover:text-red-300 transition-colors w-full justify-center border border-transparent hover:border-red-900/50">
            <LogOut className="w-4 h-4" />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-between items-center z-50 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)] pb-safe">
        {bottomNavLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/dashboard' && link.href !== '/admin' && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`flex items-center justify-center p-1 rounded-full mb-1 transition-all ${isActive ? 'bg-emerald-50 text-emerald-600' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'fill-emerald-600/20' : ''}`} />
              </div>
              <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'text-emerald-700' : ''}`}>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
