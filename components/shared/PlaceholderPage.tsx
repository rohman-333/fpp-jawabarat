import { EmptyState } from '@/components/shared/EmptyState';
import { Hammer } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description = 'Fitur sedang disiapkan. Kami sedang bekerja keras untuk menghadirkan fitur ini dalam waktu dekat.' }: PlaceholderPageProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full min-h-[60vh] p-4 md:p-8 justify-center">
      <div className="max-w-xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <EmptyState 
          icon={<Hammer className="w-12 h-12 text-emerald-500" />}
          title={title}
          description={description}
        />
      </div>
    </div>
  );
}
