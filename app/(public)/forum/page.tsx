import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { FeedPostCard } from '@/components/shared/FeedPostCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { MessageSquare } from 'lucide-react';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';

export default async function ForumPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('*, profiles(name, avatar_url, role)')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Forum Komunitas</h1>
            <p className="text-slate-600">Diskusi, tanya jawab, dan silaturahmi antar pesantren se-Jawa Barat.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Buat Diskusi</Button>
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
