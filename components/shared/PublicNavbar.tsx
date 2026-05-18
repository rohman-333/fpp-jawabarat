import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/shared/BrandLogo';

interface PublicNavbarProps {
  transparent?: boolean;
}

export function PublicNavbar({ transparent = false }: PublicNavbarProps) {
  return (
    <header className={`border-b transition-all sticky top-0 z-50 ${transparent ? 'border-emerald-900/50 bg-emerald-950/95 backdrop-blur-md' : 'border-slate-200 bg-white/95 backdrop-blur-md shadow-sm'}`}>
      <div className="container mx-auto px-4 h-14 lg:h-20 flex items-center justify-between">
        <BrandLogo variant="compact" isDark={transparent} />
        
        <nav className={`hidden lg:flex gap-8 text-sm font-medium ${transparent ? 'text-emerald-100' : 'text-slate-600'}`}>
          <Link href="/" className="hover:text-emerald-500 transition-colors">Beranda</Link>
          <Link href="/pesantren" className="hover:text-emerald-500 transition-colors">Pesantren</Link>
          <Link href="/marketplace" className="hover:text-emerald-500 transition-colors">Marketplace</Link>
          <Link href="/forum" className="hover:text-emerald-500 transition-colors">Forum</Link>
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <Link href="/cart" className={`p-2 rounded-full transition-colors ${transparent ? 'text-emerald-50 hover:bg-emerald-900' : 'text-slate-600 hover:bg-slate-100'}`}>
            <ShoppingCart className="w-5 h-5" />
          </Link>
          <Link href="/login">
            <Button variant="ghost" className={`font-semibold ${transparent ? 'text-emerald-50 hover:text-yellow-400 hover:bg-emerald-900' : 'text-slate-700 hover:text-emerald-600 hover:bg-emerald-50'}`}>
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-emerald-950 font-bold border-none rounded-full px-6 shadow-sm">
              Daftar
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
