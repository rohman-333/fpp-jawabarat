import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bell, Heart, MessageCircle, UserPlus, Info, ShoppingBag, Store, Truck } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { MarkAllReadButton } from './MarkAllReadButton';
import { PushNotificationManager } from '@/components/dashboard/PushNotificationManager';

export const metadata = {
  title: 'Notifikasi - WIBAWA NUSANTARA',
  description: 'Notifikasi interaksi dan aktivitas akun Anda di Wibawa Nusantara',
};

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

  const hasUnread = notifications?.some(n => !n.is_read) ?? false;

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
      case 'reaction': return <span className="text-lg">❤️</span>;
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500 fill-blue-100" />;
      case 'mention': return <span className="font-bold text-blue-500 text-base">@</span>;
      case 'follow': return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'order_update': return <ShoppingBag className="w-5 h-5 text-orange-500" />;
      case 'seller_approved': return <Store className="w-5 h-5 text-blue-600" />;
      case 'seller_rejected': return <Store className="w-5 h-5 text-red-500" />;
      case 'courier_approved': return <Truck className="w-5 h-5 text-blue-600" />;
      case 'courier_rejected': return <Truck className="w-5 h-5 text-red-500" />;
      case 'pesantren_approved': return <span className="text-lg">🕌</span>;
      case 'pesantren_rejected': return <span className="text-lg">🕌</span>;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  const getHref = (notification: any): string | null => {
    return notification.href || notification.target_url || null;
  };

  const getBody = (notification: any): string => {
    return notification.body || notification.message || '';
  };

  return (
    <div className="max-w-2xl mx-auto w-full pt-20 md:pt-8 px-4 md:px-0 space-y-6">
      <PushNotificationManager hideIfSubscribed={true} />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg">Notifikasi Anda</h1>
              <p className="text-sm text-slate-500">Pembaruan interaksi dan aktivitas akun Anda</p>
            </div>
          </div>
          {hasUnread && <MarkAllReadButton userId={user.id} />}
        </div>

        <div className="divide-y divide-slate-100">
          {(!notifications || notifications.length === 0) ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-slate-300" />
              </div>
              <h2 className="font-bold text-slate-700">Belum ada notifikasi</h2>
              <p className="text-sm text-slate-500 mt-1">Saat ini belum ada aktivitas terkait akun Anda.</p>
              <Link href="/feed" className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors">
                Ke Beranda
              </Link>
            </div>
          ) : (
            notifications.map(notification => {
              const href = getHref(notification);
              const body = getBody(notification);
              return (
                <div
                  key={notification.id}
                  className={`p-4 sm:p-6 flex gap-4 hover:bg-slate-50 transition-colors ${!notification.is_read ? 'bg-blue-50/10' : ''}`}
                >
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
                    {href ? (
                      <Link href={href} className="block group">
                        <p className={`text-slate-800 font-medium group-hover:text-blue-600 transition-colors ${!notification.is_read ? 'font-bold' : ''}`}>
                          {notification.title}
                        </p>
                        {body && <p className="text-sm text-slate-500 mt-1">{body}</p>}
                      </Link>
                    ) : (
                      <div>
                        <p className={`text-slate-800 font-medium ${!notification.is_read ? 'font-bold' : ''}`}>
                          {notification.title}
                        </p>
                        {body && <p className="text-sm text-slate-500 mt-1">{body}</p>}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <div className="shrink-0 w-2.5 h-2.5 bg-blue-500 rounded-full mt-2 shadow-sm shadow-blue-200" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
