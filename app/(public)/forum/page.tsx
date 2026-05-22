import { createClient } from '@/lib/supabase/server';
import { FeedPostCard } from '@/components/shared/FeedPostCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { MessageSquare } from 'lucide-react';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { ForumClient } from './ForumClient';

export const dynamic = 'force-dynamic';

export default async function ForumPage() {
  const supabase = await createClient();
  
  // Get active session user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch discussions
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('*, profiles(name, avatar_url, role)')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Forum Komunitas</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">
              Diskusi, tanya jawab, dan silaturahmi antar pesantren se-Nusantara.
            </p>
          </div>
          <div className="shrink-0">
            <ForumClient user={user} />
          </div>
        </div>

        <div className="space-y-4">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <FeedPostCard key={post.id} post={post} />
            ))
          ) : (
            <EmptyState 
              title="Belum ada diskusi" 
              description="Jadilah yang pertama memulai topik diskusi di forum komunitas ini."
              icon={<MessageSquare className="w-8 h-8 text-slate-400" />}
            />
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
