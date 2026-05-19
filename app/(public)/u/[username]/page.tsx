import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { BadgeCheck, MapPin, Store, Landmark, Users } from 'lucide-react';
import { getDisplayRole } from '@/lib/auth/roles';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { FollowButton } from '@/components/social/FollowButton';
import { InfiniteFeed } from '@/components/social/InfiniteFeed';
import Link from 'next/link';
import { resolveMediaUrl } from '@/lib/media/resolveMediaUrl';
import { Button } from '@/components/ui/button';

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase.from('public_profiles').select('name, bio').eq('username', username).single();
  
  if (!profile) return { title: 'User Not Found' };
  return {
    title: `${profile.name} (@${username}) - WIBAWA NUSANTARA`,
    description: profile.bio || `Profil ${profile.name} di WIBAWA NUSANTARA`,
  };
}

export default async function PublicProfilePage({
  params,
  searchParams
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab || 'postingan';
  const supabase = await createClient();
  
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch pesantren separately since public_profiles is a view
  let pesantren = null;
  if (profile.has_pesantren) {
    const { data: p } = await supabase
      .from('pesantren')
      .select('id, name, city, logo_url')
      .eq('owner_id', profile.id)
      .single();
    if (p) pesantren = p;
  }
  
  // Attach it for the UI
  profile.pesantren = pesantren;

  // Fetch counts safely
  const { count: followersCount } = await supabase
    .from('social_follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id);

  const { count: followingCount } = await supabase
    .from('social_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id);

  let isFollowing = false;
  if (currentUser) {
    const { data: follow } = await supabase
      .from('social_follows')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', profile.id)
      .single();
    isFollowing = !!follow;
  }

  // Fetch products if seller
  let products: any[] = [];
  if (profile.is_seller && profile.seller_status === 'approved') {
    const { data: p } = await supabase
      .from('products')
      .select('id, name, price, image_url, slug')
      .eq('seller_id', profile.id)
      .limit(4);
    if (p) products = p;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNavbar />
      
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-[1080px] mx-auto w-full">
          {/* Profile Header */}
          <div className="bg-white border-b border-slate-200">
            {/* Cover photo */}
            <div className="h-32 md:h-64 bg-slate-200 relative overflow-hidden">
              {profile.cover_url ? (
                <img src={resolveMediaUrl(profile.cover_url)!} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-800 to-blue-600 opacity-80" />
              )}
            </div>
            
            <div className="px-4 sm:px-8 max-w-[800px] mx-auto pb-6 -mt-12 md:-mt-16 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 justify-between">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white p-1 shadow-lg shrink-0">
                    <div className="w-full h-full rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-slate-400 uppercase text-3xl md:text-4xl">{profile.name.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                  <div className="pb-2">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      {profile.name}
                      {profile.is_verified && <BadgeCheck className="w-5 h-5 text-blue-500 shrink-0" />}
                    </h1>
                    <p className="text-slate-500 font-medium">@{username}</p>
                    <p className="text-sm font-bold text-blue-700 capitalize mt-1">
                      {getDisplayRole(profile)}
                    </p>
                  </div>
                </div>

                {currentUser?.id !== profile.id && (
                  <div className="pb-2 w-full sm:w-auto">
                    <FollowButton targetUserId={profile.id} isFollowingInitial={isFollowing} className="w-full sm:w-32 py-2.5 h-auto text-sm" />
                  </div>
                )}
                {currentUser?.id === profile.id && (
                  <div className="pb-2 w-full sm:w-auto">
                    <Link href="/dashboard/profile" className="block w-full text-center sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm">
                      Edit Profil
                    </Link>
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="mt-4 text-slate-700 whitespace-pre-wrap">{profile.bio}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                {profile.location && (
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {profile.location}</span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                    <span className="w-4 h-4 text-slate-400">🌐</span> {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {profile.social_links?.instagram && (
                  <a href={`https://instagram.com/${profile.social_links.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-pink-600 hover:underline">
                    <span>📸</span> {profile.social_links.instagram}
                  </a>
                )}
                {profile.social_links?.tiktok && (
                  <a href={`https://tiktok.com/@${profile.social_links.tiktok}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-800 hover:underline">
                    <span>🎵</span> {profile.social_links.tiktok}
                  </a>
                )}
              </div>

              <div className="mt-4 flex gap-6">
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors">
                  <span className="font-bold text-slate-800">{followingCount || 0}</span>
                  <span className="text-slate-500 text-sm">Mengikuti</span>
                </div>
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors">
                  <span className="font-bold text-slate-800">{followersCount || 0}</span>
                  <span className="text-slate-500 text-sm">Pengikut</span>
                </div>
              </div>
            </div>
          </div>

            {/* TABS */}
          <div className="px-4 sm:px-8 max-w-[800px] mx-auto py-8">
            <div className="flex border-b border-slate-200 mb-8 overflow-x-auto hide-scrollbar gap-6 text-sm font-bold">
              <Link href={`/u/${username}?tab=postingan`} className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'postingan' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Postingan
              </Link>
              <Link href={`/u/${username}?tab=tentang`} className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'tentang' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Tentang
              </Link>
              {products.length > 0 && (
                <Link href={`/u/${username}?tab=produk`} className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'produk' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  Produk Toko
                </Link>
              )}
              {profile.has_pesantren && profile.pesantren && (
                <Link href={`/u/${username}?tab=pesantren`} className={`pb-3 border-b-2 whitespace-nowrap transition-colors ${activeTab === 'pesantren' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                  Pesantren
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 items-start">
              <div className="min-w-0">
                {activeTab === 'postingan' && (
                  <>
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Postingan Terbaru</h3>
                    <InfiniteFeed activeTab="semua" currentUser={currentUser} targetUserId={profile.id} />
                  </>
                )}
                {activeTab === 'tentang' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
                    <h3 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-3">Tentang {profile.name}</h3>
                    <div className="space-y-4 text-sm text-slate-600">
                      {profile.bio && (
                        <div>
                          <strong className="block text-slate-800 mb-1">Bio</strong>
                          <p className="whitespace-pre-wrap">{profile.bio}</p>
                        </div>
                      )}
                      {profile.location && (
                        <div>
                          <strong className="block text-slate-800 mb-1">Lokasi</strong>
                          <p>{profile.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'produk' && products.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {products.map(p => (
                      <Link key={p.id} href={`/marketplace/${p.slug}`} className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="aspect-square bg-slate-100">
                          {p.image_url && <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                        </div>
                        <div className="p-3">
                          <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{p.name}</h4>
                          <p className="text-blue-600 font-bold text-xs mt-1">Rp {p.price?.toLocaleString('id-ID')}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {activeTab === 'pesantren' && profile.pesantren && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-start gap-4">
                    <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                       {profile.pesantren.logo_url ? (
                         <img src={resolveMediaUrl(profile.pesantren.logo_url)!} className="w-full h-full object-cover" />
                       ) : (
                         <Landmark className="w-8 h-8 m-auto mt-6 text-slate-400" />
                       )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{profile.pesantren.name}</h3>
                      <p className="text-slate-500 text-sm mt-1 mb-3">{profile.pesantren.city}</p>
                      <Link href={`/pesantren/${profile.pesantren.id}`}>
                        <Button size="sm" variant="outline" className="rounded-lg">Lihat Profil Pesantren</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {profile.has_pesantren && profile.pesantren && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-blue-600" />
                      Pesantren
                    </h3>
                    <Link href={`/pesantren/${profile.pesantren.id}`} className="group flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {resolveMediaUrl(profile.pesantren.logo_url) ? (
                          <img src={resolveMediaUrl(profile.pesantren.logo_url)!} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Landmark className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">{profile.pesantren.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{profile.pesantren.city}</p>
                      </div>
                    </Link>
                  </div>
                )}

                {products.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Store className="w-4 h-4 text-blue-600" />
                      Etalase Toko
                    </h3>
                    <div className="space-y-3">
                      {products.map(p => (
                        <Link key={p.id} href={`/marketplace/${p.slug}`} className="group flex gap-3 p-2 -m-2 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 shrink-0 overflow-hidden">
                            {p.image_url && <img src={p.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">{p.name}</p>
                            <p className="font-bold text-blue-600 text-xs mt-0.5">Rp {p.price?.toLocaleString('id-ID')}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
