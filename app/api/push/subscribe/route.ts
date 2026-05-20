import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Upsert subscription — mark as active on re-subscribe
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        user_agent: userAgent,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) {
      console.error('[PUSH_SUBSCRIBE_DB_ERROR]', error);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    console.log('[PUSH_SUBSCRIBED]', user.id, subscription.endpoint.slice(-20));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[PUSH_SUBSCRIBE_ERROR]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
