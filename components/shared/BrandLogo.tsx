import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
  isDark?: boolean;
}

export function BrandLogo({ variant = 'compact', className = '', isDark = false }: BrandLogoProps) {
  const logoSrc = "/brand/logo-fpp-jawabarat.png";
  const textColor = isDark ? "text-white" : "text-emerald-950";
  const taglineColor = isDark ? "text-emerald-200" : "text-emerald-700";

  const imageSizes = {
    full: 48,
    compact: 40,
    icon: 40
  };

  const imageSize = imageSizes[variant];

  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <Image 
          src={logoSrc} 
          alt="Logo FPP JAWABARAT" 
          width={imageSize} 
          height={imageSize}
          className="object-contain group-hover:scale-105 transition-transform duration-300"
          priority
        />
      </div>
      
      {variant !== 'icon' && (
        <div className="flex flex-col justify-center">
          <span className={`font-bold tracking-tight leading-none ${variant === 'full' ? 'text-xl md:text-2xl mb-1' : 'text-lg'} ${textColor}`}>
            FPP JAWABARAT
          </span>
          {variant === 'full' && (
            <span className={`text-xs md:text-sm font-medium tracking-wide ${taglineColor}`}>
              Platform Digital Pesantren Jawa Barat
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
