import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/shared/BrandLogo';

interface PublicNavbarProps {
  transparent?: boolean;
}

export function PublicNavbar({ transparent = false }: PublicNavbarProps) {
  return (
    <header className={`border-b transition-all sticky top-0 z-50 ${transparent ? 'border-blue-900/50 bg-blue-950/95 backdrop-blur-md' : 'border-slate-200 bg-white/95 backdrop-blur-md shadow-sm'}`}>
      <div className="container mx-auto px-4 h-14 lg:h-20 flex items-center justify-between">
        <BrandLogo variant="compact" isDark={transparent} />

        <nav className={`hidden lg:flex gap-8 text-sm font-medium ${transparent ? 'text-blue-100' : 'text-slate-600'}`}>
          <Link href="/" className="hover:text-blue-400 transition-colors">Beranda</Link>
          <Link href="/pesantren" className="hover:text-blue-400 transition-colors">Komunitas</Link>
          <Link href="/marketplace" className="hover:text-blue-400 transition-colors">Marketplace</Link>
          <Link href="/program" className="hover:text-blue-400 transition-colors">Program</Link>
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <Link href="/cart" className={`p-2 rounded-full transition-colors ${transparent ? 'text-blue-50 hover:bg-blue-900' : 'text-slate-600 hover:bg-slate-100'}`}>
            <ShoppingCart className="w-5 h-5" />
          </Link>
          <Link href="/login">
            <Button variant="ghost" className={`font-semibold ${transparent ? 'text-blue-50 hover:text-white hover:bg-blue-900' : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'}`}>
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold border-none rounded-full px-6 shadow-md shadow-blue-600/20">
              Daftar
            </Button>
          </Link>
        </div>

        {/* Mobile right side */}
        <div className="lg:hidden flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className={`font-semibold text-sm ${transparent ? 'text-blue-50' : 'text-slate-700'}`}>
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full px-4 shadow-sm">
              Daftar
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
