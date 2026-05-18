export function LoadingSkeleton({ type }: { type: 'card' | 'list' | 'stat' }) {
  if (type === 'stat') {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-slate-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
        <div className="aspect-[4/3] bg-slate-200"></div>
        <div className="p-5">
          <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-slate-200 rounded-lg w-full mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-pulse flex gap-4">
      <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0"></div>
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}
