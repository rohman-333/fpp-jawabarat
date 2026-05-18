import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FeedContainer } from '@/components/social/FeedContainer';
import { LegacyPasswordBanner } from '@/components/shared/LegacyPasswordBanner';

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('legacy_user_id, password_changed_at, role')
    .eq('id', user.id)
    .single();

  const { data: rawPosts } = await supabase
    .from('social_posts')
    .select(`
      *,
      likes_count:social_likes(count),
      reactions:social_reactions(reaction_type, user_id),
      comments_count:social_comments(count)
    `)
    .is('deleted_at', null)
    .or('status.eq.active,status.eq.published,status.is.null')
    .or('visibility.eq.public,visibility.is.null')
    .order('created_at', { ascending: false })
    .limit(10);

  let initialPosts = [];
  
  if (rawPosts && rawPosts.length > 0) {
    const authorIds = Array.from(new Set(rawPosts.map(p => p.author_id).filter(Boolean)));
    let profilesById: Record<string, any> = {};

    if (authorIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url, role, has_pesantren, is_seller, seller_status, is_courier, courier_status, team_division, is_verified, followers:social_follows!social_follows_following_id_fkey(count)')
        .in('id', authorIds);

      if (profilesData) {
        profilesData.forEach(p => { profilesById[p.id] = p; });
      }
    }

    let userInteractions = { likes: new Set(), saves: new Set(), follows: new Set() };
    const postIds = rawPosts.map(p => p.id);

    const [likesRes, savesRes, followsRes] = await Promise.all([
      supabase.from('social_likes').select('post_id').in('post_id', postIds).eq('user_id', user.id),
      supabase.from('social_saves').select('post_id').in('post_id', postIds).eq('user_id', user.id),
      authorIds.length > 0 ? supabase.from('social_follows').select('following_id').in('following_id', authorIds).eq('follower_id', user.id) : Promise.resolve({ data: null })
    ]);

    if (likesRes.data) likesRes.data.forEach(l => userInteractions.likes.add(l.post_id));
    if (savesRes.data) savesRes.data.forEach(s => userInteractions.saves.add(s.post_id));
    if (followsRes.data) followsRes.data.forEach(f => userInteractions.follows.add(f.following_id));

    initialPosts = rawPosts.map(post => ({
      ...post,
      author: profilesById[post.author_id] || {
        id: post.author_id,
        name: 'Pengguna FPP',
        username: 'pengguna',
        avatar_url: null,
        role: 'member'
      },
      has_liked: userInteractions.likes.has(post.id),
      has_saved: userInteractions.saves.has(post.id),
      author_followed: userInteractions.follows.has(post.author_id)
    }));
  }

  return (
    <>
      <div className="max-w-[680px] mx-auto xl:mx-0 w-full px-4 md:px-0 pt-4 md:pt-8 pb-0">
        <LegacyPasswordBanner 
          legacyUserId={profile?.legacy_user_id} 
          passwordChangedAt={profile?.password_changed_at} 
        />
      </div>
      <FeedContainer user={{...user, role: profile?.role}} initialPosts={initialPosts} />
    </>
  );
}
