'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, BadgeCheck, Store, Gift } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

import { FollowButton } from './FollowButton';
import { CommentBox } from './CommentBox';
import { toggleLike, toggleSave } from '@/app/(social)/feed/actions';

export function FeedCard({ post, currentUserId }: { post: any, currentUserId?: string }) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: id });
  
  const [isLiked, setIsLiked] = useState(post.has_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count?.[0]?.count || 0);
  const [isSaved, setIsSaved] = useState(post.has_saved || false);
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareText, setShareText] = useState('Bagikan');
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleLike = async () => {
    if (!currentUserId || isLiking) return;
    setIsLiking(true);
    // Optimistic UI
    setIsLiked(!isLiked);
    setLikesCount((prev: number) => isLiked ? prev - 1 : prev + 1);
    
    const res = await toggleLike(post.id);
    if (res?.error) {
      // Revert on error
      setIsLiked(isLiked);
      setLikesCount((prev: number) => isLiked ? prev + 1 : prev - 1);
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4 relative">
      {/* Post Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author_id}`} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-slate-400 uppercase text-sm sm:text-base">
                {(post.profiles?.name || 'U').charAt(0)}
              </span>
            )}
          </Link>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Link href={`/profile/${post.author_id}`} className="font-bold text-slate-800 text-[15px] hover:underline hover:text-emerald-600 transition-colors flex items-center gap-1">
                {post.profiles?.name || 'User'}
                {post.profiles?.is_verified && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
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
              {post.profiles?.account_type ? post.profiles.account_type.replace('_', ' ') : post.profiles?.role} • {timeAgo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentUserId && currentUserId !== post.author_id && (
            <div className="sm:hidden">
              <FollowButton targetUserId={post.author_id} isFollowingInitial={post.author_followed} />
            </div>
          )}
          <button className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors shrink-0">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-slate-700 whitespace-pre-wrap text-[15px] sm:text-base leading-relaxed">
          {post.content}
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
          <img src={post.image_url} alt="Post Attachment" className="w-full max-h-[500px] object-contain sm:object-cover" />
        </div>
      )}

      {post.video_url && (
        <div className="w-full border-t border-b border-slate-100 bg-black flex justify-center">
          <video src={post.video_url} controls playsInline preload="metadata" className="w-full max-h-[500px] object-contain"></video>
        </div>
      )}

      {/* Post Stats/Actions */}
      <div className="px-2 sm:px-4 py-2 flex items-center justify-between border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all group ${isLiked ? 'text-red-500 bg-red-50' : 'text-slate-500 hover:text-red-500 hover:bg-red-50'}`}
          >
            <Heart className={`w-5 h-5 group-active:scale-90 transition-transform ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs font-bold">{likesCount}</span>
          </button>
          
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
    </div>
  );
}
