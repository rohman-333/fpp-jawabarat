'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, X, Camera, Video, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveMediaUrl } from '@/lib/media/resolveMediaUrl';

export function StoriesTray({ user }: { user: any }) {
  const [stories, setStories] = useState<any[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
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
      .order('created_at', { ascending: false });
    
    if (data) setStories(data);
    setLoading(false);
  };

  return (
    <div className="mb-6">
      <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 snap-x snap-mandatory">
        <div className="snap-center shrink-0 w-24 flex flex-col items-center cursor-pointer" onClick={() => setIsComposerOpen(true)}>
          <div className="w-16 h-16 rounded-full border-2 border-slate-200 p-0.5 relative mb-1.5 bg-slate-50 flex items-center justify-center">
            <Plus className="w-6 h-6 text-slate-400" />
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700">Buat Status</span>
        </div>

        {stories.map(story => (
          <div key={story.id} className="snap-center shrink-0 w-24 flex flex-col items-center cursor-pointer" onClick={() => alert('Fitur lihat story akan datang')}>
            <div className="w-16 h-16 rounded-full border-2 border-emerald-500 p-0.5 mb-1.5 relative overflow-hidden">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                {story.author?.avatar_url ? (
                  <img src={story.author.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 font-bold uppercase">{story.author?.name?.charAt(0)}</div>
                )}
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-slate-700 truncate w-full text-center">{story.author?.name?.split(' ')[0]}</span>
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
    </div>
  );
}

function StoryComposerModal({ user, onClose, onSuccess }: { user: any, onClose: () => void, onSuccess: () => void }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(24);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

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
            <div className="relative h-40 bg-slate-100 rounded-xl overflow-hidden mt-4 mb-4">
              {file.type.startsWith('video/') ? (
                <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
              ) : (
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
              )}
              <button onClick={() => setFile(null)} className="absolute top-2 right-2 w-8 h-8 bg-slate-900/50 text-white rounded-full flex items-center justify-center hover:bg-slate-900"><X className="w-4 h-4"/></button>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer text-sm font-bold text-slate-700 transition-colors">
              <ImageIcon className="w-4 h-4 text-blue-500" /> Galeri
              <input type="file" accept="image/*,video/*" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
            </label>
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer text-sm font-bold text-slate-700 transition-colors">
              <Camera className="w-4 h-4 text-emerald-500" /> Kamera
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
            </label>
            <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer text-sm font-bold text-slate-700 transition-colors">
              <Video className="w-4 h-4 text-rose-500" /> Video
              <input type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="text-sm font-bold text-slate-600 bg-transparent outline-none">
              <option value={6}>6 Jam</option>
              <option value={12}>12 Jam</option>
              <option value={24}>24 Jam</option>
            </select>
            
            <Button onClick={handleSubmit} disabled={submitting || (!content && !file)} className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-full px-6">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Bagikan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
