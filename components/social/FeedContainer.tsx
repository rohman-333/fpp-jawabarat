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

    // Helper to update progress and stage
    const updatePostProgress = (progress: number, stage: string) => {
      console.log(`[FEED_PROGRESS_STAGE] ${postId} stage=${stage} progress=${progress}`);
      setPosts(prev => prev.map(p => p.id === idToUpdate ? { ...p, status: 'uploading', progress, upload_stage: stage } : p));
    };

    updatePostProgress(15, 'preparing_media');

    try {
      const isVideo = file.type.startsWith('video/');
      const mediaType = isVideo ? 'video' : 'image';
      
      let imageUrl = null;
      let videoUrl = null;
      let uploadRes;

      if (mediaType === 'image') {
        const compressedFile = await compressImage(file, { 
          maxWidth: 1280, 
          maxHeight: 1280, 
          quality: 0.76,
          onProgress: (p, stage) => {
            updatePostProgress(p, stage);
          }
        });
        
        updatePostProgress(25, 'upload_started');
        uploadRes = await uploadPostImageWithProgress(compressedFile, user.id, (payload) => {
          updatePostProgress(payload.progress, payload.stage);
        }, postId);
        imageUrl = uploadRes.url;
      } else {
        // Video has no compression
        updatePostProgress(15, 'video_no_compress');
        updatePostProgress(25, 'video_upload_started');
        uploadRes = await uploadSocialVideoWithProgress(file, user.id, (payload) => {
          updatePostProgress(payload.progress, payload.stage);
        }, postId);
        videoUrl = uploadRes.url;
      }

      if (uploadRes.error || (!imageUrl && !videoUrl)) {
        throw new Error(uploadRes.error || 'Upload returned empty URL');
      }

      console.log(`[FEED_UPLOAD_DONE] ${postId}`);
      updatePostProgress(92, 'upload_finishing');
      updatePostProgress(96, 'finalizing');

      // Finalize post media
      const finalRes = await finalizePostMedia(postId, {
        image_url: imageUrl || undefined,
        video_url: videoUrl || undefined,
        media_url: imageUrl || videoUrl || undefined,
        media_type: mediaType
      });

      if (!finalRes.success || !finalRes.post) {
        throw new Error(finalRes.error || 'Finalize returned unsuccessful');
      }

      updatePostProgress(100, 'completed');
      console.log(`[FEED_FINALIZE_DONE] ${postId}`);

      // Success! Replace post with final post in state, ensuring progress is cleared and status is active
      const finalPost = {
        ...finalRes.post,
        status: 'active',
        progress: undefined,
        upload_stage: undefined
      };

      setPosts(prev => prev.map(p => p.id === idToUpdate ? finalPost : p));
      
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
      console.error(`[FEED_UPLOAD_FAILED] ${postId} error=`, err.message || err);
      await markPostUploadFailed(postId);
      setPosts(prev => prev.map(p => p.id === idToUpdate ? { ...p, status: 'upload_failed', progress: 0, upload_stage: 'failed' } : p));
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
                alert('Video terlalu besar. Maksimal 50MB.');
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
