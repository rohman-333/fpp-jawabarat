import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications/createNotification';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verify authentication
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify administrative privileges (admin, superadmin, operator)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'superadmin', 'operator'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const payload = await req.json();
    console.log("notify payload", payload);
    const { userId, title, body, href, type } = payload;
    console.log("target userId", userId);

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields: userId, title, body' }, { status: 400 });
    }

    // Fetch user subscriptions in API route to determine count
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);
    const subscriptionsFound = subs?.length || 0;
    console.log("subscriptions found", subscriptionsFound);

    // Call the server helper which handles both internal DB notification and web push
    const result = await createNotification({
      userId,
      title,
      body,
      href,
      type: type || 'system'
    });

    const isCreated = !!result.notification;
    console.log("internal notification created", isCreated);
    console.log("push sent count", result.pushSent);
    console.log("push failed count", result.pushFailed);

    if (!isCreated) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create internal notification'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      internalNotificationCreated: true,
      subscriptionsFound,
      pushSent: result.pushSent,
      pushFailed: result.pushFailed
    });
  } catch (error: any) {
    console.error('[API_PUSH_NOTIFY_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
