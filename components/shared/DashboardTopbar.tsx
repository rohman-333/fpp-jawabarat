import { Search, Bell } from 'lucide-react';

interface TopbarProps {
  title: string;
  userName: string;
  avatarUrl?: string | null;
}

export function DashboardTopbar({ title, userName, avatarUrl }: TopbarProps) {
  return (
    <header className="h-16 md:h-20 bg-white/95 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 shadow-sm">
      <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight truncate max-w-[200px] md:max-w-none">{title}</h1>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari..." 
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-64 transition-all"
          />
        </div>
        
        <button className="relative p-2 text-slate-400 hover:text-emerald-600 transition-colors rounded-full hover:bg-slate-50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700 leading-none">{userName}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-white shadow-sm flex items-center justify-center font-bold text-emerald-700 overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              userName?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
