'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { CreatePostComposer } from './CreatePostComposer';
import { FeedTabs } from './FeedTabs';
import { InfiniteFeed } from './InfiniteFeed';
import { SuggestedUsers } from './SuggestedUsers';
import { SuggestedProducts } from './SuggestedProducts';
import { SuggestedPrograms } from './SuggestedPrograms';
import { StoriesTray } from './StoriesTray';
import { useRouter } from 'next/navigation';

export function FeedContainer({ user, initialTab = 'semua', initialPosts }: { user: any, initialTab?: string, initialPosts?: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [posts, setPosts] = useState<any[]>(initialPosts || []);
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

  // =============================================
  // DIRECT CALLBACK: Called by CreatePostComposer
  // after createPost server action succeeds.
  // This is the PRIMARY mechanism for feed updates.
  // =============================================
  const handlePostCreated = useCallback((post: any) => {
    console.log('[FEED_POST_CREATED] Prepending post', post.id);
    setPosts(prev => {
      // Remove any temp/duplicate entry, then prepend
      const filtered = prev.filter(p => p.id !== post.id);
      return [post, ...filtered];
    });

    // Delayed background refresh to sync server state (cache revalidation)
    // without disrupting the already-visible post
    setTimeout(() => {
      console.log('[FEED_BACKGROUND_REFRESH] router.refresh()');
      router.refresh();
    }, 800);
  }, [router]);

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
        onPostCreated={handlePostCreated}
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
        initialPosts={initialPosts} 
        posts={posts}
        setPosts={setPosts}
      />

    </div>
  );
}
