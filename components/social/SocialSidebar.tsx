'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Store, MessagesSquare, FolderHeart, Newspaper, LayoutDashboard, Bookmark } from 'lucide-react';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { NotificationBell } from './NotificationBell';
import { canAccessAdmin, getDisplayRole } from '@/lib/auth/roles';
import { MobileDashboardDrawer } from '@/components/shared/MobileDashboardDrawer';
import { TopbarUserMenu } from '@/components/shared/TopbarUserMenu';

export function SocialSidebar({ profile }: { profile: any }) {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Beranda', href: '/feed', icon: Home },
    { name: 'Komunitas', href: '/feed/community', icon: Users },
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'Forum', href: '/forum', icon: MessagesSquare },
    { name: 'Program', href: '/programs', icon: FolderHeart },
    { name: 'Artikel & Berita', href: '/news', icon: Newspaper },
    { name: 'Tersimpan', href: '/feed/saved', icon: Bookmark },
  ];

  const role = profile?.role || 'user';
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isTeam = role === 'team';
  const hasPesantren = !!profile?.pesantren_id || profile?.has_pesantren;
  const isSeller = profile?.is_seller && profile?.seller_status === 'approved';
  const isCourier = profile?.is_courier && profile?.courier_status === 'approved';

  return (
    <>
      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <MobileDashboardDrawer 
            isAdmin={isAdmin}
            isTeam={isTeam}
            isSeller={isSeller}
            isCourier={isCourier}
            hasPesantren={hasPesantren}
            userName={profile?.name || 'User'}
            avatarUrl={profile?.avatar_url}
            role={role}
          />
          <BrandLogo variant="compact" isDark={false} />
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell currentUserId={profile?.id} />
          <div className="scale-75 origin-right">
            <TopbarUserMenu userName={profile?.name || 'User'} avatarUrl={profile?.avatar_url} />
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-slate-200 z-40">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <BrandLogo variant="compact" isDark={false} />
          <NotificationBell currentUserId={profile?.id} />
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto pt-4 md:pt-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link href={canAccessAdmin(profile) ? '/admin' : '/dashboard'} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase">
                  {(profile?.name || 'U').charAt(0)}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{profile?.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <LayoutDashboard className="w-3 h-3" /> {canAccessAdmin(profile) ? 'Panel Admin' : 'Dashboard'}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </aside>

    </>
  );
}
