'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, PlusSquare, Store, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
      setIsReady(true);
    });
  }, []);

  if (!isReady) return null;

  const links = [
    { name: 'Beranda', href: isAuthenticated ? '/feed' : '/', icon: Home },
    { name: 'Cari', href: '/search', icon: Search },
    { 
      name: 'Posting', 
      href: isAuthenticated ? '/feed?compose=true' : '/login', 
      icon: PlusSquare, 
      isAction: true 
    },
    { name: 'Marketplace', href: '/marketplace', icon: Store },
    { name: 'Profil', href: isAuthenticated ? '/dashboard' : '/login', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200/50 flex justify-around items-center z-[100] pb-safe pt-1 px-2 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)]">
      {links.map((link) => {
        const isActive = pathname === link.href || (pathname === '/' && link.href === '/') || (pathname.startsWith(link.href) && link.href !== '/' && link.href !== '/feed');
        const Icon = link.icon;
        
        if (link.isAction) {
          return (
            <button 
              key="post"
              onClick={() => router.push(link.href)}
              className="flex flex-col items-center justify-center -mt-6 z-10"
            >
              <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 border-4 border-white transform transition-transform active:scale-95">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 mt-1">{link.name}</span>
            </button>
          );
        }

        return (
          <Link 
            key={link.name} 
            href={link.href}
            className={`flex flex-col items-center justify-center w-16 py-1.5 transition-all ${
              isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl mb-0.5 transition-all duration-300 ${isActive ? 'bg-emerald-50 scale-110' : ''}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'fill-emerald-600/20 stroke-[2.5px]' : 'stroke-2'}`} />
            </div>
            <span className={`text-[10px] transition-all duration-300 ${isActive ? 'font-bold text-emerald-700' : 'font-medium'}`}>
              {link.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
