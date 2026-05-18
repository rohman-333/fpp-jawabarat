'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeedCard } from './FeedCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Users, Loader2 } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { FeedProductCard } from './FeedProductCard';

export function InfiniteFeed({ activeTab, currentUser, refreshKey = 0, targetUserId, initialPosts }: { activeTab: string, currentUser?: any, refreshKey?: number, targetUserId?: string, initialPosts?: any[] }) {
  const supabase = createClient();
  const [posts, setPosts] = useState<any[]>(initialPosts || []);
  const [banners, setBanners] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchAds = async () => {
      const { data: b } = await supabase.from('site_banners').select('*').eq('status', 'active').eq('placement', 'feed_inline');
      if (b) setBanners(b);
      const { data: p } = await supabase.from('programs').select('*').eq('status', 'published').limit(5);
      if (p) setPrograms(p);
    };
    fetchAds();
  }, [supabase]);

  const fetchPosts = useCallback(async (pageNum: number, isReset: boolean = false) => {
    try {
      setLoading(true);
      let query = supabase
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
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (targetUserId) {
        query = query.eq('author_id', targetUserId);
      } else if (activeTab !== 'semua' && activeTab !== 'mengikuti' && activeTab !== 'tersimpan') {
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
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('[FEED_FETCH_ERROR]', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('[FEED_POSTS_COUNT]', data.length);
        console.log('[FEED_FIRST_POST]', data[0]);

        // Fetch authors separately to avoid complex nested join issues
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

        // Fetch user interactions if logged in
        let userInteractions = { likes: new Set(), saves: new Set(), follows: new Set() };
        
        if (currentUser?.id) {
          const postIds = data.map(p => p.id);
          
          const [likesRes, savesRes, followsRes] = await Promise.all([
            supabase.from('social_likes').select('post_id').in('post_id', postIds).eq('user_id', currentUser.id),
            supabase.from('social_saves').select('post_id').in('post_id', postIds).eq('user_id', currentUser.id),
            authorIds.length > 0 ? supabase.from('social_follows').select('following_id').in('following_id', authorIds).eq('follower_id', currentUser.id) : Promise.resolve({ data: null })
          ]);

          if (likesRes.data) likesRes.data.forEach(l => userInteractions.likes.add(l.post_id));
          if (savesRes.data) savesRes.data.forEach(s => userInteractions.saves.add(s.post_id));
          if (followsRes.data) followsRes.data.forEach(f => userInteractions.follows.add(f.following_id));
        }

        const enrichedData = data.map(post => ({
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
        if (isReset) {
          setPosts([]);
          setHasMore(false);
          // Temporary debug when fetching initial page and it's empty
          console.log('[DEBUG_FEED_EMPTY] Filter used - activeTab:', activeTab, 'targetUserId:', targetUserId);
        }
      }
    } catch (error) {
      console.error('[FEED_FETCH_ERROR]', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, targetUserId, activeTab, currentUser?.id]);

  const initialMount = useRef(true);

  // Reset and fetch on tab change or refresh
  useEffect(() => {
    if (initialMount.current && initialPosts && initialPosts.length > 0) {
      initialMount.current = false;
      return;
    }
    setPosts([]);
    setPage(0);
    setHasMore(true);
    fetchPosts(0, true);
  }, [activeTab, fetchPosts, refreshKey, initialPosts]);

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
      {posts.map((post, index) => {
        const showBanner = (index + 1) % 6 === 0 && banners.length > 0;
        const bannerIndex = Math.floor((index + 1) / 6) % banners.length;
        const banner = showBanner ? banners[bannerIndex] : null;

        const showProgram = (index + 1) % 8 === 0 && programs.length > 0;
        const programIndex = Math.floor((index + 1) / 8) % programs.length;
        const program = showProgram ? programs[programIndex] : null;

        return (
          <div key={post.id}>
            <FeedCard post={post} currentUserId={currentUser?.id} />
            
            {banner && (
              <div className="my-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                <a href={banner.cta_url || '#'} className="block relative">
                  <img src={banner.image_url} alt={banner.title || 'Sponsor'} className="w-full h-[180px] object-cover group-hover:scale-105 transition-transform duration-500" />
                  {banner.is_sponsored && (
                    <div className="absolute top-4 left-4 bg-yellow-500 text-slate-900 text-[10px] font-black tracking-widest px-2 py-1 rounded shadow-md uppercase">
                      Sponsor {banner.sponsor_name && `- ${banner.sponsor_name}`}
                    </div>
                  )}
                  {(banner.title || banner.cta_label) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      {banner.title && <h4 className="text-white font-bold text-lg mb-1">{banner.title}</h4>}
                      {banner.cta_label && <span className="text-emerald-300 font-bold text-xs">{banner.cta_label} &rarr;</span>}
                    </div>
                  )}
                </a>
              </div>
            )}

            {program && (
              <div className="my-4 bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 bg-gradient-to-br from-emerald-50 to-white flex gap-4 items-center">
                <div className="w-16 h-16 rounded-xl bg-emerald-100 shrink-0 overflow-hidden flex items-center justify-center">
                  {program.image_url ? (
                    <img src={program.image_url} alt={program.title} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-emerald-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Program Sinergi: {program.category || 'Umum'}</p>
                  <h4 className="font-bold text-slate-800 text-sm truncate mb-1">{program.title}</h4>
                  <a href={`/program/${program.slug}`} className="inline-block bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors">Lihat Detail</a>
                </div>
              </div>
            )}

            {(index > 0 && (index + 1) % 5 === 0) && (
              <FeedProductCard />
            )}
          </div>
        );
      })}
      
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
