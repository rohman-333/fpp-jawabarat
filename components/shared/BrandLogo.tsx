import Image from 'next/image';
import Link from 'next/link';
import { BRAND } from '@/lib/branding';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
  isDark?: boolean;
}

export function BrandLogo({ variant = 'compact', className = '', isDark = false }: BrandLogoProps) {
  // For dark backgrounds, use the blue square icon; for light, use the full logo
  const logoSrc = isDark ? BRAND.logoSquare : BRAND.logoFull;
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const taglineColor = isDark ? 'text-blue-200' : 'text-blue-600';

  const imageSizes = {
    full: 52,
    compact: 40,
    icon: 40,
  };

  const imageSize = imageSizes[variant];

  return (
    <Link href="/" className={`flex items-center gap-3 group ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          src={logoSrc}
          alt={`Logo ${BRAND.name}`}
          width={imageSize}
          height={imageSize}
          className="object-contain group-hover:scale-105 transition-transform duration-300 rounded-lg"
          priority
        />
      </div>

      {variant !== 'icon' && (
        <div className="flex flex-col justify-center">
          <span className={`font-extrabold tracking-tight leading-none ${variant === 'full' ? 'text-xl md:text-2xl mb-1' : 'text-base'} ${textColor}`}>
            {BRAND.shortName}
            <span className={`font-light ml-1 ${isDark ? 'text-blue-300' : 'text-blue-500'}`}>NUSANTARA</span>
          </span>
          {variant === 'full' && (
            <span className={`text-xs font-medium tracking-wide ${taglineColor}`}>
              {BRAND.tagline}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
