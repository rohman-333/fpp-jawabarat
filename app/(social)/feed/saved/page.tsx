import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FeedCard } from '@/components/social/FeedCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Bookmark, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Postingan Tersimpan | FPP JAWABARAT',
}

export default async function SavedPostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch saved posts
  const { data: saves } = await supabase
    .from('social_saves')
    .select(`
      post_id,
      post:social_posts (
        *,
        author:profiles(*),
        likes:social_likes(count),
        comments:social_comments(count)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Types from Supabase might wrap count in an array
  const validPosts = saves?.map(s => s.post).filter(Boolean) || [];

  return (
    <div className="max-w-[680px] mx-auto xl:mx-0 w-full pt-4 md:pt-8 px-4 md:px-0">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <Link href="/feed" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-600" />
            Postingan Tersimpan
          </h1>
          <p className="text-sm text-slate-500">Koleksi postingan yang Anda simpan</p>
        </div>
      </div>

      <div className="space-y-4 pb-20">
        {validPosts.length > 0 ? (
          validPosts.map((post: any) => (
            <FeedCard 
              key={post.id} 
              post={{
                ...post,
                likes_count: post.likes?.[0]?.count || post.likes?.count || 0,
                comments_count: post.comments?.[0]?.count || post.comments?.count || 0,
                is_liked: false,
                is_saved: true
              }} 
              currentUserId={user.id}
            />
          ))
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <EmptyState 
              icon={<Bookmark className="w-12 h-12 text-slate-300" />}
              title="Belum ada postingan tersimpan"
              description="Simpan postingan yang menurut Anda menarik untuk dibaca lagi nanti."
              action={
                <Link href="/feed" className="inline-flex px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">
                  Jelajahi Beranda
                </Link>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
