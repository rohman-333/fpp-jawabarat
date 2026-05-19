import { createClient } from '@/lib/supabase/server';
import webpush from 'web-push';

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
  const supabase = await createClient();

  // 1. Insert to notifications table
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      actor_id: actorId,
      type,
      title,
      message: body,
      target_url: href
    })
    .select()
    .single();

  if (error) {
    console.error('[CREATE_NOTIFICATION_ERROR]', error);
    return null;
  }

  // 2. Try Web Push if configured
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT) {
    try {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );

      // Get subscriptions for this user
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (subs && subs.length > 0) {
        const payload = JSON.stringify({
          title,
          body,
          url: href || '/',
          icon: '/icon.png'
        });

        // Send to all endpoints
        for (const sub of subs) {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };

          try {
            await webpush.sendNotification(pushSubscription, payload);
          } catch (e: any) {
            console.error('[WEB_PUSH_ERROR]', e);
            if (e.statusCode === 410 || e.statusCode === 404) {
              // Endpoint no longer valid, delete it
              await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            }
          }
        }
      }
    } catch (pushErr) {
      console.error('[WEB_PUSH_SETUP_ERROR]', pushErr);
    }
  }

  return notification;
}
