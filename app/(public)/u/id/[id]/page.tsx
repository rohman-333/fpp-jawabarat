import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfileIdFallbackPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, id')
    .eq('id', id)
    .maybeSingle();

  if (!profile) {
    redirect('/marketplace');
  }

  redirect(`/u/${profile.username || profile.id}`);
}
