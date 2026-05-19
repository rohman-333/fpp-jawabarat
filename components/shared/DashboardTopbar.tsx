import { Search, Bell, Menu } from 'lucide-react';
import { MobileDashboardDrawer } from './MobileDashboardDrawer';
import { TopbarUserMenu } from './TopbarUserMenu';
import { NotificationDropdown } from './NotificationDropdown';
import { createClient } from '@/lib/supabase/server';

interface TopbarProps {
  title: string;
  userName: string;
  avatarUrl?: string | null;
}

export async function DashboardTopbar({ title, userName, avatarUrl }: TopbarProps) {
  // Fetch user session to determine roles for the drawer
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  }

  const role = profile?.role || 'user';
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isTeam = role === 'team';
  const hasPesantren = !!profile?.pesantren_id || profile?.has_pesantren;
  const isSeller = profile?.is_seller && profile?.seller_status === 'approved';
  const isCourier = profile?.is_courier && profile?.courier_status === 'approved';

  return (
    <header className="h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] md:h-20 md:pt-0 bg-white/95 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="md:hidden">
          <MobileDashboardDrawer 
            isAdmin={isAdmin}
            isTeam={isTeam}
            isSeller={isSeller}
            isCourier={isCourier}
            hasPesantren={hasPesantren}
            userName={userName}
            avatarUrl={avatarUrl}
            role={role}
          />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight truncate max-w-[200px] md:max-w-none">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4 md:gap-6">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari..." 
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
          />
        </div>
        
        <NotificationDropdown userId={user?.id || ''} />

        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-700 leading-none">{userName}</p>
          </div>
          
          <TopbarUserMenu userName={userName} avatarUrl={avatarUrl} />
        </div>
      </div>
    </header>
  );
}
