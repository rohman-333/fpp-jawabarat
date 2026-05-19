import Link from 'next/link';
import { BrandLogo } from '@/components/shared/BrandLogo';
import { BRAND } from '@/lib/branding';

export function PublicFooter() {
  return (
    <footer className="border-t border-blue-900 bg-blue-950 pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2">
            <div className="mb-6">
              <BrandLogo variant="full" isDark={true} />
            </div>
            <p className="text-blue-200/70 max-w-sm mb-6 mt-4 leading-relaxed">
              Platform digital terpadu untuk komunitas, marketplace, forum, dan pemberdayaan masyarakat Nusantara. Modern, terpercaya, dan kolaboratif.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Platform</h4>
            <ul className="space-y-3 text-blue-200/70 font-medium text-sm">
              <li><Link href="/pesantren" className="hover:text-blue-300 transition-colors">Direktori Komunitas</Link></li>
              <li><Link href="/marketplace" className="hover:text-blue-300 transition-colors">Marketplace</Link></li>
              <li><Link href="/forum" className="hover:text-blue-300 transition-colors">Forum Diskusi</Link></li>
              <li><Link href="/program" className="hover:text-blue-300 transition-colors">Program Sosial</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Akun</h4>
            <ul className="space-y-3 text-blue-200/70 font-medium text-sm">
              <li><Link href="/login" className="hover:text-blue-300 transition-colors">Masuk</Link></li>
              <li><Link href="/register" className="hover:text-blue-300 transition-colors">Buat Akun</Link></li>
              <li><Link href="#" className="hover:text-blue-300 transition-colors">Syarat & Ketentuan</Link></li>
              <li><Link href="#" className="hover:text-blue-300 transition-colors">Kebijakan Privasi</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-blue-900/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-blue-200/50 text-xs">
          <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p>Bersama membangun komunitas yang kuat, modern, dan berdaya.</p>
        </div>
      </div>
    </footer>
  );
}
