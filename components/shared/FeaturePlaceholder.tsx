import { ArrowLeft, HardHat } from 'lucide-react';
import Link from 'next/link';

interface FeaturePlaceholderProps {
  title?: string;
}

export function FeaturePlaceholder({ title = 'Fitur Sedang Disiapkan' }: FeaturePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-200">
        <HardHat className="w-10 h-10 text-emerald-600" />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">{title}</h1>
      <p className="text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
        Kami sedang bekerja keras membangun fitur ini untuk memberikan pengalaman terbaik di platform WIBAWA NUSANTARA. Nantikan segera!
      </p>
      <Link 
        href="javascript:history.back()"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5"
      >
        <ArrowLeft className="w-5 h-5" />
        Kembali ke Sebelumnya
      </Link>
    </div>
  );
}
