'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, X, Camera, Video, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/media/compressImage';
import { MobileBottomSheet } from '@/components/shared/MobileBottomSheet';
import { 
  createStoryDraft, 
  finalizeStoryMedia, 
  markStoryUploadFailed 
} from '@/app/(social)/feed/actions';
import { 
  uploadPostImageWithProgress, 
  uploadSocialVideoWithProgress 
} from '@/lib/supabase/storage';

const getStageText = (stage: string, progress: number) => {
  switch (stage) {
    case 'preparing_media':
      return 'Menyiapkan media...';
    case 'compressing_image':
      return `Mengompres gambar (${progress}%)...`;
    case 'image_compress_skipped':
      return 'Menyiapkan gambar (tidak dikompres)...';
    case 'image_compress_done':
    case 'image_compress_timeout_fallback':
      return 'Kompresi selesai, bersiap mengunggah...';
    case 'video_no_compress':
      return 'Menyiapkan video...';
    case 'upload_started':
    case 'video_upload_started':
      return 'Mulai mengunggah...';
    case 'upload_progress':
      return `Mengunggah media (${progress}%)...`;
    case 'upload_finishing':
      return 'Menyelesaikan unggahan...';
    case 'finalizing':
      return 'Menyimpan status...';
    case 'completed':
      return 'Selesai!';
    case 'failed':
      return 'Upload gagal.';
    default:
      return 'Upload masih berjalan...';
  }
};

export function StoriesTray({ user }: { user: any }) {
  const [stories, setStories] = useState<any[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<any | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  const [retryingStoryId, setRetryingStoryId] = useState<string | null>(null);
  const retryFileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('social_stories')
      .select('*, author:author_id(name, avatar_url, username)')
      .gt('expires_at', new Date().toISOString())
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(15);
    
    if (data) {
      // Owner sees all their drafts, other users only see completed active stories
      const filtered = data.filter((story: any) => {
        const isOwner = story.author_id === user?.id;
        const isReady = story.status === 'active' || story.upload_status === 'completed' || (!story.status && !story.upload_status);
        return isReady || isOwner;
      });
      setStories(filtered);
    }
    setLoading(false);
  };

  const updateStoryProgress = useCallback((storyId: string, progress: number, stage: string) => {
    console.log(`[STATUS_PROGRESS_STAGE] ${storyId} stage=${stage} progress=${progress}`);
    
    setStories(prev =>
      prev.map(story =>
        story.id === storyId
          ? { ...story, progress, upload_stage: stage, status: progress === 100 ? 'active' : 'uploading', upload_status: progress === 100 ? 'completed' : 'uploading' }
          : story
      )
    );

    setActiveGroup((prevGroup: any) => {
      if (prevGroup) {
        const updatedStories = prevGroup.stories.map((s: any) =>
          s.id === storyId
            ? { ...s, progress, upload_stage: stage, status: progress === 100 ? 'active' : 'uploading', upload_status: progress === 100 ? 'completed' : 'uploading' }
            : s
        );
        return { ...prevGroup, stories: updatedStories };
      }
      return prevGroup;
    });
  }, []);

  const uploadStoryMediaFlow = async (storyId: string, file: File, tempId?: string) => {
    const idToUpdate = tempId || storyId;
    console.log('[STATUS_MEDIA_UPLOAD_START] story:', storyId, 'file:', file.name);

    // Save to pending files so we can retry if needed
    setPendingFiles(prev => ({ ...prev, [storyId]: file }));

    updateStoryProgress(idToUpdate, 15, 'preparing_media');

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
            updateStoryProgress(idToUpdate, p, stage);
          }
        });

        updateStoryProgress(idToUpdate, 25, 'upload_started');
        uploadRes = await uploadPostImageWithProgress(compressedFile, user.id, (payload) => {
          updateStoryProgress(idToUpdate, payload.progress, payload.stage);
        }, storyId);
        imageUrl = uploadRes.url;
      } else {
        updateStoryProgress(idToUpdate, 15, 'video_no_compress');
        updateStoryProgress(idToUpdate, 25, 'video_upload_started');
        uploadRes = await uploadSocialVideoWithProgress(file, user.id, (payload) => {
          updateStoryProgress(idToUpdate, payload.progress, payload.stage);
        }, storyId);
        videoUrl = uploadRes.url;
      }

      if (uploadRes.error || (!imageUrl && !videoUrl)) {
        throw new Error(uploadRes.error || 'Upload returned empty URL');
      }

      console.log(`[STATUS_UPLOAD_DONE] ${storyId}`);
      updateStoryProgress(idToUpdate, 92, 'upload_finishing');
      updateStoryProgress(idToUpdate, 96, 'finalizing');

      const finalRes = await finalizeStoryMedia(storyId, {
        image_url: imageUrl || undefined,
        video_url: videoUrl || undefined,
        media_url: imageUrl || videoUrl || undefined,
        media_type: mediaType
      });

      if (!finalRes.success || !finalRes.story) {
        throw new Error(finalRes.error || 'Failed to finalize story');
      }

      updateStoryProgress(idToUpdate, 100, 'completed');
      console.log(`[STATUS_FINALIZE_DONE] ${storyId}`);

      const finalStoryObj = {
        ...finalRes.story,
        status: 'active',
        upload_status: 'completed',
        progress: undefined,
        upload_stage: undefined
      };

      setStories(prev => prev.map(s => s.id === idToUpdate ? finalStoryObj : s));
      setActiveGroup((prevGroup: any) => {
        if (prevGroup) {
          const updatedStories = prevGroup.stories.map((s: any) => s.id === idToUpdate ? finalStoryObj : s);
          return { ...prevGroup, stories: updatedStories };
        }
        return prevGroup;
      });

      // Clear from pending files
      setPendingFiles(prev => {
        const copy = { ...prev };
        delete copy[storyId];
        return copy;
      });

    } catch (err: any) {
      console.error(`[STATUS_UPLOAD_FAILED] ${storyId} error=`, err.message || err);
      await markStoryUploadFailed(storyId);
      const failedStoryObj = {
        status: 'upload_failed',
        upload_status: 'failed',
        progress: 0,
        upload_stage: 'failed'
      };
      setStories(prev => prev.map(s => s.id === idToUpdate ? { ...s, ...failedStoryObj } : s));
      setActiveGroup((prevGroup: any) => {
        if (prevGroup) {
          const updatedStories = prevGroup.stories.map((s: any) => s.id === idToUpdate ? { ...s, ...failedStoryObj } : s);
          return { ...prevGroup, stories: updatedStories };
        }
        return prevGroup;
      });
    }
  };

  const handleStartStoryFlow = async (content: string, file: File | null, duration: number) => {
    let localPreviewUrl = null;
    let mediaType = 'text';
    if (file) {
      localPreviewUrl = URL.createObjectURL(file);
      mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    }

    const tempId = `temp-${Date.now()}`;
    const tempStory = {
      id: tempId,
      author_id: user.id,
      content: content || '',
      media_url: localPreviewUrl,
      media_type: mediaType,
      expires_at: new Date(Date.now() + duration * 60 * 60 * 1000).toISOString(),
      status: 'uploading',
      upload_status: 'uploading',
      progress: 10,
      upload_stage: 'draft_created',
      created_at: new Date().toISOString(),
      author: {
        name: user.user_metadata?.name || 'Pengguna',
        username: user.user_metadata?.username || 'pengguna',
        avatar_url: user.user_metadata?.avatar_url || null
      }
    };

    console.log('[STATUS_STATE_PREPENDED] story:', tempId);
    setStories(prev => [tempStory, ...prev]);

    try {
      const draftRes = await createStoryDraft(content, mediaType, duration);
      if (!draftRes.success || !draftRes.story) {
        throw new Error(draftRes.error || 'Failed to create story draft');
      }

      const realStory = draftRes.story;
      console.log(`[STATUS_DRAFT_CREATED] ${realStory.id} progress=10`);

      // Replace temp story with real draft story containing preview URL in local state
      setStories(prev => prev.map(s => s.id === tempId ? { ...realStory, media_url: localPreviewUrl, progress: 10, upload_stage: 'draft_created' } : s));

      if (file) {
        uploadStoryMediaFlow(realStory.id, file, tempId);
      } else {
        const finalizeRes = await finalizeStoryMedia(realStory.id, {
          media_type: 'text'
        });
        if (finalizeRes.success && finalizeRes.story) {
          console.log(`[STATUS_FINALIZE_DONE] ${realStory.id}`);
          setStories(prev => prev.map(s => s.id === tempId ? { ...finalizeRes.story, status: 'active', upload_status: 'completed', progress: undefined, upload_stage: undefined } : s));
        }
      }
    } catch (err) {
      console.error('[STATUS_DRAFT_FAILED]', err);
      setStories(prev => prev.map(s => s.id === tempId ? { ...tempStory, status: 'upload_failed', upload_status: 'failed', progress: 0, upload_stage: 'failed' } : s));
    }
  };

  const handleRetryStory = async (story: any) => {
    const file = pendingFiles[story.id];
    if (file) {
      uploadStoryMediaFlow(story.id, file);
    } else {
      setRetryingStoryId(story.id);
      retryFileInputRef.current?.click();
    }
  };

  // Group stories by author_id
  const groupStories = (flatStories: any[]) => {
    const groups: Record<string, any> = {};
    flatStories.forEach((story) => {
      const authorId = story.author_id;
      const isUploading = story.upload_status === 'uploading' || story.status === 'uploading';
      const isFailed = story.upload_status === 'failed' || story.status === 'upload_failed';

      if (!groups[authorId]) {
        groups[authorId] = {
          author_id: authorId,
          author: story.author || {
            name: 'Pengguna',
            username: 'pengguna',
            avatar_url: null
          },
          stories: [],
          hasUploading: false,
          hasFailed: false,
          latestCreatedAt: story.created_at,
        };
      }

      groups[authorId].stories.push(story);
      if (isUploading) groups[authorId].hasUploading = true;
      if (isFailed) groups[authorId].hasFailed = true;
      if (new Date(story.created_at) > new Date(groups[authorId].latestCreatedAt)) {
        groups[authorId].latestCreatedAt = story.created_at;
      }
    });

    Object.values(groups).forEach((group: any) => {
      group.stories.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

    return Object.values(groups).sort((a: any, b: any) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime());
  };

  const groupedStories = groupStories(stories);

  return (
    <div className="mb-6">
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
        <div className="snap-center shrink-0 w-24 flex flex-col items-center cursor-pointer" onClick={() => setIsComposerOpen(true)}>
          <div className="w-16 h-16 rounded-full border-2 border-slate-200 p-0.5 relative mb-1.5 bg-slate-50 flex items-center justify-center">
            <Plus className="w-6 h-6 text-slate-400" />
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700">Buat Status</span>
        </div>

        {groupedStories.map(group => {
          const isUploading = group.hasUploading;
          const isFailed = group.hasFailed;
          const authorName = group.author?.name || 'Pengguna';
          const avatarUrl = group.author?.avatar_url;

          return (
            <div 
              key={group.author_id} 
              className="snap-center shrink-0 w-24 flex flex-col items-center cursor-pointer relative" 
              onClick={() => {
                setActiveGroup(group);
                setCurrentStoryIndex(0);
              }}
            >
              <div className={`w-16 h-16 rounded-full border-2 p-0.5 mb-1.5 relative overflow-hidden ${
                isFailed ? 'border-red-500 bg-red-50' : 
                isUploading ? 'border-blue-400 animate-pulse bg-blue-50' : 
                'border-blue-500'
              }`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 font-bold uppercase">
                      {authorName.charAt(0)}
                    </div>
                  )}
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center flex-col">
                    <span className="text-[10px] text-white font-extrabold">...</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-slate-700 truncate w-full text-center">
                {isUploading 
                  ? 'Mengunggah...' 
                  : isFailed 
                    ? 'Gagal upload' 
                    : authorName.split(' ')[0]
                }
              </span>
            </div>
          );
        })}
      </div>

      <input
        type="file"
        accept="image/*,video/*"
        ref={retryFileInputRef}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file && retryingStoryId) {
            if (file.type.startsWith('video/')) {
              if (file.size > 50 * 1024 * 1024) {
                alert('Video terlalu besar. Maksimal 50MB.');
                return;
              }
            }
            uploadStoryMediaFlow(retryingStoryId, file);
            setRetryingStoryId(null);
          }
        }}
      />

      {isComposerOpen && (
        <StoryComposerModal 
          user={user} 
          onClose={() => setIsComposerOpen(false)} 
          onStartStoryFlow={handleStartStoryFlow}
        />
      )}

      {activeGroup && (
        <StoryViewerModal 
          group={activeGroup}
          initialIndex={currentStoryIndex}
          user={user}
          onClose={() => setActiveGroup(null)}
          onDelete={async (storyId) => {
            await supabase.from('social_stories').delete().eq('id', storyId);
            setActiveGroup(null);
            fetchStories();
          }}
          onRetryStory={handleRetryStory}
        />
      )}
    </div>
  );
}

function StoryViewerModal({ 
  group, 
  initialIndex = 0,
  user, 
  onClose, 
  onDelete, 
  onRetryStory 
}: { 
  group: any; 
  initialIndex?: number;
  user: any; 
  onClose: () => void; 
  onDelete: (storyId: string) => void; 
  onRetryStory: (story: any) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [group, initialIndex]);

  const stories = group.stories || [];
  const story = stories[currentIndex];

  if (!story) return null;

  const isOwner = user?.id === story.author_id;
  const isFailed = story.upload_status === 'failed' || story.status === 'upload_failed';
  const isUploading = story.upload_status === 'uploading' || story.status === 'uploading';

  const getMediaSrc = (path: string) => {
    if (!path) return undefined;
    if (path.startsWith('blob:') || path.startsWith('http')) return path;
    return supabase.storage.from('posts').getPublicUrl(path).data.publicUrl;
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col">
      {/* Stories progress indicators */}
      <div className="absolute top-3 left-4 right-4 flex gap-1 z-[110] px-2">
        {stories.map((s: any, idx: number) => (
          <div 
            key={s.id} 
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'bg-blue-500 shadow-sm' : idx < currentIndex ? 'bg-blue-600/60' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      <div className="p-4 pt-8 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent z-[105]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
            {group.author?.avatar_url ? (
              <img src={group.author.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold uppercase">
                {group.author?.name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div>
            <div className="text-white font-bold text-sm">{group.author?.name || 'Pengguna'}</div>
            <div className="text-white/60 text-xs">
              {new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button 
              onClick={async () => {
                setDeleting(true);
                await onDelete(story.id);
                setDeleting(false);
              }} 
              disabled={deleting}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-full disabled:opacity-50 transition-colors z-[110]"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </button>
          )}
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors z-[110]">
            <X className="w-6 h-6 text-white"/>
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0 relative select-none">
        {/* Navigation arrows overlay */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-[101]">
          {currentIndex > 0 ? (
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center pointer-events-auto transition-all text-white border border-white/10 hover:scale-105 active:scale-95"
              title="Sebelumnya"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-12" />
          )}

          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center pointer-events-auto transition-all text-white border border-white/10 hover:scale-105 active:scale-95"
            title={currentIndex < stories.length - 1 ? "Selanjutnya" : "Tutup"}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="w-full max-w-lg max-h-full flex flex-col items-center justify-center gap-6 z-[100]">
          {isFailed && isOwner && (
            <div className="p-5 bg-slate-800/90 rounded-3xl border border-red-500/30 flex flex-col items-center gap-4 w-full max-w-sm">
              <span className="text-white text-sm font-bold text-center">Gagal Mengunggah Media Status</span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onRetryStory(story);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-colors"
                >
                  Coba Lagi
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    await onDelete(story.id);
                    setDeleting(false);
                  }}
                  disabled={deleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full transition-colors disabled:opacity-50"
                >
                  Hapus Draft
                </button>
              </div>
            </div>
          )}

          {isUploading && isOwner && (
            <div className="p-5 bg-slate-800/80 rounded-3xl flex flex-col items-center gap-3 w-full max-w-sm text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-white text-sm font-bold">{getStageText(story.upload_stage || 'draft_created', story.progress || 10)}</span>
              <span className="text-white/60 text-xs">Status akan otomatis aktif setelah upload selesai.</span>
            </div>
          )}

          {story.media_url && !isFailed && (
            <div className="w-full max-h-[70vh] rounded-2xl overflow-hidden flex items-center justify-center bg-black/50">
              {story.media_type === 'video' ? (
                <video 
                  src={getMediaSrc(story.media_url)} 
                  controls 
                  preload="metadata" 
                  playsInline 
                  className="max-w-full max-h-full object-contain" 
                />
              ) : (
                <img src={getMediaSrc(story.media_url)} alt="" className="max-w-full max-h-full object-contain" />
              )}
            </div>
          )}
          
          {story.content && !isFailed && (
            <div className={`w-full p-6 text-center text-white ${!story.media_url ? 'text-2xl sm:text-4xl font-bold px-8' : 'text-lg'}`}>
              {story.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StoryComposerModal({
  user,
  onClose,
  onStartStoryFlow
}: {
  user: any;
  onClose: () => void;
  onStartStoryFlow: (content: string, file: File | null, duration: number) => void;
}) {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [duration, setDuration] = useState(24);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      if (file.size > 50 * 1024 * 1024) {
        alert('Video terlalu besar. Maksimal 50MB.');
        return;
      }
      setMediaType('video');
    } else {
      setMediaType('image');
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handlePost = async () => {
    setIsSubmitting(true);
    onStartStoryFlow(content, mediaFile, duration);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Buat Status Baru</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4 min-h-0">
          <textarea
            placeholder="Ada kabar apa hari ini?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[100px] resize-none border-0 focus:ring-0 text-slate-700 placeholder-slate-400 text-sm focus:outline-none"
          />

          {mediaPreview && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 max-h-[250px] flex items-center justify-center">
              {mediaType === 'video' ? (
                <video src={mediaPreview} controls className="max-h-[250px] w-auto" />
              ) : (
                <img src={mediaPreview} alt="Preview" className="max-h-[250px] w-auto object-contain" />
              )}
              <button
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                  setMediaType(null);
                }}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-slate-600 font-bold text-sm"
            >
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              Media
            </button>
            <input
              type="file"
              accept="image/*,video/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500">Durasi Tayang</label>
            <div className="grid grid-cols-3 gap-2">
              {[12, 24, 48].map((hours) => (
                <button
                  key={hours}
                  onClick={() => setDuration(hours)}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                    duration === hours
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {hours} Jam
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="rounded-xl font-bold">
            Batal
          </Button>
          <Button
            onClick={handlePost}
            disabled={isSubmitting || (!content.trim() && !mediaFile)}
            className="rounded-xl font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            {isSubmitting ? 'Mengunggah...' : 'Bagikan Status'}
          </Button>
        </div>
      </div>
    </div>
  );
}
