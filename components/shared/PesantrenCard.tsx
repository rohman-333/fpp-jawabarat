import { MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      <div className="flex items-start gap-5 mb-5">
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
          {pesantren.logo_url ? (
            <img src={pesantren.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-emerald-600 font-bold text-2xl">{pesantren.name.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-slate-800 text-lg leading-tight mb-1.5 truncate group-hover:text-emerald-600 transition-colors">{pesantren.name}</h2>
          {pesantren.nspp && (
            <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-md font-mono border border-slate-200">
              NSPP: {pesantren.nspp}
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-2.5 text-sm text-slate-600 mb-6 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 mt-auto">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span className="leading-snug">{pesantren.address || 'Alamat belum dilengkapi'}, <span className="font-medium text-slate-700">{pesantren.city}</span></span>
        </div>
        {pesantren.phone && (
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-medium">{pesantren.phone}</span>
          </div>
        )}
      </div>
      <Button className="w-full bg-emerald-950 text-emerald-50 hover:bg-emerald-900 border-none shadow-md hover:shadow-lg transition-all rounded-xl h-11">
        Lihat Profil Lengkap
      </Button>
    </div>
  );
}
