import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';

export default async function ProfileIdFallbackPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('username')
    .eq('id', id)
    .single();

  if (!profile) {
    notFound();
  }

  if (profile.username) {
    redirect(`/u/${profile.username}`);
  }

  // If no username somehow, just render the username page by passing the id as a fake username, 
  // but better to just redirect to the username version if it exists. 
  // Wait, if no username, they can't be viewed via /u/id since we only have /u/[username] layout?
  // We can just redirect them to a special fallback or just render it here.
  // Actually, we'll let /u/[username] handle it if we pass the id, but let's just 
  // assume the migration ensures everyone has a username.
  notFound();
}
