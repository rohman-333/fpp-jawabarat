import Link from 'next/link';
import { BrandLogo } from '@/components/shared/BrandLogo';

export function PublicFooter() {
  return (
    <footer className="border-t border-emerald-900 bg-emerald-950 pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2">
            <div className="mb-6">
              <BrandLogo variant="full" isDark={true} />
            </div>
            <p className="text-emerald-200/70 max-w-sm mb-6 mt-4 leading-relaxed">
              Platform resmi pendataan, sinergi, dan pemberdayaan ekonomi pesantren di seluruh Jawa Barat. Terpercaya, Kolaboratif, Transparan, dan Berbasis Nilai Islam.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Platform</h4>
            <ul className="space-y-3 text-emerald-200/70 font-medium text-sm">
              <li><Link href="/pesantren" className="hover:text-yellow-400 transition-colors">Database Pesantren</Link></li>
              <li><Link href="/marketplace" className="hover:text-yellow-400 transition-colors">Marketplace</Link></li>
              <li><Link href="/forum" className="hover:text-yellow-400 transition-colors">Forum Musyawarah</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Bantuan</h4>
            <ul className="space-y-3 text-emerald-200/70 font-medium text-sm">
              <li><Link href="/login" className="hover:text-yellow-400 transition-colors">Login Dashboard</Link></li>
              <li><Link href="/register" className="hover:text-yellow-400 transition-colors">Daftar Pesantren</Link></li>
              <li><Link href="#" className="hover:text-yellow-400 transition-colors">Syarat & Ketentuan</Link></li>
              <li><Link href="#" className="hover:text-yellow-400 transition-colors">Kebijakan Privasi</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-emerald-900/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-emerald-200/50 text-xs">
          <p>&copy; {new Date().getFullYear()} FPP JAWABARAT. All rights reserved.</p>
          <p>Bersinergi membangun pesantren, menguatkan umat, memajukan negeri.</p>
        </div>
      </div>
    </footer>
  );
}
