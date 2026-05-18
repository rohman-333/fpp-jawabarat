'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, BadgeCheck, Store, Gift, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { getProfileUrl } from '@/lib/routes/profile';

import { FollowButton } from './FollowButton';
import { CommentBox } from './CommentBox';
import { toggleSave, hidePost, deletePost, setReaction, removeReaction } from '@/app/(social)/feed/actions';
import { getDisplayRole } from '@/lib/auth/roles';
import { ReportPostDialog } from './ReportPostDialog';
import { Flag, EyeOff, Link as LinkIcon, X } from 'lucide-react';

export function FeedCard({ post, currentUser }: { post: any, currentUser?: any }) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: id });
  
  const currentUserId = currentUser?.id;
  const myReactionObj = post.reactions?.find((r: any) => r.user_id === currentUserId);
  const initialReaction = myReactionObj ? myReactionObj.reaction_type : (post.has_liked ? 'like' : null);
  
  const [currentReaction, setCurrentReaction] = useState<string | null>(initialReaction);
  const [reactionsCount, setReactionsCount] = useState(Math.max(post.reactions?.length || 0, post.likes_count?.[0]?.count || 0));

  const getReactionSummary = () => {
    if (!post.reactions || post.reactions.length === 0) return null;
    const counts: Record<string, number> = {};
    post.reactions.forEach((r: any) => {
      counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  };
  const reactionSummary = getReactionSummary();

  const [isSaved, setIsSaved] = useState(post.has_saved || false);
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareText, setShareText] = useState('Bagikan');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  let reactionTimeout: NodeJS.Timeout;

  const REACTION_EMOJIS: Record<string, string> = {
    like: '👍',
    love: '❤️',
    haha: '😆',
    wow: '😮',
    sad: '😢',
    angry: '😡',
    pray: '🤲'
  };

  if (isHidden) return null;

  const handleToggleLike = async () => {
    if (!currentUserId || isLiking) return;
    if (currentReaction) {
      await handleRemoveReaction();
    } else {
      await handleSetReaction('like');
    }
  };

  const handleSetReaction = async (type: string) => {
    if (!currentUserId || isLiking) return;
    setIsLiking(true);
    setShowReactionPicker(false);
    
    const prev = currentReaction;
    setCurrentReaction(type);
    if (!prev) setReactionsCount((p: number) => p + 1);
    
    const res = await setReaction(post.id, type);
    if (res?.error) {
      setCurrentReaction(prev);
      if (!prev) setReactionsCount((p: number) => p - 1);
    }
    setIsLiking(false);
  };

  const handleRemoveReaction = async () => {
    if (!currentUserId || isLiking) return;
    setIsLiking(true);
    
    const prev = currentReaction;
    setCurrentReaction(null);
    setReactionsCount((p: number) => Math.max(0, p - 1));
    
    const res = await removeReaction(post.id);
    if (res?.error) {
      setCurrentReaction(prev);
      setReactionsCount((p: number) => p + 1);
    }
    setIsLiking(false);
  };

  const handleSave = async () => {
    if (!currentUserId || isSaving) return;
    setIsSaving(true);
    // Optimistic UI
    setIsSaved(!isSaved);
    
    const res = await toggleSave(post.id);
    if (res?.error) {
      // Revert on error
      setIsSaved(isSaved);
    }
    setIsSaving(false);
  };

  const handleShareOption = async (option: string) => {
    const url = `${window.location.origin}/post/${post.id}`;
    const title = post.content ? post.content.substring(0, 50) + '...' : 'Kabar FPP Jawabarat';
    
    setShowShareMenu(false);

    if (option === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setShareText('Tersalin!');
        setTimeout(() => setShareText('Bagikan'), 2000);
      } catch (err) {}
    } else if (option === 'wa') {
      window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
    } else if (option === 'fb') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (option === 'native') {
      try {
        await navigator.share({
          title: 'FPP Jawabarat',
          text: title,
          url: url
        });
      } catch (err) {}
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'kabar': return { label: 'Kabar', bg: 'bg-blue-50', text: 'text-blue-700' };
      case 'musyawarah': return { label: 'Musyawarah', bg: 'bg-purple-50', text: 'text-purple-700' };
      case 'kegiatan_santri': return { label: 'Kegiatan', bg: 'bg-orange-50', text: 'text-orange-700' };
      case 'dakwah': return { label: 'Dakwah', bg: 'bg-emerald-50', text: 'text-emerald-700' };
      case 'produk': return { label: 'Produk', bg: 'bg-yellow-50', text: 'text-yellow-700' };
      case 'program': return { label: 'Program', bg: 'bg-indigo-50', text: 'text-indigo-700' };
      case 'donasi': return { label: 'Donasi', bg: 'bg-rose-50', text: 'text-rose-700' };
      case 'berita': return { label: 'Berita', bg: 'bg-slate-100', text: 'text-slate-800' };
      default: return { label: type, bg: 'bg-slate-50', text: 'text-slate-700' };
    }
  };

  const badge = getTypeLabel(post.type);

  const authorUrl = getProfileUrl({ id: post.author_id, username: post.author?.username });
  const followersCount = post.author?.followers?.[0]?.count || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4 relative">
      {/* Post Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href={authorUrl} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
            {post.author?.avatar_url ? (
              <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <span className="font-bold text-slate-400 uppercase text-sm sm:text-base">
                {(post.author?.name || 'U').charAt(0)}
              </span>
            )}
          </Link>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Link href={authorUrl} className="font-bold text-slate-800 text-[15px] hover:underline hover:text-emerald-600 transition-colors flex items-center gap-1">
                {post.author?.name || 'User'}
                {post.author?.is_verified && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
              </Link>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
              {currentUserId && currentUserId !== post.author_id && (
                <div className="hidden sm:block ml-1">
                  <FollowButton targetUserId={post.author_id} isFollowingInitial={post.author_followed} />
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {getDisplayRole(post.author)} • {followersCount} Pengikut • {timeAgo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          {currentUserId && currentUserId !== post.author_id && (
            <div className="sm:hidden">
              <FollowButton targetUserId={post.author_id} isFollowingInitial={post.author_followed} />
            </div>
          )}
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors shrink-0"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-[98]" onClick={() => setShowMenu(false)}></div>
              <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-[99] overflow-hidden py-1">
                <button 
                  onClick={() => {
                    handleShareOption('copy');
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                >
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  Salin Link
                </button>
                
                {currentUserId && (
                  <>
                    {(currentUserId === post.author_id || ['superadmin', 'admin', 'team'].includes(currentUser?.role)) && (
                      <button 
                        onClick={async () => {
                          if (!confirm('Apakah Anda yakin ingin menghapus postingan ini?')) return;
                          setShowMenu(false);
                          const res = await deletePost(post.id);
                          if (!res?.error) setIsHidden(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                        Hapus Postingan
                      </button>
                    )}
                    {currentUserId !== post.author_id && (
                      <>
                        <button 
                          onClick={async () => {
                            setShowMenu(false);
                            const res = await hidePost(post.id);
                            if (!res?.error) setIsHidden(true);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                        >
                          <EyeOff className="w-4 h-4 text-slate-400" />
                          Sembunyikan dari Feed
                        </button>
                        <button 
                          onClick={() => {
                            setShowMenu(false);
                            setShowReportDialog(true);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <Flag className="w-4 h-4 text-red-500" />
                          Laporkan Postingan
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-slate-700 whitespace-pre-wrap text-[15px] sm:text-base leading-relaxed break-words">
          {post.content ? (
            post.content.split(/(@[a-zA-Z0-9_.-]+)/g).map((part: string, i: number) => {
              if (part.startsWith('@') && part.length > 1) {
                const username = part.substring(1);
                return (
                  <Link key={i} href={`/u/${username}`} className="text-emerald-600 font-semibold hover:underline">
                    {part}
                  </Link>
                );
              }
              return <span key={i}>{part}</span>;
            })
          ) : null}
        </p>
      </div>

      {/* Embedded References Preview */}
      {post.product_id && (
        <div className="mx-4 mb-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-3 hover:bg-emerald-50 transition-colors cursor-pointer">
          <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-emerald-900 text-sm truncate">Tautan Produk Tersedia</p>
            <p className="text-xs text-emerald-600/80 truncate">Ketuk untuk melihat detail produk di Marketplace</p>
          </div>
        </div>
      )}

      {/* Post Media */}
      {post.image_url && post.media_type !== 'video' && (
        <div className="w-full border-t border-b border-slate-100 bg-slate-50">
          <img src={post.image_url} alt="Post Attachment" className="w-full max-h-[500px] object-contain sm:object-cover" loading="lazy" decoding="async" />
        </div>
      )}

      {post.video_url && (
        <div className="w-full border-t border-b border-slate-100 bg-black flex justify-center">
          <video src={post.video_url} controls playsInline preload="metadata" className="w-full max-h-[500px] object-contain"></video>
        </div>
      )}

      {/* Post Stats/Actions */}
      <div className="px-2 sm:px-4 py-2 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-1 sm:gap-2 relative">
          
          <div 
            className="relative"
            onMouseEnter={() => {
              reactionTimeout = setTimeout(() => setShowReactionPicker(true), 300);
            }}
            onMouseLeave={() => {
              clearTimeout(reactionTimeout);
              setTimeout(() => setShowReactionPicker(false), 200);
            }}
          >
            <button 
              onClick={handleToggleLike}
              disabled={isLiking}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all group ${currentReaction ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
            >
              {currentReaction ? (
                <span className="text-lg group-active:scale-90 transition-transform">{REACTION_EMOJIS[currentReaction]}</span>
              ) : (
                <Heart className={`w-5 h-5 group-active:scale-90 transition-transform ${currentReaction ? 'fill-current' : ''}`} />
              )}
              <span className="text-xs font-bold">{reactionsCount}</span>
              {reactionSummary && reactionSummary.length > 0 && (
                <div className="hidden sm:flex ml-1 -space-x-1">
                  {reactionSummary.map(([type]) => (
                    <span key={type} className="text-[10px]">{REACTION_EMOJIS[type]}</span>
                  ))}
                </div>
              )}
            </button>

            {/* Reaction Picker */}
            {showReactionPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-xl border border-slate-200 p-1 flex gap-1 z-50 animate-in fade-in slide-in-from-bottom-2">
                {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                  <button
                    key={type}
                    onClick={() => handleSetReaction(type)}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded-full hover:scale-125 transition-all"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all group ${showComments ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-500 hover:bg-blue-50'}`}
          >
            <MessageCircle className={`w-5 h-5 group-active:scale-90 transition-transform ${showComments ? 'fill-blue-100' : ''}`} />
            <span className="text-xs font-bold">{post.comments_count?.[0]?.count || 0}</span>
          </button>

          <button 
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all group relative"
          >
            <Share2 className="w-5 h-5 group-active:scale-90 transition-transform" />
            <span className="text-xs font-bold hidden sm:inline">{shareText}</span>
          </button>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all group ${isSaved ? 'text-yellow-600 bg-yellow-50' : 'text-slate-500 hover:text-yellow-600 hover:bg-yellow-50'}`}
        >
          <Bookmark className={`w-5 h-5 group-active:scale-90 transition-transform ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Share Menu */}
      {showShareMenu && (
        <div className="absolute z-50 bottom-16 right-4 sm:left-40 bg-white border border-slate-200 rounded-xl shadow-lg p-2 w-48 text-sm flex flex-col">
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button onClick={() => handleShareOption('native')} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-left text-slate-700">
              <Share2 className="w-4 h-4 text-emerald-600" /> Share via OS
            </button>
          )}
          <button onClick={() => handleShareOption('wa')} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-left text-slate-700">
            <span className="text-emerald-500 font-bold ml-1">W</span> WhatsApp
          </button>
          <button onClick={() => handleShareOption('fb')} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-left text-slate-700">
            <span className="text-blue-600 font-bold ml-1">f</span> Facebook
          </button>
          <button onClick={() => handleShareOption('copy')} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-left text-slate-700">
            <Bookmark className="w-4 h-4" /> Salin Link
          </button>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-slate-100 bg-slate-50/30 p-4">
          <CommentBox postId={post.id} currentUserId={currentUserId} />
        </div>
      )}

      {currentUserId && (
        <ReportPostDialog 
          isOpen={showReportDialog} 
          onClose={() => setShowReportDialog(false)} 
          postId={post.id} 
          currentUserId={currentUserId} 
        />
      )}
    </div>
  );
}
