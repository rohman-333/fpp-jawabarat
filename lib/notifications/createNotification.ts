import { createClient } from '@/lib/supabase/server';
import { sendWebPush } from './sendWebPush';

export async function createNotification({ 
  userId, 
  actorId, 
  type, 
  title, 
  body, 
  href,
  metadata,
  sendPush = true
}: {
  userId: string;
  actorId?: string;
  type: string;
  title: string;
  body: string;
  href?: string;
  metadata?: Record<string, any>;
  sendPush?: boolean;
}) {
  if (userId === actorId) {
    // Don't send notification to self
    return { notification: null, pushSent: 0, pushFailed: 0 };
  }

  const supabase = await createClient();

  // Build payload — write both new and legacy columns for backward compatibility
  const payload: Record<string, any> = {
    user_id: userId,
    actor_id: actorId ?? null,
    type,
    title,
    body,
    message: body,        // legacy column
    href: href ?? null,
    target_url: href ?? null, // legacy column
    metadata: metadata ?? {},
    is_read: false,
  };

  let notification = null;
  let pushSent = 0;
  let pushFailed = 0;

  // 1. Insert internal notification (always)
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[CREATE_NOTIFICATION_ERROR]', error.message);
      return { notification: null, pushSent: 0, pushFailed: 0 };
    }

    notification = data;
    console.log('[NOTIFICATION_CREATED]', notification.id, 'type=', type, 'user=', userId);
  } catch (err) {
    console.error('[CREATE_NOTIFICATION_UNEXPECTED]', err);
    return { notification: null, pushSent: 0, pushFailed: 0 };
  }

  // 2. Try Web Push (only if sendPush is true and VAPID is configured)
  if (sendPush) {
    try {
      // Fetch recipient's notification preferences
      const { data: pref } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let isPushAllowed = true;
      if (pref) {
        if (pref.enable_push === false) {
          isPushAllowed = false;
        } else {
          const typeToPrefKey: Record<string, string> = {
            like: 'enable_likes',
            reaction: 'enable_likes',
            comment: 'enable_comments',
            mention: 'enable_comments',
            follow: 'enable_follows',
            chat_message: 'enable_chats',
            order_update: 'enable_orders',
            order_created: 'enable_orders',
            payment_confirmed: 'enable_orders',
          };

          const prefKey = typeToPrefKey[type];
          if (prefKey && pref[prefKey] === false) {
            isPushAllowed = false;
          }
        }
      }

      if (isPushAllowed) {
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);

        if (subs && subs.length > 0) {
          const pushPayload = {
            title,
            body,
            href: href || '/notifications',
            icon: '/icon.jpg',
            notificationId: notification?.id || null,
          };

          for (const sub of subs) {
            try {
              const result = await sendWebPush(sub, pushPayload);
              if (result.success) {
                pushSent++;
              } else if (result.expired) {
                // Mark subscription as inactive instead of deleting
                await supabase
                  .from('push_subscriptions')
                  .update({ is_active: false, updated_at: new Date().toISOString() })
                  .eq('id', sub.id);
                pushFailed++;
              } else {
                pushFailed++;
              }
            } catch (pushErr) {
              console.error('[WEB_PUSH_SINGLE_ERROR]', pushErr);
              pushFailed++;
            }
          }
        }
      } else {
        console.log('[PUSH_SKIPPED_PREFERENCE]', 'type=', type, 'user=', userId);
      }
    } catch (pushErr) {
      console.error('[WEB_PUSH_SEND_ERROR]', pushErr);
    }
  }

  return { notification, pushSent, pushFailed };
}
