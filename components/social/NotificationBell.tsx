'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Loader2, CheckCircle2, MessageCircle, Heart, UserPlus, Info, ShoppingBag, Store, Truck, X } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

export function NotificationBell({ currentUserId }: { currentUserId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      const supabase = supabaseRef.current;
      
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('is_read', false);

      const { data } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id(name, avatar_url)
        `)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(8);

      if (data) {
        setNotifications(data);
      }
      if (count !== null) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('[NOTIF_FETCH_ERROR]', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = supabaseRef.current;

    fetchNotifications();

    // Subscribe to new notifications via realtime
    const channel = supabase.channel(`notif-bell:${currentUserId}`)
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
              setNotifications(prev => [data, ...prev].slice(0, 8));
              setUnreadCount(prev => prev + 1);
            }
          });
      })
      .subscribe();

    // Fallback polling every 45s
    pollRef.current = setInterval(() => {
      fetchNotifications();
    }, 45000);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [currentUserId, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    await supabaseRef.current.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', notificationId);
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await supabaseRef.current.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', currentUserId).eq('is_read', false);
  };

  // Unified field access for both legacy and new columns
  const getHref = (n: any) => n.href || n.target_url || '#';
  const getBody = (n: any) => n.body || n.message || '';

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'reaction': return <span className="text-[12px] leading-none">❤️</span>;
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500 fill-blue-100" />;
      case 'mention': return <span className="font-bold text-blue-500 text-sm leading-none">@</span>;
      case 'follow': return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'order_update':
      case 'order_created':
      case 'payment_confirmed': return <ShoppingBag className="w-4 h-4 text-orange-500" />;
      case 'seller_approved':
      case 'seller_rejected': return <Store className="w-4 h-4 text-blue-600" />;
      case 'courier_approved':
      case 'courier_rejected': return <Truck className="w-4 h-4 text-blue-600" />;
      case 'chat_message': return <MessageCircle className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
        aria-label={`Notifikasi${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          {/* Desktop dropdown */}
          <div className="hidden sm:block absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50">
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
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  Belum ada notifikasi
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map(notification => (
                    <Link
                      key={notification.id}
                      href={getHref(notification)}
                      onClick={() => {
                        if (!notification.is_read) markAsRead(notification.id);
                        setIsOpen(false);
                      }}
                      className={`block p-4 hover:bg-slate-50 transition-colors ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
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
                          <p className={`text-sm text-slate-800 line-clamp-2 leading-snug ${!notification.is_read ? 'font-bold' : ''}`}>
                            {notification.title}
                          </p>
                          {getBody(notification) && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{getBody(notification)}</p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                          </p>
                        </div>

                        {!notification.is_read && (
                          <div className="shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </Link>
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

          {/* Mobile bottom sheet */}
          <div className="sm:hidden fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
            <div className="relative w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg">Notifikasi</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 hover:text-blue-700">
                      Tandai semua dibaca
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-slate-100">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
                ) : notifications.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-sm">
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    Belum ada notifikasi
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(notification => (
                      <Link
                        key={notification.id}
                        href={getHref(notification)}
                        onClick={() => {
                          if (!notification.is_read) markAsRead(notification.id);
                          setIsOpen(false);
                        }}
                        className={`block p-4 ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5 shrink-0">{getIcon(notification.type)}</div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm text-slate-800 ${!notification.is_read ? 'font-bold' : ''}`}>
                              {notification.title}
                            </p>
                            {getBody(notification) && (
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{getBody(notification)}</p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 safe-area-pb">
                <Link 
                  href="/notifications" 
                  className="block text-center text-sm font-bold text-blue-600 hover:text-blue-700"
                  onClick={() => setIsOpen(false)}
                >
                  Lihat Semua Notifikasi
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
