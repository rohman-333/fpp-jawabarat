'use client';

import { useState, useEffect } from 'react';
import { Send, Loader2, Trash2, BadgeCheck, Smile, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createComment, deleteComment as deleteCommentAction } from '@/app/(social)/feed/actions';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { getProfileUrl } from '@/lib/routes/profile';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

export function CommentBox({ postId, currentUserId }: { postId: string, currentUserId?: string }) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchComments() {
      const { data } = await supabase
        .from('social_comments')
        .select(`
          *,
          profiles:author_id(name, avatar_url, role, has_pesantren, is_seller, seller_status, is_courier, courier_status, team_division, is_verified)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (data) setComments(data);
      setIsLoading(false);
    }
    fetchComments();
  }, [postId, supabase]);

  const onEmojiClick = (emojiObject: any) => {
    setComment(prev => prev + emojiObject.emoji);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    const res = await createComment(postId, comment);
    
    if (res?.success && res.comment) {
      setComments(prev => [...prev, res.comment]);
      setComment('');
      setShowEmoji(false);
    } else if (res?.error) {
      alert(res.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Hapus komentar ini?')) return;
    const res = await deleteCommentAction(commentId);
    if (res?.success) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    } else if (res?.error) {
      alert(res.error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-2"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-center text-slate-400 italic py-2">Belum ada komentar. Jadilah yang pertama!</p>
        ) : (
          comments.map(c => {
            const userUrl = getProfileUrl({ id: c.author_id, username: c.profiles?.username });
            return (
            <div key={c.id} className="flex gap-2 group">
              <Link href={userUrl} className="w-7 h-7 rounded-full bg-slate-200 shrink-0 overflow-hidden border border-slate-300 flex items-center justify-center">
                {c.profiles?.avatar_url ? (
                  <img src={c.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{(c.profiles?.name || 'U').charAt(0)}</span>
                )}
              </Link>
              <div className="flex-1">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-3 py-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Link href={userUrl} className="font-bold text-slate-800 text-[13px] hover:underline">
                      {c.profiles?.name || 'User'}
                    </Link>
                    {c.profiles?.is_verified && <BadgeCheck className="w-3 h-3 text-blue-500" />}
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.content}</p>
                </div>
                <div className="flex items-center gap-3 px-2 mt-1">
                  <span className="text-[10px] text-slate-400">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: id })}
                  </span>
                  {(currentUserId === c.author_id) && (
                    <button onClick={() => handleDelete(c.id)} className="text-[10px] font-bold text-red-500/70 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* Comment Form */}
      {currentUserId && (
        <div className="flex items-start gap-2 mt-2 relative">
          <form onSubmit={handleSubmit} className="flex-1 relative flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <button 
              type="button" 
              onClick={() => setShowEmoji(!showEmoji)}
              className="p-3 text-slate-400 hover:text-yellow-500 transition-colors"
            >
              <Smile className="w-4 h-4" />
            </button>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tulis komentar..."
              className="flex-1 min-h-[44px] max-h-[120px] py-3 text-sm focus:outline-none resize-none bg-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="p-2 mr-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:bg-slate-300"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          {showEmoji && (
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setShowEmoji(false)}></div>
              <div className="fixed sm:absolute bottom-4 left-4 right-4 sm:bottom-full sm:right-0 sm:left-auto sm:mb-2 z-[9999] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden sm:w-[340px]">
                <div className="flex justify-between items-center p-3 border-b sm:hidden bg-slate-50">
                  <span className="font-bold text-slate-700 text-sm">Pilih Emoji</span>
                  <button type="button" onClick={() => setShowEmoji(false)} className="p-1 bg-slate-200 rounded-full text-slate-600"><X className="w-4 h-4" /></button>
                </div>
                <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={380} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
