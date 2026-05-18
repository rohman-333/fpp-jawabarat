'use client';

import { useState } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { toggleFollow as toggleFollowAction } from '@/app/(social)/feed/actions';

export function FollowButton({ targetUserId, isFollowingInitial = false, className = '' }: { targetUserId: string, isFollowingInitial?: boolean, className?: string }) {
  const [isFollowing, setIsFollowing] = useState(isFollowingInitial);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFollow = async () => {
    setIsLoading(true);
    // Optimistic
    setIsFollowing(!isFollowing);

    const res = await toggleFollowAction(targetUserId);
    if (res?.error) {
      // Revert on error
      setIsFollowing(isFollowing);
    }
    
    setIsLoading(false);
  };

  if (isFollowing) {
    return (
      <button 
        onClick={toggleFollow}
        disabled={isLoading}
        className={`flex justify-center items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-full text-xs font-bold transition-colors disabled:opacity-50 border border-slate-200 hover:border-red-200 ${className}`}
      >
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <UserCheck className="w-3.5 h-3.5 shrink-0" />}
        <span>Mengikuti</span>
      </button>
    );
  }

  return (
    <button 
      onClick={toggleFollow}
      disabled={isLoading}
      className={`flex justify-center items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold transition-colors disabled:opacity-50 border border-emerald-200 ${className}`}
    >
      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <UserPlus className="w-3.5 h-3.5 shrink-0" />}
      <span>Ikuti</span>
    </button>
  );
}
