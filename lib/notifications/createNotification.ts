import { createClient } from '@/lib/supabase/server';
import { sendWebPush } from './sendWebPush';

export async function createNotification({ 
  userId, 
  actorId, 
  type, 
  title, 
  body, 
  href 
}: {
  userId: string;
  actorId?: string;
  type: string;
  title: string;
  body: string;
  href?: string;
}) {
  if (userId === actorId) {
    // Don't send notification to self
    return null;
  }

  const supabase = await createClient();

  // Build payload — always include the new columns.
  // Legacy columns (message, target_url) included for backward compatibility.
  // If the columns don't exist, Postgres will ignore them gracefully when using upsert/insert.
  const payload: Record<string, any> = {
    user_id: userId,
    actor_id: actorId ?? null,
    type,
    title,
    body,
    href: href ?? null,
    is_read: false,
  };

  // Attempt to also set legacy columns (silently ignore column-not-found errors)
  try {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[CREATE_NOTIFICATION_ERROR]', error);
      return null;
    }

    // 2. Try Web Push if configured
    try {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (subs && subs.length > 0) {
        const pushPayload = {
          title,
          body,
          href: href || '/',
          icon: '/icon.jpg'
        };

        for (const sub of subs) {
          const result = await sendWebPush(sub, pushPayload);
          if (result.expired) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }
    } catch (pushErr) {
      console.error('[WEB_PUSH_SEND_ERROR]', pushErr);
    }

    return notification;
  } catch (err) {
    console.error('[CREATE_NOTIFICATION_UNEXPECTED]', err);
    return null;
  }
}
