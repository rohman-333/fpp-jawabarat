'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeedCard } from './FeedCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

export function InfiniteFeed({ 
  activeTab, 
  currentUser, 
  refreshKey = 0, 
  targetUserId, 
  initialPosts 
}: { 
  activeTab: string; 
  currentUser?: any; 
  refreshKey?: number; 
  targetUserId?: string; 
  initialPosts?: any[]; 
}) {
  const supabase = createClient();
  const PAGE_SIZE = 10;

  // Enriched posts list
  const [posts, setPosts] = useState<any[]>(initialPosts || []);
  const [page, setPage] = useState(0);

  // Split-up loading states
  const [initialLoading, setInitialLoading] = useState(initialPosts && initialPosts.length > 0 ? false : true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // End of scroll state
  const [hasMore, setHasMore] = useState(initialPosts && initialPosts.length >= PAGE_SIZE ? true : false);

  const { ref, inView } = useInView({
    rootMargin: '200px', // trigger fetch early for ultra-smooth native scroll
  });

  // Active Refs to prevent stale React closure bugs in asynchronous loops
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(hasMore);

  // Sync refs instantly with state updates
  useEffect(() => {
    isLoadingRef.current = initialLoading || loadingMore || refreshing;
  }, [initialLoading, loadingMore, refreshing]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const fetchPosts = useCallback(async (pageNum: number, isReset: boolean = false) => {
    // Strict block to prevent parallel duplicated page fetch triggers
    if (isLoadingRef.current && !isReset) return;
    if (!hasMoreRef.current && !isReset) return;

    try {
      if (isReset) {
        setError(null);
        if (posts.length === 0) {
          setInitialLoading(true);
        }
      } else {
        setLoadingMore(true);
      }
      isLoadingRef.current = true;

      let query = supabase
        .from('social_posts')
        .select(`
          id, content, type, image_url, video_url, media_type, author_id, product_id,
          visibility, status, created_at, updated_at,
          likes_count:social_likes(count),
          reactions:social_reactions(reaction_type),
          comments_count:social_comments(count)
        `)
        .is('deleted_at', null)
        .or('status.eq.active,status.eq.published,status.is.null')
        .or('visibility.eq.public,visibility.is.null')
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (targetUserId) {
        query = query.eq('author_id', targetUserId);
      } else if (activeTab !== 'semua' && activeTab !== 'mengikuti' && activeTab !== 'tersimpan') {
        query = query.eq('type', activeTab);
      }

      if (!targetUserId && activeTab === 'mengikuti' && currentUser?.id) {
        const { data: followsData } = await supabase
          .from('social_follows')
          .select('following_id')
          .eq('follower_id', currentUser.id);
          
        if (followsData && followsData.length > 0) {
          const followingIds = followsData.map(f => f.following_id);
          query = query.in('author_id', followingIds);
        } else {
          if (isReset) setPosts([]);
          setHasMore(false);
          return;
        }
      }

      if (!targetUserId && activeTab === 'tersimpan' && currentUser?.id) {
        const { data: savedData } = await supabase
          .from('social_saves')
          .select('post_id')
          .eq('user_id', currentUser.id);

        if (savedData && savedData.length > 0) {
          const savedIds = savedData.map(s => s.post_id);
          query = query.in('id', savedIds);
        } else {
          if (isReset) setPosts([]);
          setHasMore(false);
          return;
        }
      }

      const { data, error: dbError } = await query;
      
      if (dbError) {
        setError(dbError.message);
        console.error('[FEED_LOAD_MORE_ERROR]', dbError);
        throw dbError;
      }

      if (data && data.length > 0) {
        const authorIds = Array.from(new Set(data.map(p => p.author_id).filter(Boolean)));
        let profilesById: Record<string, any> = {};

        if (authorIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, username, avatar_url, role, has_pesantren, is_seller, seller_status, is_courier, courier_status, team_division, is_verified, followers:social_follows!social_follows_following_id_fkey(count)')
            .in('id', authorIds);

          if (profiles) {
            profiles.forEach(p => {
              profilesById[p.id] = p;
            });
          }
        }

        let userInteractions = { likes: new Set(), saves: new Set(), follows: new Set(), reactions: new Map() };
        
        if (currentUser?.id) {
          const postIds = data.map(p => p.id);
          
          const [likesRes, savesRes, followsRes, reactionsRes] = await Promise.all([
            supabase.from('social_likes').select('post_id').in('post_id', postIds).eq('user_id', currentUser.id),
            supabase.from('social_saves').select('post_id').in('post_id', postIds).eq('user_id', currentUser.id),
            authorIds.length > 0 ? supabase.from('social_follows').select('following_id').in('following_id', authorIds).eq('follower_id', currentUser.id) : Promise.resolve({ data: null }),
            supabase.from('social_reactions').select('post_id, reaction_type').in('post_id', postIds).eq('user_id', currentUser.id)
          ]);

          if (likesRes.data) likesRes.data.forEach(l => userInteractions.likes.add(l.post_id));
          if (savesRes.data) savesRes.data.forEach(s => userInteractions.saves.add(s.post_id));
          if (followsRes.data) followsRes.data.forEach(f => userInteractions.follows.add(f.following_id));
          if (reactionsRes.data) reactionsRes.data.forEach(r => userInteractions.reactions.set(r.post_id, r.reaction_type));
        }

        const enrichedData = data.map(post => ({
          ...post,
          author: profilesById[post.author_id] || {
            id: post.author_id,
            name: 'Pengguna',
            username: 'pengguna',
            avatar_url: null,
            role: 'member'
          },
          has_liked: userInteractions.likes.has(post.id),
          has_saved: userInteractions.saves.has(post.id),
          author_followed: userInteractions.follows.has(post.author_id),
          my_reaction: userInteractions.reactions.get(post.id) || null
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
        
        // Terminate boundary: if fetched array is smaller than target limit, no more pages exist
        if (data.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } else {
        if (isReset) {
          setPosts([]);
        }
        setHasMore(false); // Instantly block observers from requesting page pageNum+1
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat postingan');
      console.error('[FEED_LOAD_MORE_ERROR]', err);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      isLoadingRef.current = false;
    }
  }, [supabase, targetUserId, activeTab, currentUser?.id, posts.length]);

  const initialMount = useRef(true);

  // Reset and fetch on tab change or refresh
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      if (initialPosts && initialPosts.length > 0 && activeTab === 'semua') {
        // Skip fetch if SSR provided initial posts
        return;
      }
    }
    setPosts([]);
    setPage(0);
    setHasMore(true);
    hasMoreRef.current = true;
    fetchPosts(0, true);
  }, [activeTab, fetchPosts, refreshKey]);

  // Load more on scroll boundary triggers
  useEffect(() => {
    if (inView && hasMore && !initialLoading && !loadingMore && !refreshing) {
      setPage(prev => {
        const next = prev + 1;
        fetchPosts(next);
        return next;
      });
    }
  }, [inView, hasMore, initialLoading, loadingMore, refreshing, fetchPosts]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    hasMoreRef.current = true;
    fetchPosts(0, true);
  };

  // Render Skeleton Loader only if we have zero pre-loaded posts
  if (initialLoading && posts.length === 0) {
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

  return (
    <div className="space-y-4 relative pb-10">
      
      {/* Sleek Manual Pull/Refresh Indicator */}
      <div className="flex justify-end pr-1 shrink-0">
        <button
          onClick={handleManualRefresh}
          disabled={refreshing || loadingMore}
          className="text-xs font-bold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>{refreshing ? 'Memperbarui...' : 'Segarkan Feed'}</span>
        </button>
      </div>

      {posts.length === 0 && !initialLoading && !error && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
           <EmptyState 
              title="Belum ada kabar" 
              description={activeTab === 'semua' ? "Jadilah yang pertama membagikan kabar atau kegiatan pesantren Anda ke komunitas." : `Belum ada konten untuk kategori ${activeTab}.`}
              icon={<Users className="w-12 h-12 text-slate-300" />}
            />
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700 flex flex-col items-center gap-3">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-sm font-bold">{error}</p>
          <button
            onClick={() => handleManualRefresh()}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id}>
            <FeedCard post={post} currentUser={currentUser} />
          </div>
        ))}
      </div>
      
      {/* Scroll observer target */}
      {hasMore && !error && (
        <div ref={ref} className="py-6 flex justify-center">
          {(loadingMore || refreshing) && <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />}
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <div className="py-8 text-center text-xs font-extrabold text-slate-400 select-none tracking-wide uppercase">
          ✦ Semua postingan sudah ditampilkan ✦
        </div>
      )}
    </div>
  );
}
