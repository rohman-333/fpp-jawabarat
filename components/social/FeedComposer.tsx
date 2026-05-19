'use client';

import { useState, useRef } from 'react';
import { Image as ImageIcon, Send, X, Loader2 } from 'lucide-react';
import { createPost } from '@/app/(social)/feed/actions';
import { uploadPostImage } from '@/lib/supabase/storage';

export function FeedComposer({ user }: { user: any }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('kabar');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran gambar maksimal 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      if (imageFile) {
        const { url, error } = await uploadPostImage(imageFile, user.id);
        if (error) throw new Error(error);
        imageUrl = url;
      }

      const formData = new FormData();
      formData.append('content', content);
      formData.append('post_type', type);
      if (imageUrl) formData.append('image_url', imageUrl);
      
      await createPost(formData);
      
      setContent('');
      removeImage();
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
    { id: 'kegiatan', label: 'Kegiatan Santri' },
    { id: 'dakwah', label: 'Dakwah' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold uppercase text-sm">
                {(user?.user_metadata?.name || user?.email || 'U').charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bagikan kabar atau ilmu hari ini..."
              className="w-full min-h-[80px] bg-transparent border-0 focus:ring-0 resize-none outline-none text-slate-800 placeholder-slate-400 text-lg"
            />
            
            {imagePreview && (
              <div className="relative mb-3 inline-block rounded-xl overflow-hidden border border-slate-200">
                <img src={imagePreview} alt="Preview" className="max-h-64 object-contain" />
                <button 
                  type="button" 
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
              <div className="flex items-center gap-2">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="bg-slate-50 text-slate-600 text-xs font-bold px-3 py-2 rounded-full outline-none cursor-pointer border border-slate-200"
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>

                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" 
                  title="Lampirkan Gambar"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && !imageFile)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-full flex items-center gap-2 transition-colors disabled:opacity-50"
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
