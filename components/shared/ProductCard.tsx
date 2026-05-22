import { ShoppingBag, MapPin, BadgeCheck, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    slug: string;
    image_url: string | null;
    stock?: number;
    seller?: {
      name: string;
      is_verified: boolean;
      location?: string;
    };
    pesantren?: { name: string; city: string };
  };
  onAddToCart?: (product: any) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const sellerName = product?.seller?.name || product?.pesantren?.name || 'Seller WIBAWA NUSANTARA';
  const location = product?.seller?.location || product?.pesantren?.city || 'Nusantara';
  const isVerified = product?.seller?.is_verified || false;
  const stock = product?.stock ?? 0;

  return (
    <Link href={`/marketplace/${product.slug}`} className="group bg-white rounded-xl shadow-sm hover:shadow-lg border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col h-full block">
      <div className="aspect-square bg-slate-50 relative overflow-hidden shrink-0">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/branding/logo-square.png'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <ShoppingBag className="w-8 h-8 opacity-50" />
          </div>
        )}
        {stock === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <div className="bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-full uppercase tracking-widest shadow-xl">Habis</div>
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-slate-800 text-xs sm:text-sm leading-[1.4] mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors h-[2.8em]">{product.name}</h3>
        
        <div className="font-bold text-slate-900 text-sm sm:text-base mb-1.5">
          Rp {(product.price || 0).toLocaleString('id-ID')}
        </div>
        
        <div className="mt-auto space-y-1 mb-3">
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-600 font-medium">
            <span className="truncate">{sellerName}</span>
            {isVerified && <BadgeCheck className="w-3 h-3 text-blue-500 shrink-0" />}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block">Stok: {stock}</span>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onAddToCart && stock > 0) onAddToCart(product);
            }}
            disabled={stock === 0}
            size="sm" 
            className="w-full sm:w-auto h-8 text-xs bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold rounded-lg border-0"
          >
            <Plus className="w-4 h-4 sm:mr-1 shrink-0" /> <span className="hidden sm:inline">Keranjang</span>
          </Button>
        </div>
      </div>
    </Link>
  );
}
