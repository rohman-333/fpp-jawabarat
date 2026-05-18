'use client';

import { useState, useRef } from 'react';
import { Image as ImageIcon, Send, X, Loader2 } from 'lucide-react';
import { createPost } from '@/app/(social)/feed/actions';
import { uploadPostImage } from '@/lib/supabase/storage';

import TextareaAutosize from 'react-textarea-autosize';
import dynamic from 'next/dynamic';
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

import { uploadSocialVideo } from '@/lib/supabase/storage';
import { Video, Smile } from 'lucide-react';

export function CreatePostComposer({ user, onSuccess }: { user: any, onSuccess?: () => void }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('kabar');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'image' && file.size > 5 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 5MB');
        return;
      }
      if (type === 'video' && file.size > 30 * 1024 * 1024) {
        alert('Ukuran video maksimal 30MB');
        return;
      }
      setMediaFile(file);
      setMediaType(type);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const onEmojiClick = (emojiObject: any) => {
    setContent(prev => prev + emojiObject.emoji);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      let videoUrl = null;
      
      if (mediaFile) {
        if (mediaType === 'image') {
          const { url, error } = await uploadPostImage(mediaFile, user.id);
          if (error) throw new Error(error);
          imageUrl = url;
        } else if (mediaType === 'video') {
          const { url, error } = await uploadSocialVideo(mediaFile, user.id);
          if (error) throw new Error(error);
          videoUrl = url;
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
      
      await createPost(formData);
      
      setContent('');
      removeMedia();
      setShowEmoji(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      alert('Gagal memposting. Silakan coba lagi.');
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 relative">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase text-sm">
                {(user?.user_metadata?.name || user?.email || 'U').charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <TextareaAutosize
              minRows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Apa kabar hari ini?"
              className="w-full min-h-[60px] bg-transparent border-0 focus:ring-0 resize-none outline-none text-slate-800 placeholder-slate-400 text-lg sm:text-base pt-2"
            />
            
            {mediaPreview && (
              <div className="relative mb-3 inline-block rounded-xl overflow-hidden border border-slate-200 bg-slate-50 w-full sm:w-auto">
                {mediaType === 'image' ? (
                  <img src={mediaPreview} alt="Preview" className="max-h-[220px] w-full sm:w-auto object-cover sm:object-contain" />
                ) : (
                  <video src={mediaPreview} controls playsInline preload="metadata" className="max-h-[220px] w-full sm:w-auto object-cover sm:object-contain"></video>
                )}
                <button 
                  type="button" 
                  onClick={removeMedia}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
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
            
            <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 mt-2 gap-3 relative">
              <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-2 rounded-full outline-none cursor-pointer border border-slate-200 transition-colors sm:flex-none appearance-none pr-8 relative"
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>

                <button 
                  type="button" 
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="p-2 text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors flex-shrink-0 ml-1" 
                  title="Emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  ref={fileInputRef} 
                  onChange={(e) => handleMediaChange(e, 'image')} 
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors flex-shrink-0" 
                  title="Lampirkan Gambar"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                
                <input 
                  type="file" 
                  accept="video/mp4,video/webm,video/quicktime" 
                  ref={videoInputRef} 
                  onChange={(e) => handleMediaChange(e, 'video')} 
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={() => videoInputRef.current?.click()}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0" 
                  title="Lampirkan Video"
                >
                  <Video className="w-5 h-5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && !mediaFile)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-full flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Posting
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
