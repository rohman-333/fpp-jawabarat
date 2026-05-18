import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FeedContainer } from '@/components/social/FeedContainer';

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <FeedContainer user={user} />;
}
