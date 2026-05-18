'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BadgeCheck, Users, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { FollowButton } from './FollowButton';

export function SuggestedUsers({ currentUserId }: { currentUserId?: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUsers() {
      if (!currentUserId) return;
      
      // Fetch users excluding current user and those already followed
      const { data: followedData } = await supabase
        .from('social_follows')
        .select('following_id')
        .eq('follower_id', currentUserId);
        
      const followedIds = followedData?.map(f => f.following_id) || [];
      const excludeIds = [currentUserId, ...followedIds];

      let query = supabase
        .from('profiles')
        .select('id, name, avatar_url, role, account_type, is_verified')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(5);

      const { data } = await query;
      if (data) setUsers(data);
      setLoading(false);
    }
    fetchUsers();
  }, [currentUserId, supabase]);

  if (!currentUserId || (loading && users.length === 0)) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 text-sm mb-4">Saran Akun</h3>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-2 items-center animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200"></div>
              <div className="space-y-1 flex-1">
                <div className="w-20 h-3 bg-slate-200 rounded"></div>
                <div className="w-12 h-2 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-emerald-600" />
        <h3 className="font-bold text-slate-800 text-sm">Disarankan Untuk Anda</h3>
      </div>
      <div className="p-4 space-y-4">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3">
            <Link href={`/profile/${u.id}`} className="w-10 h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-slate-400 uppercase text-xs">{(u.name || 'U').charAt(0)}</span>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${u.id}`} className="flex items-center gap-1 font-bold text-slate-800 text-sm hover:underline hover:text-emerald-600 truncate">
                <span className="truncate">{u.name}</span>
                {u.is_verified && <BadgeCheck className="w-3 h-3 text-blue-500 shrink-0" />}
              </Link>
              <p className="text-[10px] text-slate-500 truncate capitalize">
                {u.account_type ? u.account_type.replace('_', ' ') : u.role}
              </p>
            </div>
            <FollowButton targetUserId={u.id} isFollowingInitial={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
