'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, X, Camera, Video, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveMediaUrl } from '@/lib/media/resolveMediaUrl';

export function StoriesTray({ user }: { user: any }) {
  const [stories, setStories] = useState<any[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
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
    
    if (data) setStories(data);
    setLoading(false);
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

        {stories.map(story => (
          <div key={story.id} className="snap-center shrink-0 w-24 flex flex-col items-center cursor-pointer" onClick={() => setActiveStory(story)}>
            <div className="w-16 h-16 rounded-full border-2 border-blue-500 p-0.5 mb-1.5 relative overflow-hidden">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                {story.author?.avatar_url ? (
                  <img src={story.author.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 font-bold uppercase">{story.author?.name?.charAt(0) || '?'}</div>
                )}
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-slate-700 truncate w-full text-center">{story.author?.name?.split(' ')[0] || 'User'}</span>
          </div>
        ))}
      </div>

      {isComposerOpen && (
        <StoryComposerModal 
          user={user} 
          onClose={() => setIsComposerOpen(false)} 
          onSuccess={() => {
            setIsComposerOpen(false);
            fetchStories();
          }} 
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
        />
      )}
    </div>
  );
}

function StoryViewerModal({ story, user, onClose, onDelete }: { story: any, user: any, onClose: () => void, onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const isOwner = user?.id === story.author_id;
  const supabase = createClient();
  
  const getMediaSrc = (path: string) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
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
      
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="w-full max-w-lg max-h-full flex flex-col items-center justify-center gap-6">
          {story.media_url && (
            <div className="w-full max-h-[70vh] rounded-2xl overflow-hidden flex items-center justify-center bg-black/50">
              {story.media_type === 'video' ? (
                <video src={getMediaSrc(story.media_url)} controls preload="metadata" playsInline className="max-w-full max-h-full object-contain" />
              ) : (
                <img src={getMediaSrc(story.media_url)} alt="" className="max-w-full max-h-full object-contain" />
              )}
            </div>
          )}
          
          {story.content && (
            <div className={`w-full p-6 text-center text-white ${!story.media_url ? 'text-2xl sm:text-4xl font-bold px-8' : 'text-lg'}`}>
              {story.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { compressImage } from '@/lib/media/compressImage';

function StoryComposerModal({ user, onClose, onSuccess }: { user: any, onClose: () => void, onSuccess: () => void }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(24);
  const [submitting, setSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const supabase = createClient();

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;
    
    if (selectedFile.type.startsWith('video/')) {
      if (selectedFile.size > 30 * 1024 * 1024) {
        alert('Ukuran video maksimal 30MB');
        return;
      }
      
      setIsCompressing(true);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(selectedFile);
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        setIsCompressing(false);
        if (video.duration > 30) {
          alert('Durasi video story maksimal 30 detik');
          return;
        }
        setFile(selectedFile);
      };
      video.onerror = () => {
        setIsCompressing(false);
        setFile(selectedFile);
      };
    } else if (selectedFile.type.startsWith('image/')) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(selectedFile, { maxWidth: 1600, maxHeight: 1600, quality: 0.75 });
        setFile(compressed);
      } catch (err) {
        setFile(selectedFile);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!content && !file) return;
    setSubmitting(true);
    
    let mediaUrl = null;
    let mediaType = 'text';

    if (file) {
      const isVideo = file.type.startsWith('video/');
      mediaType = isVideo ? 'video' : 'image';
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('posts') // using existing posts bucket for stories MVP
        .upload(fileName, file);
        
      if (data) {
        mediaUrl = data.path;
      }
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + duration);

    await supabase.from('social_stories').insert({
      author_id: user.id,
      content,
      media_url: mediaUrl,
      media_type: mediaType,
      expires_at: expiresAt.toISOString()
    });

    setSubmitting(false);
    onSuccess();
  };

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
              <div className="relative h-40 w-full overflow-hidden">
                {file.type.startsWith('video/') ? (
                  <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
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
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="text-sm font-bold text-slate-600 bg-transparent outline-none">
              <option value={6}>6 Jam</option>
              <option value={12}>12 Jam</option>
              <option value={24}>24 Jam</option>
            </select>
            
            <Button onClick={handleSubmit} disabled={submitting || isCompressing || (!content && !file)} className="bg-blue-600 hover:bg-blue-700 font-bold rounded-full px-6">
              {(submitting || isCompressing) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {submitting ? 'Membagikan...' : isCompressing ? 'Memproses...' : 'Bagikan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
