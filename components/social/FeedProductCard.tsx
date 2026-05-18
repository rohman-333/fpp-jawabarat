import { Store } from 'lucide-react';
import Link from 'next/link';

export function FeedProductCard() {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl shadow-sm border border-emerald-200 overflow-hidden mb-4 p-4 flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Store className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Marketplace FPP</span>
        </div>
        <h3 className="font-bold text-emerald-950">Dukung UMKM Pesantren</h3>
        <p className="text-sm text-emerald-800/80 mt-1">Temukan produk halal dan berkualitas buatan santri Jawa Barat.</p>
      </div>
      <Link href="/marketplace" className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
        Belanja
      </Link>
    </div>
  );
}
