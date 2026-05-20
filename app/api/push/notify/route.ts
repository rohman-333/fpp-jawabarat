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

    const payload = await req.json();
    const { userId, title, body, href, type, metadata } = payload;

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields: userId, title, body' }, { status: 400 });
    }

    // Call the server helper which handles both internal DB notification and web push
    const result = await createNotification({
      userId,
      actorId: user.id,
      type: type || 'system',
      title,
      body,
      href,
      metadata,
      sendPush: true
    });

    return NextResponse.json({ 
      success: true,
      internalNotificationCreated: !!result.notification,
      pushSent: result.pushSent,
      pushFailed: result.pushFailed
    });
  } catch (error: any) {
    console.error('[API_PUSH_NOTIFY_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
