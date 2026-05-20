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
import { 
  deletePost, 
  finalizePostMedia, 
  markPostUploadFailed 
} from '@/app/(social)/feed/actions';
import { 
  uploadPostImageWithProgress, 
  uploadSocialVideoWithProgress 
} from '@/lib/supabase/storage';
import { compressImage } from '@/lib/media/compressImage';

export function FeedContainer({ user, initialTab = 'semua', initialPosts }: { user: any, initialTab?: string, initialPosts?: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [posts, setPosts] = useState<any[]>(initialPosts || []);
  const [isTabletOrDesktop, setIsTabletOrDesktop] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [retryingPostId, setRetryingPostId] = useState<string | null>(null);
  const retryFileInputRef = useRef<HTMLInputElement>(null);

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

  const uploadPostMediaFlow = useCallback(async (postId: string, file: File, tempId?: string) => {
    const idToUpdate = tempId || postId;
    console.log('[MEDIA_UPLOAD_START] for post', postId);

    // Save to pending files so we can retry if needed
    setPendingFiles(prev => ({ ...prev, [postId]: file }));

    // Helper to update progress
    const updateProgress = (progress: number) => {
      console.log('[MEDIA_UPLOAD_PROGRESS] post', postId, progress, '%');
      setPosts(prev => prev.map(p => p.id === idToUpdate ? { ...p, status: 'uploading', progress } : p));
    };

    updateProgress(10); // Start progress

    try {
      const isVideo = file.type.startsWith('video/');
      const mediaType = isVideo ? 'video' : 'image';
      
      let imageUrl = null;
      let videoUrl = null;
      let uploadRes;

      if (mediaType === 'image') {
        updateProgress(20);
        console.log('[IMAGE_COMPRESS_START] post', postId);
        const compressedFile = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.76 });
        console.log('[IMAGE_COMPRESS_DONE] post', postId);
        
        updateProgress(35);
        uploadRes = await uploadPostImageWithProgress(compressedFile, user.id, (p) => {
          // Map progress from 35% to 90%
          const mappedProgress = Math.round(35 + (p * 0.55));
          updateProgress(mappedProgress);
        });
        imageUrl = uploadRes.url;
      } else {
        console.log('[VIDEO_UPLOAD_NO_COMPRESS] post', postId);
        updateProgress(30);
        uploadRes = await uploadSocialVideoWithProgress(file, user.id, (p) => {
          // Map progress from 30% to 90%
          const mappedProgress = Math.round(30 + (p * 0.60));
          updateProgress(mappedProgress);
        });
        videoUrl = uploadRes.url;
      }

      if (uploadRes.error || (!imageUrl && !videoUrl)) {
        throw new Error(uploadRes.error || 'Upload returned empty URL');
      }

      updateProgress(95);

      // Finalize post media
      console.log('[POST_FINALIZED] Finalizing post', postId);
      const finalRes = await finalizePostMedia(postId, {
        image_url: imageUrl || undefined,
        video_url: videoUrl || undefined,
        media_url: imageUrl || videoUrl || undefined,
        media_type: mediaType
      });

      if (!finalRes.success || !finalRes.post) {
        throw new Error(finalRes.error || 'Finalize returned unsuccessful');
      }

      // Success! Replace post with final post in state
      console.log('[FEED_STATE_REPLACED] post', postId);
      setPosts(prev => prev.map(p => p.id === idToUpdate ? finalRes.post : p));
      
      // Clear pending file
      setPendingFiles(prev => {
        const copy = { ...prev };
        delete copy[postId];
        return copy;
      });

      // Optional background refresh for cache revalidation
      setTimeout(() => {
        router.refresh();
      }, 1500);

    } catch (err: any) {
      console.error('[POST_UPLOAD_FAILED] post', postId, err);
      await markPostUploadFailed(postId);
      setPosts(prev => prev.map(p => p.id === idToUpdate ? { ...p, status: 'upload_failed', progress: 0 } : p));
    }
  }, [user.id, router]);

  const handlePostCreated = useCallback((post: any) => {
    console.log('[FEED_STATE_PREPENDED] post', post.id);
    setPosts(prev => {
      const filtered = prev.filter(p => p.id !== post.id);
      return [post, ...filtered];
    });
  }, []);

  const handlePostUpdated = useCallback((idToReplace: string, updatedPost: any) => {
    console.log('[FEED_POST_UPDATED] Replacing/updating post', idToReplace, 'with', updatedPost.id);
    setPosts(prev => prev.map(p => p.id === idToReplace ? { ...p, ...updatedPost } : p));
  }, []);

  const handleRetryPost = useCallback((post: any) => {
    const file = pendingFiles[post.id];
    if (file) {
      uploadPostMediaFlow(post.id, file);
    } else {
      setRetryingPostId(post.id);
      retryFileInputRef.current?.click();
    }
  }, [pendingFiles, uploadPostMediaFlow]);

  const handleDeleteDraftPost = useCallback(async (post: any) => {
    const res = await deletePost(post.id);
    if (!res.error) {
      setPosts(prev => prev.filter(p => p.id !== post.id));
      setPendingFiles(prev => {
        const copy = { ...prev };
        delete copy[post.id];
        return copy;
      });
    }
  }, []);

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
        onPostUpdated={handlePostUpdated}
        onUploadMediaFlow={uploadPostMediaFlow}
      />

      <input
        type="file"
        accept="image/*,video/*"
        ref={retryFileInputRef}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file && retryingPostId) {
            if (file.type.startsWith('video/')) {
              if (file.size > 50 * 1024 * 1024) {
                alert('Video terlalu besar. Maksimal 50MB / 60 detik.');
                return;
              }
            }
            uploadPostMediaFlow(retryingPostId, file);
            setRetryingPostId(null);
          }
        }}
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
        onRetry={handleRetryPost}
        onDeleteDraft={handleDeleteDraftPost}
      />

    </div>
  );
}
