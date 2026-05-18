import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    slug: string;
    image_url: string | null;
    pesantren?: { name: string; city: string };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/marketplace/${product.slug}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col h-full block">
      <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ShoppingBag className="w-12 h-12 opacity-50" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-bold text-emerald-700 shadow-sm border border-white/50">
          Rp {product.price.toLocaleString('id-ID')}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">{product.name}</h3>
        {product.pesantren && (
          <p className="text-sm text-slate-500 mb-4 mt-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="truncate">{product.pesantren.name}</span>
          </p>
        )}
        <Button className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border-0 mt-auto transition-colors">
          Lihat Detail
        </Button>
      </div>
    </Link>
  );
}
