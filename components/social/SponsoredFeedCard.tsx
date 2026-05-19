'use client';

import { Megaphone, ExternalLink, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface SponsoredAd {
  id: string;
  title: string | null;
  subtitle?: string | null;
  description: string | null;
  image_url: string;
  cta_label: string | null;
  cta_url: string | null;
  target_url: string | null;
  sponsor_name: string | null;
  sponsor_url: string | null;
}

export function SponsoredFeedCard({ ad }: { ad: SponsoredAd }) {
  const supabase = createClient();

  const handleAdClick = async () => {
    // Fire-and-forget lightweight click increment tracking
    try {
      await fetch(`/api/ads/${ad.id}/click`, { method: 'POST' });
    } catch (err) {
      console.error('[ADS_CLICK_TRACKING_ERR]', err);
    }
  };

  const redirectUrl = ad.target_url || ad.cta_url || ad.sponsor_url || '#';

  return (
    <div className="bg-gradient-to-br from-blue-50/20 to-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden w-full max-w-full">
      {/* Header Info */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-blue-100/80 flex items-center justify-center text-blue-600 shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800 text-xs tracking-wide">
              {ad.sponsor_name || 'WIBAWA NUSANTARA'}
            </span>
            <div className="flex items-center gap-1 mt-0.5 text-slate-400">
              <Globe className="w-2.5 h-2.5" />
              <span className="text-[9px] font-medium uppercase tracking-wider">Bersponsor</span>
            </div>
          </div>
        </div>
        
        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 flex items-center gap-1 select-none">
          Iklan
        </span>
      </div>

      {/* Main Info */}
      <div className="p-4 space-y-3">
        {ad.title && (
          <h4 className="font-extrabold text-slate-950 text-sm leading-tight">
            {ad.title}
          </h4>
        )}
        
        {ad.description && (
          <p className="text-slate-600 text-xs leading-relaxed break-words font-medium">
            {ad.description}
          </p>
        )}
      </div>

      {/* Ad Banner Image */}
      {ad.image_url && (
        <a 
          href={redirectUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleAdClick}
          className="block w-full border-y border-slate-100 overflow-hidden bg-slate-50 relative group"
        >
          <img 
            src={ad.image_url} 
            alt={ad.title || 'Sponsored Advertisement'} 
            className="w-full max-h-[340px] object-cover group-hover:scale-102 transition-transform duration-500" 
            loading="lazy"
            decoding="async"
          />
        </a>
      )}

      {/* Action Footer Call-to-Action */}
      <div className="p-3.5 bg-slate-50/50 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          {ad.subtitle && (
            <p className="text-[10px] text-slate-500 font-medium truncate">
              {ad.subtitle}
            </p>
          )}
        </div>

        <a 
          href={redirectUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleAdClick}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors shrink-0 whitespace-nowrap active:scale-95 transition-all"
        >
          <span>{ad.cta_label || 'Kunjungi'}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
