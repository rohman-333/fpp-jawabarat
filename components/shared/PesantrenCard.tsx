import { MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { resolveMediaUrl } from '@/lib/media/resolveMediaUrl';

interface PesantrenCardProps {
  pesantren: {
    id: string;
    name: string;
    nspp: string;
    city: string;
    address: string;
    phone: string;
    logo_url: string;
  };
}

export function PesantrenCard({ pesantren }: PesantrenCardProps) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      <div className="flex items-center sm:items-start gap-4 mb-4 sm:mb-5">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
          {resolveMediaUrl(pesantren.logo_url) ? (
            <img src={resolveMediaUrl(pesantren.logo_url)!} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <span className="text-blue-600 font-bold text-xl sm:text-2xl">{pesantren.name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-slate-800 text-base sm:text-lg leading-snug mb-1 truncate group-hover:text-blue-600 transition-colors">{pesantren.name}</h2>
          {pesantren.nspp && (
            <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] sm:text-xs rounded-md font-mono border border-slate-200">
              NSPP: {pesantren.nspp}
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-2 text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 mt-auto">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span className="leading-snug">{pesantren.address || 'Alamat belum dilengkapi'}, <span className="font-medium text-slate-700">{pesantren.city}</span></span>
        </div>
        {pesantren.phone && (
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="font-medium">{pesantren.phone}</span>
          </div>
        )}
      </div>
      <Link href={`/pesantren/${pesantren.id}`} className="mt-auto block">
        <Button className="w-full bg-blue-950 text-blue-50 hover:bg-blue-900 border-none shadow-md hover:shadow-lg transition-all rounded-xl h-10 sm:h-11 font-semibold text-sm sm:text-base">
          Lihat Profil Lengkap
        </Button>
      </Link>
    </div>
  );
}
