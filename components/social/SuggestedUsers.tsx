'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BadgeCheck, Users, Loader2 } from 'lucide-react';
import { getProfileUrl } from '@/lib/routes/profile';
import { createClient } from '@/lib/supabase/client';
import { FollowButton } from './FollowButton';
import { getDisplayRole } from '@/lib/auth/roles';

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
        .select('id, username, name, avatar_url, role, has_pesantren, is_seller, seller_status, is_courier, courier_status, team_division, is_verified, followers:social_follows!social_follows_following_id_fkey(count)')
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
      <div className="p-3 xl:p-4 border-b border-slate-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-blue-600" />
        <h3 className="font-bold text-slate-800 text-sm">Disarankan Untuk Anda</h3>
      </div>
      <div className="p-3 xl:p-4 flex xl:flex-col gap-4 overflow-x-auto xl:overflow-visible hide-scrollbar snap-x">
        {users.map(u => {
          const followersCount = u.followers?.[0]?.count || 0;
          const userUrl = getProfileUrl({ id: u.id, username: u.username });
          return (
          <div key={u.id} className="flex flex-col xl:flex-row items-center gap-2 xl:gap-3 min-w-[120px] xl:min-w-0 p-3 xl:p-0 border border-slate-100 xl:border-none rounded-xl snap-center shrink-0">
            <Link href={userUrl} className="w-12 h-12 xl:w-10 xl:h-10 rounded-full bg-slate-100 shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center">
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
              ) : (
                <span className="font-bold text-slate-400 uppercase text-sm xl:text-xs">{(u.name || 'U').charAt(0)}</span>
              )}
            </Link>
            <div className="flex-1 min-w-0 text-center xl:text-left w-full">
              <Link href={userUrl} className="flex items-center justify-center xl:justify-start gap-1 font-bold text-slate-800 text-sm hover:underline hover:text-blue-600 w-full">
                <span className="truncate">{u.name}</span>
                {u.is_verified && <BadgeCheck className="w-3 h-3 text-blue-500 shrink-0" />}
              </Link>
              <p className="text-[10px] text-slate-500 truncate capitalize">
                {getDisplayRole(u)} • {followersCount} Pengikut
              </p>
            </div>
            <div className="mt-2 xl:mt-0 w-full xl:w-auto">
              <FollowButton targetUserId={u.id} isFollowingInitial={false} />
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
