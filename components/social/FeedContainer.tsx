'use client';

import { useState, useEffect, useRef } from 'react';
import { CreatePostComposer } from './CreatePostComposer';
import { FeedTabs } from './FeedTabs';
import { InfiniteFeed } from './InfiniteFeed';
import { SuggestedUsers } from './SuggestedUsers';
import { SuggestedProducts } from './SuggestedProducts';
import { SuggestedPrograms } from './SuggestedPrograms';
import { StoriesTray } from './StoriesTray';
import { createClient } from '@/lib/supabase/client';

export function FeedContainer({ user, initialTab = 'semua', initialPosts }: { user: any, initialTab?: string, initialPosts?: any[] }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [posts, setPosts] = useState<any[]>(initialPosts || []);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isTabletOrDesktop, setIsTabletOrDesktop] = useState(false);

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsTabletOrDesktop(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsTabletOrDesktop(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Real-time Supabase Subscription for incoming community posts
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('public:social_posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_posts'
        },
        async (payload) => {
          const newPost = payload.new;
          if (!newPost) return;

          // 1. Skip if it is from the current user (already handled optimistically)
          if (newPost.author_id === user?.id) {
            return;
          }

          // 2. Fetch the profile details of the author
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, username, avatar_url, role, has_pesantren, is_seller, seller_status, is_courier, courier_status, team_division, is_verified, followers:social_follows!social_follows_following_id_fkey(count)')
            .eq('id', newPost.author_id)
            .single();

          const enrichedPost: any = {
            ...newPost,
            author: profile || {
              id: newPost.author_id,
              name: 'Pengguna',
              username: 'pengguna',
              avatar_url: null,
              role: 'member'
            },
            likes_count: [{ count: 0 }],
            reactions: [],
            comments_count: [{ count: 0 }],
            has_liked: false,
            has_saved: false,
            author_followed: false,
            my_reaction: null
          };

          // 3. Prepend to posts list if the category matches the active view
          if (activeTabRef.current === 'semua' || activeTabRef.current === enrichedPost.type) {
            setPosts(prev => {
              if (prev.some(p => p.id === enrichedPost.id)) return prev;
              return [enrichedPost, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Composer callbacks for Optimistic UI prepend
  const handleOptimisticPost = (tempPost: any) => {
    console.log('[FEED_OPTIMISTIC_ADDED]', tempPost.id);
    if (activeTabRef.current !== 'semua' && activeTabRef.current !== tempPost.type) {
      return;
    }
    setPosts(prev => {
      if (prev.some(p => p.id === tempPost.id)) return prev;
      return [tempPost, ...prev];
    });
  };

  const handlePostCreated = (realPost: any, tempId: string) => {
    console.log('[FEED_POST_CREATED]', realPost.id);
    setPosts(prev => prev.map(p => {
      if (p.id === tempId) {
        console.log('[FEED_POST_REPLACED]', tempId, 'with', realPost.id);
        return {
          ...p,
          id: realPost.id,
          image_url: realPost.image_url || p.image_url,
          video_url: realPost.video_url || p.video_url,
          status: 'active',
          created_at: realPost.created_at || p.created_at
        };
      }
      return p;
    }));
  };

  const handlePostFailed = (tempId: string, error: string) => {
    console.error('[FEED_POST_FAILED]', tempId, error);
    setPosts(prev => prev.map(p => {
      if (p.id === tempId) {
        return {
          ...p,
          status: 'failed',
          error: error
        };
      }
      return p;
    }));
  };

  const handleRetryPost = (failedPost: any) => {
    // Retry action: copy content back to composer state or dispatch event
    const retryEvent = new CustomEvent('retry-post', { detail: failedPost });
    window.dispatchEvent(retryEvent);
  };

  return (
    <div className="max-w-[680px] mx-auto xl:mx-0 w-full pt-4 md:pt-8 px-4 md:px-0">
      
      {/* Mobile Title */}
      <div className="md:hidden mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Beranda</h1>
        <p className="text-sm text-slate-500">Kabar terbaru dari komunitas WIBAWA NUSANTARA</p>
      </div>

      <StoriesTray user={user} />
      
      <CreatePostComposer 
        user={user} 
        onOptimisticPost={handleOptimisticPost}
        onPostCreated={handlePostCreated}
        onPostFailed={handlePostFailed}
      />

      {/* Mobile-only lightweight carousels */}
      <div className="block md:hidden mb-6 space-y-4">
        <SuggestedUsers currentUserId={user?.id} />
        <SuggestedProducts />
      </div>
      
      <div className="sticky top-[60px] md:top-0 bg-slate-100/50 pt-2 pb-2 z-10 backdrop-blur-md">
        <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {isTabletOrDesktop && (
        <div className="hidden md:block xl:hidden mb-6 space-y-4">
          <SuggestedUsers currentUserId={user.id} />
          <SuggestedProducts />
          <SuggestedPrograms />
        </div>
      )}

      <InfiniteFeed 
        activeTab={activeTab} 
        currentUser={user} 
        refreshKey={refreshKey} 
        initialPosts={initialPosts} 
        posts={posts}
        setPosts={setPosts}
        onRetry={handleRetryPost}
      />

    </div>
  );
}
