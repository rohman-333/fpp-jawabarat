import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[PUSH_SUBSCRIBE_AUTH_ERROR]', authError);
      return NextResponse.json({ error: `Unauthorized: ${authError.message}` }, { status: 401 });
    }

    if (!user) {
      console.warn('[PUSH_SUBSCRIBE_NO_USER] User session not found');
      return NextResponse.json({ error: 'Unauthorized: User session not found. Please log in again.' }, { status: 401 });
    }

    const subscription = await req.json();
    console.log('[PUSH_SUBSCRIBE_PAYLOAD]', { userId: user.id, subscription });

    if (!subscription || !subscription.endpoint) {
      console.warn('[PUSH_SUBSCRIBE_INVALID_PAYLOAD] Missing endpoint');
      return NextResponse.json({ error: 'Invalid subscription: Missing subscription endpoint' }, { status: 400 });
    }

    const p256dh = subscription.keys?.p256dh;
    const auth = subscription.keys?.auth;
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Upsert subscription — mark as active on re-subscribe
    const { error: dbError } = await supabase
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

    if (dbError) {
      console.error('[PUSH_SUBSCRIBE_DB_ERROR]', dbError);
      return NextResponse.json({ error: `Failed to save subscription to database: ${dbError.message} (Code: ${dbError.code})` }, { status: 500 });
    }

    console.log('[PUSH_SUBSCRIBED_SUCCESS]', user.id, subscription.endpoint.slice(-20));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[PUSH_SUBSCRIBE_EXCEPTION]', err);
    return NextResponse.json({ error: `Internal Server Error: ${err.message || err}` }, { status: 500 });
  }
}
