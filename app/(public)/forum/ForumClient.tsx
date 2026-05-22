'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function ForumClient({ user }: { user: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateClick = () => {
    if (!user) {
      router.push('/auth/login?redirect=/forum');
      return;
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Judul dan isi diskusi wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Insert into forum_posts (active UI table)
      const { error: postsErr } = await supabase
        .from('forum_posts')
        .insert({
          author_id: user.id,
          title: title.trim(),
          content: content.trim(),
        });

      if (postsErr) {
        throw new Error(postsErr.message);
      }

      // 2. Safely insert into forum_discussions table as well
      await supabase
        .from('forum_discussions')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
        });

      setIsOpen(false);
      setTitle('');
      setContent('');
      router.refresh();
    } catch (err: any) {
      console.error('[SUBMIT_DISCUSSION_ERROR]', err);
      setError(err.message || 'Gagal membuat diskusi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleCreateClick}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Buat Diskusi
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Mulai Diskusi Baru
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Judul Diskusi</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masukkan judul diskusi Anda..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm font-medium transition-all"
                  maxLength={150}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Isi Diskusi</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tuliskan secara lengkap topik yang ingin Anda diskusikan..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-800 text-sm font-medium transition-all min-h-[140px]"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-100"
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 min-w-[120px]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Publikasikan'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
