'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Store, MessagesSquare, FolderHeart, Newspaper, LayoutDashboard, Bookmark } from 'lucide-react';
import { BrandLogo } from '@/components/shared/BrandLogo';

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

  return (
    <>
      <aside className="w-64 bg-white hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-slate-200 z-40">
        <div className="p-5 border-b border-slate-100">
          <BrandLogo variant="compact" isDark={false} />
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all ${
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
          <Link href={profile?.role === 'admin' || profile?.role === 'operator' ? '/admin' : '/dashboard'} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold uppercase">
                  {(profile?.name || 'U').charAt(0)}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{profile?.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <LayoutDashboard className="w-3 h-3" /> {profile?.role === 'admin' || profile?.role === 'operator' ? 'Panel Admin' : 'Dashboard Pesantren'}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center z-50 pb-safe">
        {navLinks.slice(0, 5).map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex flex-col items-center justify-center w-full py-2 transition-all ${
                isActive ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <div className={`p-1 rounded-full mb-0.5 ${isActive ? 'bg-emerald-50' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'fill-emerald-600/20' : ''}`} />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-700' : ''}`}>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
