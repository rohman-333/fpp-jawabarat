'use client';

import { useState, useEffect } from 'react';
import { Bell, Loader2, CheckCircle2, MessageCircle, Heart, UserPlus, Info } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export function NotificationBell({ currentUserId }: { currentUserId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!currentUserId) return;

    async function fetchNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id(name, avatar_url)
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
      setLoading(false);
    }

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase.channel('notifications_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${currentUserId}`
      }, (payload) => {
        // Fetch the new notification with actor details
        supabase.from('notifications').select('*, actor:actor_id(name, avatar_url)').eq('id', payload.new.id).single()
          .then(({ data }) => {
            if (data) {
              setNotifications(prev => [data, ...prev].slice(0, 10));
              setUnreadCount(prev => prev + 1);
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUserId).eq('is_read', false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'reaction': return <span className="text-[12px] leading-none">❤️</span>;
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500 fill-blue-100" />;
      case 'mention': return <span className="font-bold text-blue-500 text-sm leading-none">@</span>;
      case 'follow': return <UserPlus className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Notifikasi</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Tandai semua dibaca
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Belum ada notifikasi
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 flex gap-3 hover:bg-slate-50 transition-colors ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                      onClick={() => {
                        if (!notification.is_read) markAsRead(notification.id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden border border-slate-200 relative">
                        {notification.actor?.avatar_url ? (
                          <img src={notification.actor.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase text-sm">
                            {(notification.actor?.name || 'S').charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          {getIcon(notification.type)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        {notification.target_url ? (
                          <Link href={notification.target_url} className="block group">
                            <p className="text-sm text-slate-800 line-clamp-2 leading-snug">
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{notification.message}</p>
                          </Link>
                        ) : (
                          <div>
                            <p className="text-sm text-slate-800 line-clamp-2 leading-snug">
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{notification.message}</p>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                        </p>
                      </div>

                      {!notification.is_read && (
                        <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
              <Link href="/notifications" className="text-xs font-bold text-slate-600 block" onClick={() => setIsOpen(false)}>
                Lihat Semua Notifikasi
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
