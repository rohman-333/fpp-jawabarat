'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeedCard } from './FeedCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users, Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { FeedProductCard } from './FeedProductCard';

export function InfiniteFeed({ activeTab, currentUser, refreshKey = 0, targetUserId }: { activeTab: string, currentUser?: any, refreshKey?: number, targetUserId?: string }) {
  const supabase = createClient();
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();
  const PAGE_SIZE = 10;

  const fetchPosts = useCallback(async (pageNum: number, isReset: boolean = false) => {
    try {
      setLoading(true);
      let query = supabase
        .from('social_posts')
        .select(`
          *,
          profiles:author_id(name, avatar_url, role, has_pesantren, is_seller, seller_status, is_courier, courier_status, team_division, is_verified, username, followers:social_follows!social_follows_following_id_fkey(count)),
          likes_count:social_likes(count),
          comments_count:social_comments(count)
        `)
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (targetUserId) {
        query = query.eq('author_id', targetUserId);
      } else if (activeTab !== 'semua' && activeTab !== 'mengikuti') {
        query = query.eq('type', activeTab);
      }

      if (!targetUserId && activeTab === 'mengikuti' && currentUser?.id) {
        // Fetch following IDs first
        const { data: followsData } = await supabase
          .from('social_follows')
          .select('following_id')
          .eq('follower_id', currentUser.id);
          
        if (followsData && followsData.length > 0) {
          const followingIds = followsData.map(f => f.following_id);
          query = query.in('author_id', followingIds);
        } else {
          // If not following anyone, return empty results early
          if (isReset) setPosts([]);
          setHasMore(false);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;
      
      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch user interactions if logged in
        let userInteractions = { likes: new Set(), saves: new Set(), follows: new Set() };
        
        if (currentUser?.id) {
          const postIds = data.map(p => p.id);
          const authorIds = Array.from(new Set(data.map(p => p.author_id)));

          const [likesRes, savesRes, followsRes] = await Promise.all([
            supabase.from('social_likes').select('post_id').in('post_id', postIds).eq('user_id', currentUser.id),
            supabase.from('social_saves').select('post_id').in('post_id', postIds).eq('user_id', currentUser.id),
            supabase.from('social_follows').select('following_id').in('following_id', authorIds).eq('follower_id', currentUser.id)
          ]);

          if (likesRes.data) likesRes.data.forEach(l => userInteractions.likes.add(l.post_id));
          if (savesRes.data) savesRes.data.forEach(s => userInteractions.saves.add(s.post_id));
          if (followsRes.data) followsRes.data.forEach(f => userInteractions.follows.add(f.following_id));
        }

        const enrichedData = data.map(post => ({
          ...post,
          has_liked: userInteractions.likes.has(post.id),
          has_saved: userInteractions.saves.has(post.id),
          author_followed: userInteractions.follows.has(post.author_id)
        }));

        if (isReset) {
          setPosts(enrichedData);
        } else {
          setPosts(prev => {
            const newPosts = [...prev, ...enrichedData];
            const unique = Array.from(new Set(newPosts.map(a => a.id)))
              .map(id => newPosts.find(a => a.id === id));
            return unique;
          });
        }
        
        if (data.length < PAGE_SIZE) {
          setHasMore(false);
        }
      } else if (data && data.length === 0) {
        if (isReset) setPosts([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, supabase]);

  // Reset and fetch on tab change or refresh
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    fetchPosts(0, true);
  }, [activeTab, fetchPosts, refreshKey]);

  // Load more on scroll
  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage(prev => {
        const next = prev + 1;
        fetchPosts(next);
        return next;
      });
    }
  }, [inView, hasMore, loading, fetchPosts]);

  if (loading && page === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 h-48 animate-pulse">
            <div className="flex gap-3 items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-200"></div>
              <div className="space-y-2">
                <div className="w-32 h-4 bg-slate-200 rounded"></div>
                <div className="w-20 h-3 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div className="w-full h-4 bg-slate-200 rounded mb-2"></div>
            <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
         <EmptyState 
            title="Belum ada kabar" 
            description={activeTab === 'semua' ? "Jadilah yang pertama membagikan kabar atau kegiatan pesantren Anda ke komunitas." : `Belum ada konten untuk kategori ${activeTab}.`}
            icon={<Users className="w-12 h-12 text-slate-300" />}
          />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, index) => (
        <div key={post.id}>
          <FeedCard post={post} currentUserId={currentUser?.id} />
          {(index > 0 && (index + 1) % 5 === 0) && (
            <FeedProductCard />
          )}
        </div>
      ))}
      
      {hasMore && (
        <div ref={ref} className="py-6 flex justify-center">
          {loading && <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />}
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <div className="py-8 text-center text-sm font-bold text-slate-400">
          Anda sudah melihat semua kabar terbaru.
        </div>
      )}
    </div>
  );
}
