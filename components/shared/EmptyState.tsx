import { ReactNode } from 'react';
import { FolderX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="w-full py-16 px-4 bg-white border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
        {icon || <FolderX className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm">{description}</p>
      {action}
    </div>
  );
}
