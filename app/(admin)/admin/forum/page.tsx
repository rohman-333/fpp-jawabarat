import { canAccessAdmin } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { AdminForumClient } from './AdminForumClient';

export default async function AdminForumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || (!canAccessAdmin(profile))) {
    redirect('/dashboard');
  }

  // Try forum_posts first (primary table from migration 001)
  let posts: any[] = [];
  const { data: forumPosts, error: forumPostsError } = await supabase
    .from('forum_posts')
    .select('*, profiles:author_id(name, avatar_url, role)')
    .order('created_at', { ascending: false });

  if (!forumPostsError && forumPosts && forumPosts.length > 0) {
    posts = forumPosts;
  } else {
    // Fallback: try forum_discussions table
    const { data: discussions } = await supabase
      .from('forum_discussions')
      .select('*, profiles:user_id(name, avatar_url, role)')
      .order('created_at', { ascending: false });
    
    if (discussions && discussions.length > 0) {
      // Map forum_discussions fields to match forum_posts interface
      posts = discussions.map((d: any) => ({
        id: d.id,
        title: d.title,
        content: d.content,
        author_id: d.user_id,
        status: d.status || 'active',
        is_hidden: d.is_hidden || false,
        is_pinned: d.is_pinned || false,
        created_at: d.created_at,
        updated_at: d.updated_at,
        profiles: d.profiles,
        _source: 'forum_discussions' // Track source table for client operations
      }));
    }
  }

  const role = profile?.role || 'user';
  const isAdmin = role === 'superadmin' || role === 'admin' || role === 'operator' || role === 'team';

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={isAdmin} 
        userName={profile?.name || 'Admin'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Manajemen Forum" userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <AdminForumClient posts={posts} />
        </main>
      </div>
    </div>
  );
}
