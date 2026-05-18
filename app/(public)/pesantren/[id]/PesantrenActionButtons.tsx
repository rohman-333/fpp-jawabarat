'use client';

import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, MapPin, Store } from 'lucide-react';
import Link from 'next/link';

export function PesantrenActionButtons({ phone, pesantrenId, lat, lng }: { phone?: string, pesantrenId: string, lat?: string, lng?: string }) {
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Profil Pesantren FPP JAWABARAT',
          text: 'Lihat profil pesantren ini di FPP JAWABARAT.',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Tautan disalin ke clipboard!');
      }
    } catch (e) {
      console.error('Error sharing:', e);
    }
  };

  const handleWA = () => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('0') ? `62${cleanPhone.slice(1)}` : cleanPhone;
    window.open(`https://wa.me/${waNumber}?text=Assalamu'alaikum, saya melihat profil pesantren di aplikasi FPP Jawabarat.`, '_blank');
  };

  return (
    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
      {phone && (
        <Button onClick={handleWA} className="flex-1 sm:flex-none bg-[#25D366] hover:bg-[#128C7E] text-white font-bold border-none shadow-sm flex items-center gap-2">
          <MessageCircle className="w-4 h-4" /> Hubungi
        </Button>
      )}
      
      <Link href={`/marketplace?pesantren=${pesantrenId}`} className="flex-1 sm:flex-none">
        <Button variant="outline" className="w-full flex items-center gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50 bg-white shadow-sm">
          <Store className="w-4 h-4" /> Etalase
        </Button>
      </Link>

      <Button onClick={handleShare} variant="outline" className="flex-none p-3 aspect-square text-slate-600 hover:text-slate-900 border-slate-200 bg-white shadow-sm">
        <Share2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
