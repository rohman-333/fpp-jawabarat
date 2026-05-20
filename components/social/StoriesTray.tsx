'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, X, Camera, Video, Image as ImageIcon, Loader2 } from 'lucide-react';
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

export function StoriesTray({ user }: { user: any }) {
  const [stories, setStories] = useState<any[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<any | null>(null);
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

  const uploadStoryMediaFlow = async (storyId: string, file: File, tempId?: string) => {
    const idToUpdate = tempId || storyId;
    console.log('[STATUS_MEDIA_UPLOAD_START] story:', storyId, 'file:', file.name);

    // Save to pending files so we can retry if needed
    setPendingFiles(prev => ({ ...prev, [storyId]: file }));

    try {
      const isVideo = file.type.startsWith('video/');
      const mediaType = isVideo ? 'video' : 'image';
      
      let imageUrl = null;
      let videoUrl = null;
      let uploadRes;

      if (mediaType === 'image') {
        console.log('[IMAGE_COMPRESS_START] story:', storyId);
        const compressedFile = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.76 });
        console.log('[IMAGE_COMPRESS_DONE] story:', storyId);

        uploadRes = await uploadPostImageWithProgress(compressedFile, user.id, (p) => {
          console.log('[STATUS_MEDIA_UPLOAD_PROGRESS] story:', storyId, p, '%');
        });
        imageUrl = uploadRes.url;
      } else {
        console.log('[STATUS_MEDIA_UPLOAD_PROGRESS] video no-compress upload start:', storyId);
        uploadRes = await uploadSocialVideoWithProgress(file, user.id, (p) => {
          console.log('[STATUS_MEDIA_UPLOAD_PROGRESS] story:', storyId, p, '%');
        });
        videoUrl = uploadRes.url;
      }

      if (uploadRes.error || (!imageUrl && !videoUrl)) {
        throw new Error(uploadRes.error || 'Upload returned empty URL');
      }

      console.log('[STATUS_MEDIA_UPLOAD_DONE] story:', storyId);

      const finalRes = await finalizeStoryMedia(storyId, {
        image_url: imageUrl || undefined,
        video_url: videoUrl || undefined,
        media_url: imageUrl || videoUrl || undefined,
        media_type: mediaType
      });

      if (!finalRes.success || !finalRes.story) {
        throw new Error(finalRes.error || 'Failed to finalize story');
      }

      console.log('[STATUS_FINALIZED] story:', storyId);

      // Success! Update local stories state
      setStories(prev => prev.map(s => s.id === idToUpdate ? finalRes.story : s));

      // Clear from pending files
      setPendingFiles(prev => {
        const copy = { ...prev };
        delete copy[storyId];
        return copy;
      });

    } catch (err) {
      console.error('[STATUS_UPLOAD_FAILED] story:', storyId, err);
      await markStoryUploadFailed(storyId);
      setStories(prev => prev.map(s => s.id === idToUpdate ? { ...s, status: 'upload_failed', upload_status: 'failed' } : s));
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
      console.log('[STATUS_DRAFT_CREATED] Creating story draft...');
      const draftRes = await createStoryDraft(content, mediaType, duration);
      if (!draftRes.success || !draftRes.story) {
        throw new Error(draftRes.error || 'Failed to create story draft');
      }

      const realStory = draftRes.story;
      console.log('[STATUS_DRAFT_CREATED] Story draft success. Real ID:', realStory.id);

      // Replace temp story with real draft story containing preview URL in local state
      setStories(prev => prev.map(s => s.id === tempId ? { ...realStory, media_url: localPreviewUrl } : s));

      if (file) {
        uploadStoryMediaFlow(realStory.id, file, tempId);
      } else {
        const finalizeRes = await finalizeStoryMedia(realStory.id, {
          media_type: 'text'
        });
        if (finalizeRes.success && finalizeRes.story) {
          setStories(prev => prev.map(s => s.id === tempId ? finalizeRes.story : s));
        }
      }
    } catch (err) {
      console.error('[STATUS_DRAFT_FAILED]', err);
      setStories(prev => prev.map(s => s.id === tempId ? { ...tempStory, status: 'upload_failed', upload_status: 'failed' } : s));
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

        {stories.map(story => {
          const isUploading = story.upload_status === 'uploading' || story.status === 'uploading';
          const isFailed = story.upload_status === 'failed' || story.status === 'upload_failed';

          return (
            <div key={story.id} className="snap-center shrink-0 w-24 flex flex-col items-center cursor-pointer relative" onClick={() => setActiveStory(story)}>
              <div className={`w-16 h-16 rounded-full border-2 p-0.5 mb-1.5 relative overflow-hidden ${isFailed ? 'border-red-500 bg-red-50' : isUploading ? 'border-amber-400 animate-pulse bg-amber-50' : 'border-blue-500'}`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  {story.author?.avatar_url ? (
                    <img src={story.author.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 font-bold uppercase">{story.author?.name?.charAt(0) || '?'}</div>
                  )}
                </div>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-slate-700 truncate w-full text-center">
                {isUploading ? 'Mengunggah...' : isFailed ? 'Gagal upload' : (story.author?.name?.split(' ')[0] || 'User')}
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

      {activeStory && (
        <StoryViewerModal 
          story={activeStory}
          user={user}
          onClose={() => setActiveStory(null)}
          onDelete={async () => {
            await supabase.from('social_stories').delete().eq('id', activeStory.id);
            setActiveStory(null);
            fetchStories();
          }}
          onRetryStory={handleRetryStory}
        />
      )}
    </div>
  );
}

function StoryViewerModal({ 
  story, 
  user, 
  onClose, 
  onDelete, 
  onRetryStory 
}: { 
  story: any; 
  user: any; 
  onClose: () => void; 
  onDelete: () => void; 
  onRetryStory: (story: any) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const isOwner = user?.id === story.author_id;
  const isFailed = story.upload_status === 'failed' || story.status === 'upload_failed';
  const isUploading = story.upload_status === 'uploading' || story.status === 'uploading';
  const supabase = createClient();
  
  const getMediaSrc = (path: string) => {
    if (!path) return undefined;
    if (path.startsWith('blob:') || path.startsWith('http')) return path;
    return supabase.storage.from('posts').getPublicUrl(path).data.publicUrl;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col">
      <div className="p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
            {story.author?.avatar_url ? (
              <img src={story.author.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold uppercase">{story.author?.name?.charAt(0) || '?'}</div>
            )}
          </div>
          <div>
            <div className="text-white font-bold text-sm">{story.author?.name || 'Pengguna'}</div>
            <div className="text-white/60 text-xs">{new Date(story.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <button 
              onClick={async () => {
                setDeleting(true);
                await onDelete();
              }} 
              disabled={deleting}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-full disabled:opacity-50"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </button>
          )}
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10">
            <X className="w-6 h-6 text-white"/>
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0">
        <div className="w-full max-w-lg max-h-full flex flex-col items-center justify-center gap-6">
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
                    await onDelete();
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
              <span className="text-white text-sm font-bold">Sedang mengunggah media status...</span>
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
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(24);
  const [isDurationSheetOpen, setIsDurationSheetOpen] = useState(false);

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;
    
    if (selectedFile.type.startsWith('video/')) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        alert('Video terlalu besar. Maksimal 50MB / 60 detik untuk versi awal.');
        return;
      }
      
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(selectedFile);
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        if (video.duration > 60) {
          alert('Durasi video status maksimal 60 detik');
          return;
        }
        setFile(selectedFile);
      };
      video.onerror = () => {
        setFile(selectedFile);
      };
    } else if (selectedFile.type.startsWith('image/')) {
      // Local preview immediately - no blocking browser compression
      setFile(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (!content && !file) return;
    onStartStoryFlow(content, file, duration);
    onClose();
  };

  const durations = [
    { value: 6, label: '6 Jam' },
    { value: 12, label: '12 Jam' },
    { value: 24, label: '24 Jam' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Buat Status Baru</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500"/></button>
        </div>
        
        <div className="p-6">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Apa yang ingin Anda bagikan hari ini?"
            className="w-full h-24 bg-transparent outline-none resize-none text-lg text-slate-800 placeholder-slate-400"
            maxLength={200}
          />
          
          {file && (
            <div className="relative flex flex-col bg-slate-100 rounded-xl overflow-hidden mt-4 mb-4 border border-slate-200">
              <div className="relative h-40 w-full overflow-hidden bg-black flex items-center justify-center">
                {file.type.startsWith('video/') ? (
                  <video 
                    src={URL.createObjectURL(file)} 
                    muted 
                    playsInline 
                    preload="metadata" 
                    controls 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600 gap-3 pr-12">
                <span className="font-bold truncate max-w-[180px]" title={file.name}>{file.name}</span>
                <span className="shrink-0 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <button onClick={() => setFile(null)} className="absolute top-2 right-2 w-8 h-8 bg-slate-900/55 text-white rounded-full flex items-center justify-center hover:bg-slate-900 transition-colors backdrop-blur-sm"><X className="w-4 h-4"/></button>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer text-sm font-bold text-slate-700 transition-colors">
              <ImageIcon className="w-4 h-4 text-blue-500" /> Foto Galeri
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleFileChange(e.target.files[0])} />
            </label>
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer text-sm font-bold text-slate-700 transition-colors">
              <Camera className="w-4 h-4 text-blue-500" /> Ambil Foto
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files && handleFileChange(e.target.files[0])} />
            </label>
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer text-sm font-bold text-slate-700 transition-colors">
              <Video className="w-4 h-4 text-rose-500" /> Video Galeri
              <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files && handleFileChange(e.target.files[0])} />
            </label>
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer text-sm font-bold text-slate-700 transition-colors">
              <Video className="w-4 h-4 text-rose-500" /> Rekam Video
              <input type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => e.target.files && handleFileChange(e.target.files[0])} />
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsDurationSheetOpen(true)}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-full border border-slate-200 transition-all flex items-center gap-1 active:scale-95"
            >
              <span>Masa Aktif: {durations.find(d => d.value === duration)?.label}</span>
              <span className="text-[7px] opacity-60">▼</span>
            </button>
            
            <Button onClick={handleSubmit} disabled={(!content && !file)} className="bg-blue-600 hover:bg-blue-700 font-bold rounded-full px-6">
              Bagikan
            </Button>
          </div>
        </div>
      </div>

      <MobileBottomSheet
        isOpen={isDurationSheetOpen}
        onClose={() => setIsDurationSheetOpen(false)}
        title="Pilih Masa Aktif Status"
      >
        <div className="space-y-2">
          {durations.map(d => {
            const isSelected = duration === d.value;
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => {
                  setDuration(d.value);
                  setIsDurationSheetOpen(false);
                }}
                className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-between transition-all active:scale-98 text-left ${
                  isSelected 
                    ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200/55' 
                    : 'bg-slate-50 hover:bg-slate-100/80 text-slate-700 border border-transparent'
                }`}
              >
                <span className="text-sm font-bold">{d.label}</span>
                {isSelected && <span className="text-blue-600 font-extrabold">✓</span>}
              </button>
            );
          })}
        </div>
      </MobileBottomSheet>
    </div>
  );
}
