import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Simple auth for cron: check auth header if needed, but for MVP we allow it or check a secret.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Find users whose birthday is today (ignoring year)
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();

  // In PostgreSQL, EXTRACT(MONTH FROM birth_date) and EXTRACT(DAY FROM birth_date) would be ideal.
  // Using postgREST, we can't easily do EXTRACT without a view or RPC.
  // We will do a simple fetch for now if the table is small, or an RPC.
  // For MVP: Fetch profiles that have a birth_date, filter in JS.
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, username, birth_date')
    .not('birth_date', 'is', null);

  if (error || !profiles) {
    return NextResponse.json({ error: error?.message || 'No profiles' }, { status: 500 });
  }

  const birthdayUsers = profiles.filter(p => {
    if (!p.birth_date) return false;
    const bd = new Date(p.birth_date);
    return bd.getMonth() + 1 === month && bd.getDate() === day;
  });

  if (birthdayUsers.length === 0) {
    return NextResponse.json({ success: true, message: 'No birthdays today', count: 0 });
  }

  let notificationsCreated = 0;

  for (const user of birthdayUsers) {
    // Find followers of this user
    const { data: followers } = await supabase
      .from('social_follows')
      .select('follower_id')
      .eq('following_id', user.id);

    if (followers && followers.length > 0) {
      const followerIds = followers.map(f => f.follower_id);
      
      const notifications = followerIds.map(followerId => ({
        user_id: followerId,
        type: 'birthday',
        title: `Hari ini ulang tahun ${user.name}`,
        message: `Ucapkan doa terbaik untuk ${user.name}`,
        target_url: `/u/${user.username}`
      }));

      // In real scenario, avoid duplicate notifications for the same year by checking if one already exists.
      // We will skip that complex logic for this MVP foundation.
      const { error: insertError } = await supabase.from('notifications').insert(notifications);
      if (!insertError) {
        notificationsCreated += notifications.length;
      }
    }
  }

  return NextResponse.json({ 
    success: true, 
    birthdayCount: birthdayUsers.length, 
    notificationsCreated 
  });
}
