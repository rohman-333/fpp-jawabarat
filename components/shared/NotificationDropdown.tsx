'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Heart, MessageSquare, UserPlus, Info, ShoppingBag, Store, Truck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export function NotificationDropdown({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();

    const sub = supabase.channel(`notif-dropdown:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 5));
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [userId]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'like': return <Heart className="w-4 h-4 text-rose-500" />;
      case 'reaction': return <span className="text-sm">❤️</span>;
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'mention': return <span className="font-bold text-blue-500 text-sm">@</span>;
      case 'follow': return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'order_update': return <ShoppingBag className="w-4 h-4 text-orange-500" />;
      case 'seller_approved':
      case 'seller_rejected': return <Store className="w-4 h-4 text-blue-500" />;
      case 'courier_approved':
      case 'courier_rejected': return <Truck className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const getHref = (notif: any) => notif.href || notif.target_url || '#';
  const getBody = (notif: any) => notif.body || notif.message || '';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-full hover:bg-slate-50 focus:outline-none"
        aria-label={`Notifikasi${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full border border-white px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Notifikasi</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Tandai semua dibaca
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Belum ada notifikasi.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map(notif => (
                    <Link
                      key={notif.id}
                      href={getHref(notif)}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                      className={`block p-4 hover:bg-slate-50 transition-colors ${notif.is_read ? 'opacity-70' : 'bg-blue-50/30'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {getIcon(notif.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm text-slate-800 ${!notif.is_read ? 'font-bold' : ''}`}>
                            {notif.title}
                          </p>
                          {getBody(notif) && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {getBody(notif)}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
              <Link href="/notifications" className="text-sm font-bold text-blue-600 hover:text-blue-700">
                Lihat Semua Notifikasi
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
