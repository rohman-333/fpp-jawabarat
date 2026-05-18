import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FeedContainer } from '@/components/social/FeedContainer';
import { LegacyPasswordBanner } from '@/components/shared/LegacyPasswordBanner';

export const metadata = {
  title: 'Postingan Tersimpan | FPP JAWABARAT',
}

export default async function SavedPostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('legacy_user_id, password_changed_at')
    .eq('id', user.id)
    .single();

  return (
    <>
      <div className="max-w-[680px] mx-auto xl:mx-0 w-full px-4 md:px-0 pt-4 md:pt-8 pb-0">
        <LegacyPasswordBanner 
          legacyUserId={profile?.legacy_user_id} 
          passwordChangedAt={profile?.password_changed_at} 
        />
      </div>
      <FeedContainer user={user} initialTab="tersimpan" />
    </>
  );
}
