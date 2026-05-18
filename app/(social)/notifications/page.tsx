import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bell, Heart, MessageCircle, UserPlus, Info } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id(name, avatar_url)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Mark all as read when visited
  if (notifications && notifications.some(n => !n.is_read)) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500 fill-blue-100" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-emerald-500" />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full pt-20 md:pt-8 px-4 md:px-0">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3 bg-emerald-50/30">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">Notifikasi Anda</h1>
            <p className="text-sm text-slate-500">Pembaruan interaksi dan aktivitas akun Anda</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {(!notifications || notifications.length === 0) ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-slate-300" />
              </div>
              <h2 className="font-bold text-slate-700">Belum ada notifikasi</h2>
              <p className="text-sm text-slate-500 mt-1">Saat ini belum ada aktivitas terkait akun Anda.</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div key={notification.id} className={`p-4 sm:p-6 flex gap-4 hover:bg-slate-50 transition-colors ${!notification.is_read ? 'bg-emerald-50/10' : ''}`}>
                <div className="w-12 h-12 rounded-full bg-slate-100 shrink-0 overflow-hidden border border-slate-200 relative">
                  {notification.actor?.avatar_url ? (
                    <img src={notification.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase">
                      {(notification.actor?.name || 'S').charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                    {getIcon(notification.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  {notification.target_url ? (
                    <Link href={notification.target_url} className="block group">
                      <p className="text-slate-800 font-medium group-hover:text-emerald-600 transition-colors">
                        {notification.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{notification.message}</p>
                    </Link>
                  ) : (
                    <div>
                      <p className="text-slate-800 font-medium">
                        {notification.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">{notification.message}</p>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2 font-medium">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                  </p>
                </div>
                
                {!notification.is_read && (
                  <div className="shrink-0 w-2.5 h-2.5 bg-emerald-500 rounded-full mt-2 shadow-sm shadow-emerald-200"></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
