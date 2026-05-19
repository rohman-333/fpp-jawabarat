import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { FeedCard } from '@/components/social/FeedCard';
import { CommentBox } from '@/components/social/CommentBox';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { data: post, error } = await supabase
    .from('social_posts')
    .select(`
      *,
      profiles:author_id(name, avatar_url, role, account_type, is_verified),
      likes_count:social_likes(count),
      reactions:social_reactions(reaction_type, user_id),
      comments_count:social_comments(count)
    `)
    .eq('id', id)
    .single();

  if (error || !post) {
    notFound();
  }

  if (post.status === 'deleted' || post.status === 'hidden') {
    return (
      <div className="max-w-2xl mx-auto w-full pt-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Postingan tidak tersedia</h1>
        <p className="text-slate-500 mt-2">Postingan ini mungkin telah dihapus oleh penulisnya atau disembunyikan.</p>
        <Link href="/feed" className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // Fetch hasLiked, hasSaved, author_followed for current user
  let has_liked = false;
  let has_saved = false;
  let author_followed = false;

  const [likeRes, saveRes, followRes] = await Promise.all([
    supabase.from('social_likes').select('id').eq('post_id', id).eq('user_id', user.id).single(),
    supabase.from('social_saves').select('id').eq('post_id', id).eq('user_id', user.id).single(),
    supabase.from('social_follows').select('id').eq('following_id', post.author_id).eq('follower_id', user.id).single()
  ]);

  has_liked = !!likeRes.data;
  has_saved = !!saveRes.data;
  author_followed = !!followRes.data;

  const enrichedPost = {
    ...post,
    author: post.profiles,
    has_liked,
    has_saved,
    author_followed
  };

  return (
    <div className="max-w-2xl mx-auto w-full pt-4 md:pt-8 px-4 md:px-0">
      <div className="mb-4">
        <Link href="/feed" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Feed
        </Link>
      </div>
      
      <FeedCard post={enrichedPost} currentUser={{ ...user, role: profile?.role }} />
      
      {/* We are overriding the CommentBox inside FeedCard with our own here so it's always open on the detail page, but FeedCard manages its own toggle. We can just let FeedCard handle it, or we can force it open. To force it open, we can just rely on the user clicking, but actually in a detail page it's better to show comments directly. FeedCard encapsulates it though, so for simplicity we just render the CommentBox below as a permanent section. */}
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mt-4">
        <h2 className="font-bold text-slate-800 mb-4">Komentar</h2>
        <CommentBox postId={id} currentUserId={user.id} />
      </div>
    </div>
  );
}
