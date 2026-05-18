'use client';

import { useState } from 'react';
import { CreatePostComposer } from './CreatePostComposer';
import { FeedTabs } from './FeedTabs';
import { InfiniteFeed } from './InfiniteFeed';
import { SuggestedUsers } from './SuggestedUsers';
import { SuggestedProducts } from './SuggestedProducts';
import { SuggestedPrograms } from './SuggestedPrograms';

export function FeedContainer({ user, initialTab = 'semua', initialPosts }: { user: any, initialTab?: string, initialPosts?: any[] }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  return (
    <div className="max-w-[680px] mx-auto xl:mx-0 w-full pt-4 md:pt-8 px-4 md:px-0">
      
      {/* Mobile Title */}
      <div className="md:hidden mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Beranda</h1>
        <p className="text-sm text-slate-500">Kabar terbaru dari komunitas FPP JAWABARAT</p>
      </div>

      <CreatePostComposer user={user} onSuccess={triggerRefresh} />
      
      <div className="sticky top-[60px] md:top-0 bg-slate-100/50 pt-2 pb-2 z-10 backdrop-blur-md">
        <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="xl:hidden mb-6 space-y-4">
        <SuggestedUsers currentUserId={user.id} />
        <SuggestedProducts />
        <SuggestedPrograms />
      </div>

      <InfiniteFeed activeTab={activeTab} currentUser={user} refreshKey={refreshKey} initialPosts={initialPosts} />

    </div>
  );
}
