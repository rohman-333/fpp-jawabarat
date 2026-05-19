'use client';

import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Send, X, Loader2 } from 'lucide-react';
import { createPost } from '@/app/(social)/feed/actions';
import { uploadPostImage } from '@/lib/supabase/storage';

import TextareaAutosize from 'react-textarea-autosize';
import dynamic from 'next/dynamic';
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { 
  ssr: false,
  loading: () => <div className="p-4 text-center text-sm text-slate-500">Memuat emoji...</div>
});

import { uploadSocialVideo } from '@/lib/supabase/storage';
import { Video, Smile, Camera, ImagePlus, FileVideo, Globe, ArrowLeft, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { compressImage } from '@/lib/media/compressImage';
import { MobileBottomSheet } from '@/components/shared/MobileBottomSheet';

export function CreatePostComposer({ user, onSuccess }: { user: any, onSuccess?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [content, setContent] = useState('');
  const [type, setType] = useState('kabar');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [showMediaOptionsSheet, setShowMediaOptionsSheet] = useState(false);
  const [originalName, setOriginalName] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams && searchParams.get('compose') === 'true') {
      setIsExpanded(true);
      // Clean query parameter from address bar
      const newUrl = window.location.pathname;
      window.history.replaceState({ ...window.history.state }, '', newUrl);
    }
  }, [searchParams]);

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'image') => {
    const file = e.target.files?.[0];
    setShowMediaOptionsSheet(false);
    if (file) {
      setOriginalName(file.name);
      setOriginalSize(file.size);

      if (type === 'video') {
        if (file.size > 30 * 1024 * 1024) {
          alert('Ukuran video maksimal 30MB');
          setOriginalName(null);
          setOriginalSize(null);
          return;
        }
        
        setIsCompressing(true);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          setIsCompressing(false);
          if (video.duration > 60) {
            alert('Durasi video postingan maksimal 60 detik');
            if (videoInputRef.current) videoInputRef.current.value = '';
            if (cameraVideoInputRef.current) cameraVideoInputRef.current.value = '';
            setOriginalName(null);
            setOriginalSize(null);
            return;
          }
          setMediaFile(file);
          setMediaType('video');
          setMediaPreview(URL.createObjectURL(file));
        };
        video.onerror = () => {
          setIsCompressing(false);
          setMediaFile(file);
          setMediaType('video');
          setMediaPreview(URL.createObjectURL(file));
        };
      } else if (type === 'image') {
        setIsCompressing(true);
        try {
          const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.75 });
          setMediaFile(compressed);
          setMediaType('image');
          setMediaPreview(URL.createObjectURL(compressed));
        } catch (err) {
          console.error('Compression error:', err);
          setMediaFile(file);
          setMediaType('image');
          setMediaPreview(URL.createObjectURL(file));
        } finally {
          setIsCompressing(false);
        }
      }
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setOriginalName(null);
    setOriginalSize(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (cameraVideoInputRef.current) cameraVideoInputRef.current.value = '';
  };

  const onEmojiClick = (emojiObject: any) => {
    setContent(prev => prev + emojiObject.emoji);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && !mediaFile) return;
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      let videoUrl = null;
      
      if (mediaFile) {
        if (mediaType === 'image') {
          const { url, error } = await uploadPostImage(mediaFile, user.id);
          if (error) {
            console.error('[UPLOAD_IMAGE_ERROR]', error);
            alert('Gagal mengunggah gambar: ' + error + '. Silakan klik Posting untuk mencoba kembali.');
            setIsSubmitting(false);
            return;
          } else {
            imageUrl = url;
          }
        } else if (mediaType === 'video') {
          const { url, error } = await uploadSocialVideo(mediaFile, user.id);
          if (error) {
            console.error('[UPLOAD_VIDEO_ERROR]', error);
            alert('Gagal mengunggah video: ' + error + '. Silakan klik Posting untuk mencoba kembali.');
            setIsSubmitting(false);
            return;
          } else {
            videoUrl = url;
          }
        }
      }

      const formData = new FormData();
      formData.append('content', content);
      formData.append('type', type);
      if (imageUrl) formData.append('image_url', imageUrl);
      if (videoUrl) {
        formData.append('video_url', videoUrl);
        formData.append('media_type', 'video');
      }
      
      const res = await createPost(formData);
      
      if (res?.error) {
        console.error('[CREATE_POST_CLIENT_ERROR]', res.error);
        alert('Gagal memposting: ' + res.error);
      } else {
        setContent('');
        removeMedia();
        setShowEmoji(false);
        setIsExpanded(false);
        if (onSuccess) onSuccess();
        router.refresh();
      }
    } catch (err) {
      console.error('[CREATE_POST_CLIENT_EXCEPTION]', err);
      alert('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const types = [
    { id: 'kabar', label: 'Kabar Pesantren' },
    { id: 'musyawarah', label: 'Musyawarah' },
    { id: 'kegiatan_santri', label: 'Kegiatan Santri' },
    { id: 'berita', label: 'Berita' },
    { id: 'dakwah', label: 'Dakwah' },
    { id: 'produk', label: 'Promosi Produk' },
    { id: 'program', label: 'Program Baru' },
    { id: 'donasi', label: 'Galang Donasi' },
  ];

  // Prevent background scrolling when composer is full screen on mobile
  useEffect(() => {
    if (isExpanded) {
      const checkMobile = () => {
        if (window.innerWidth < 768) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      };
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('resize', checkMobile);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isExpanded]);

  // Render Collapsed State
  if (!isExpanded) {
    return (
      <div 
        onClick={() => setIsExpanded(true)}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 cursor-pointer hover:bg-slate-50/50 transition-all flex items-center gap-3 active:scale-[0.99] group"
      >
        <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase text-sm">
              {(user?.user_metadata?.name || user?.email || 'U').charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 bg-slate-50 group-hover:bg-slate-100/80 text-slate-400 rounded-full px-5 py-2.5 text-xs sm:text-sm font-medium transition-colors border border-slate-100 truncate">
          Apa kabar hari ini?
        </div>
        <button type="button" className="p-2.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors flex-shrink-0">
          <ImagePlus className="w-4.5 h-4.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`
      bg-white relative
      ${isExpanded 
        ? 'fixed inset-0 z-[99] flex flex-col w-full max-w-full h-full max-h-full bg-white overflow-y-auto rounded-none border-0 p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))] px-4' 
        : 'rounded-2xl shadow-sm border border-slate-200 p-4 mb-6'
      }
      md:relative md:inset-auto md:z-0 md:rounded-2xl md:shadow-sm md:border md:h-auto md:p-4 md:mb-6
    `}>
      {/* Mobile Fullscreen Header */}
      {isExpanded && (
        <div className="md:hidden flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
          <button 
            type="button" 
            onClick={() => setIsExpanded(false)}
            className="p-1 text-slate-500 hover:text-slate-800 flex items-center gap-1 focus:outline-none"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-slate-800 text-sm">Buat Postingan</span>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || isCompressing || (!content.trim() && !mediaFile)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-full text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Posting'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 md:block">
        <div className="flex gap-4 flex-1 min-h-0 md:block md:space-y-4">
          <div className="flex gap-3 items-center mb-1 shrink-0">
            <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase text-sm">
                  {(user?.user_metadata?.name || user?.email || 'U').charAt(0)}
                </div>
              )}
            </div>
            
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-sm leading-tight">{user?.user_metadata?.name || 'Pengguna'}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => setIsCategorySheetOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full transition-all flex items-center gap-1 active:scale-95"
                >
                  <span>{types.find(t => t.id === type)?.label || 'Kategori'}</span>
                  <span className="text-[7px] opacity-60">▼</span>
                </button>
                <div className="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" />
                  <span>Publik</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 md:block">
            {/* Scrollable compose body in mobile */}
            <div className="flex-1 overflow-y-auto min-h-0 md:overflow-visible">
              <TextareaAutosize
                minRows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Apa kabar pesantren hari ini? Bagikan cerita Anda..."
                className="w-full bg-transparent border-0 focus:ring-0 resize-none outline-none text-slate-800 placeholder-slate-400 text-base py-3 px-1 md:px-0"
              />

              {/* Compression Indicator */}
              {isCompressing && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-pulse">
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin text-blue-500" />
                  <span>Sedang mengompres gambar... Harap tunggu.</span>
                </div>
              )}

              {/* Uploading/Posting Indicator */}
              {isSubmitting && (
                <div className="mb-3 p-3 bg-blue-600 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-md">
                  <Loader2 className="w-4 h-4 shrink-0 animate-spin text-white" />
                  <span>{mediaFile ? 'Mengunggah media...' : 'Mengirim postingan...'} Harap jangan tutup aplikasi.</span>
                </div>
              )}

              {/* Large Video Warning */}
              {mediaType === 'video' && mediaFile && mediaFile.size > 10 * 1024 * 1024 && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Video cukup besar ({(mediaFile.size / (1024 * 1024)).toFixed(1)}MB), proses unggah dapat memakan waktu lebih lama.</span>
                </div>
              )}
              
              {mediaPreview && mediaFile && (
                <div className="relative mb-3 inline-flex flex-col rounded-xl overflow-hidden border border-slate-200 bg-slate-50 w-full sm:w-auto">
                  {mediaType === 'image' ? (
                    <img src={mediaPreview} alt="Preview" className="max-h-[220px] w-full sm:w-auto object-cover sm:object-contain" />
                  ) : (
                    <video src={mediaPreview} controls playsInline preload="metadata" className="max-h-[220px] w-full sm:w-auto object-cover sm:object-contain"></video>
                  )}
                  <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 gap-1.5 pr-12">
                    <span className="font-bold truncate max-w-[180px]" title={originalName || mediaFile.name}>{originalName || mediaFile.name}</span>
                    <div className="flex flex-wrap items-center gap-1.5 font-bold">
                      {originalSize && originalSize > mediaFile.size ? (
                        <>
                          <span className="line-through text-slate-400">{(originalSize / (1024 * 1024)).toFixed(2)} MB</span>
                          <span className="text-emerald-600 font-extrabold">→ {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB (Terkompresi)</span>
                        </>
                      ) : (
                        <span className="shrink-0 font-medium">{(mediaFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                      )}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={removeMedia}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="relative">
              {showEmoji && (
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setShowEmoji(false)}></div>
                  <div className="fixed sm:absolute bottom-4 left-4 right-4 sm:bottom-auto sm:left-0 sm:right-auto sm:top-full z-[9999] sm:mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden sm:w-[340px]">
                    <div className="flex justify-between items-center p-3 border-b sm:hidden bg-slate-50">
                      <span className="font-bold text-slate-700 text-sm">Pilih Emoji</span>
                      <button type="button" onClick={() => setShowEmoji(false)} className="p-1 bg-slate-200 rounded-full text-slate-600"><X className="w-4 h-4" /></button>
                    </div>
                    <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={380} />
                  </div>
                </>
              )}
            </div>
            
            {/* Action Bar (Footer) */}
            <div className="border-t border-slate-100 pt-3 mt-auto md:mt-2 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowMediaOptionsSheet(true)}
                  className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0" 
                  title="Lampirkan Media"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>

                <button 
                  type="button" 
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="p-2.5 text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors flex-shrink-0" 
                  title="Emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Hidden File Inputs */}
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={(e) => handleMediaChange(e, 'image')} 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  ref={cameraInputRef} 
                  onChange={(e) => handleMediaChange(e, 'image')} 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  accept="video/*" 
                  ref={videoInputRef} 
                  onChange={(e) => handleMediaChange(e, 'video')} 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  accept="video/*" 
                  capture="environment"
                  ref={cameraVideoInputRef} 
                  onChange={(e) => handleMediaChange(e, 'video')} 
                  className="hidden" 
                />
              </div>

              {/* Desktop Submit Button or Close for mobile overlay */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="hidden md:block text-slate-500 hover:text-slate-700 font-bold px-4 py-2 rounded-full text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isCompressing || (!content.trim() && !mediaFile)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-full flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {(isSubmitting || isCompressing) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSubmitting ? (mediaType === 'video' ? 'Mengunggah...' : 'Memposting...') : isCompressing ? 'Memproses...' : 'Posting'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Reusable Category Choice bottom sheet */}
      <MobileBottomSheet
        isOpen={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        title="Pilih Kategori Postingan"
      >
        <div className="space-y-2">
          {types.map(t => {
            const isSelected = type === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setType(t.id);
                  setIsCategorySheetOpen(false);
                }}
                className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-between transition-all active:scale-98 text-left ${
                  isSelected 
                    ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200/55' 
                    : 'bg-slate-50 hover:bg-slate-100/80 text-slate-700 border border-transparent'
                }`}
              >
                <span className="text-sm font-bold">{t.label}</span>
                {isSelected && <span className="text-blue-600 font-extrabold">✓</span>}
              </button>
            );
          })}
        </div>
      </MobileBottomSheet>

      {/* Reusable Media Choice bottom sheet */}
      <MobileBottomSheet
        isOpen={showMediaOptionsSheet}
        onClose={() => setShowMediaOptionsSheet(false)}
        title="Pilih Lampiran Media"
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setShowMediaOptionsSheet(false);
              fileInputRef.current?.click();
            }}
            className="w-full py-4 px-5 text-left bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center gap-4 transition-all text-slate-700 font-bold active:scale-98"
          >
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Foto dari Galeri</span>
              <span className="text-[11px] text-slate-400 font-normal mt-0.5">Pilih foto berkualitas tinggi dari ponsel Anda</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowMediaOptionsSheet(false);
              cameraInputRef.current?.click();
            }}
            className="w-full py-4 px-5 text-left bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center gap-4 transition-all text-slate-700 font-bold active:scale-98"
          >
            <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
              <Camera className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Ambil Foto Kamera</span>
              <span className="text-[11px] text-slate-400 font-normal mt-0.5">Gunakan kamera ponsel untuk mengambil foto langsung</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowMediaOptionsSheet(false);
              videoInputRef.current?.click();
            }}
            className="w-full py-4 px-5 text-left bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center gap-4 transition-all text-slate-700 font-bold active:scale-98"
          >
            <div className="p-3 bg-rose-100 rounded-full text-rose-600">
              <FileVideo className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Video dari Galeri</span>
              <span className="text-[11px] text-slate-400 font-normal mt-0.5">Unggah berkas video (maks. 60 detik / 30MB)</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowMediaOptionsSheet(false);
              cameraVideoInputRef.current?.click();
            }}
            className="w-full py-4 px-5 text-left bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center gap-4 transition-all text-slate-700 font-bold active:scale-98"
          >
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <Video className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800">Rekam Video</span>
              <span className="text-[11px] text-slate-400 font-normal mt-0.5">Gunakan kamera ponsel untuk merekam video langsung</span>
            </div>
          </button>
        </div>
      </MobileBottomSheet>
    </div>
  );
}
