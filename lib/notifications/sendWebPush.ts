import webpush from 'web-push';

export async function sendWebPush(subscription: any, payload: { title: string; body: string; href?: string; icon?: string }) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    // VAPID keys not configured, ignore silently
    return { success: false, expired: false, error: 'VAPID not configured' };
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      },
      JSON.stringify(payload)
    );
    return { success: true, expired: false };
  } catch (error: any) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      return { success: false, expired: true, error: 'Subscription expired' };
    }
    return { success: false, expired: false, error: error.message };
  }
}
