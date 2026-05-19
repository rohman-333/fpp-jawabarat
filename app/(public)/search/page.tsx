'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, ArrowLeft, Users, MessageSquare, Store, BadgeCheck, AlertCircle, X, Compass, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getProfileUrl } from '@/lib/routes/profile';
import { getDisplayRole } from '@/lib/auth/roles';

export default function SearchPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'semua' | 'orang' | 'postingan' | 'produk'>('semua');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const [profiles, setProfiles] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Input autofocus reference
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce query (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Execute database search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setProfiles([]);
      setPosts([]);
      setProducts([]);
      setSearched(false);
      return;
    }

    async function performSearch() {
      setLoading(true);
      setSearched(true);
      try {
        const promises: any[] = [];

        // 1. Search Orang (Profiles)
        const profilesPromise = supabase
          .from('profiles')
          .select('id, name, username, avatar_url, role, is_verified')
          .or(`name.ilike.%${debouncedQuery}%,username.ilike.%${debouncedQuery}%`)
          .limit(10);
        promises.push(profilesPromise);

        // 2. Search Postingan (Social Posts)
        const postsPromise = supabase
          .from('social_posts')
          .select('id, content, type, image_url, video_url, created_at, author_id')
          .ilike('content', `%${debouncedQuery}%`)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(10);
        promises.push(postsPromise);

        // 3. Search Produk (Marketplace Products)
        const productsPromise = supabase
          .from('products')
          .select('id, name, slug, price, image_url, category, status, pesantren(name)')
          .eq('status', 'active')
          .ilike('name', `%${debouncedQuery}%`)
          .order('created_at', { ascending: false })
          .limit(10);
        promises.push(productsPromise);

        const [profilesRes, postsRes, productsRes] = await Promise.all(promises);

        if (profilesRes.data) setProfiles(profilesRes.data);
        
        // Enrich posts with their authors
        if (postsRes.data && postsRes.data.length > 0) {
          const authorIds = Array.from(new Set(postsRes.data.map((p: any) => p.author_id).filter(Boolean)));
          if (authorIds.length > 0) {
            const { data: authors } = await supabase
              .from('profiles')
              .select('id, name, username, avatar_url, role, is_verified')
              .in('id', authorIds);
            
            const authorsMap = new Map(authors?.map((a: any) => [a.id, a]) || []);
            const enrichedPosts = postsRes.data.map((p: any) => ({
              ...p,
              author: authorsMap.get(p.author_id)
            }));
            setPosts(enrichedPosts);
          } else {
            setPosts(postsRes.data);
          }
        } else {
          setPosts([]);
        }

        if (productsRes.data) setProducts(productsRes.data);

      } catch (err) {
        console.error('[SEARCH_EXEC_ERR]', err);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery, supabase]);

  // Autofocus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleClear = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const hasAnyResults = profiles.length > 0 || posts.length > 0 || products.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans max-w-md mx-auto relative z-50">
      
      {/* Sticky Native Search Header with Notch Safe-Area */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors flex-shrink-0"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1 relative flex items-center">
          <SearchIcon className="w-4.5 h-4.5 text-slate-400 absolute left-3.5" />
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari pesantren, produk, orang..." 
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500 transition-all font-medium"
            autoFocus
          />
          {query && (
            <button 
              onClick={handleClear}
              className="p-1 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 absolute right-2.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </header>

      {/* Dynamic Filter Tabs */}
      <div className="bg-white border-b border-slate-100 flex items-center overflow-x-auto hide-scrollbar shrink-0 px-2">
        {([
          { id: 'semua', label: 'Semua' },
          { id: 'orang', label: 'Orang' },
          { id: 'postingan', label: 'Postingan' },
          { id: 'produk', label: 'Produk' }
        ] as const).map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center text-xs font-extrabold whitespace-nowrap transition-all border-b-2 px-4 ${
                isActive 
                  ? 'border-blue-600 text-blue-600 font-extrabold' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Results Scrolling View */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {loading ? (
          // Lightweight Skeletons
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs animate-pulse flex gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                <div className="space-y-2 flex-1 pt-1">
                  <div className="w-1/3 h-4 bg-slate-200 rounded"></div>
                  <div className="w-3/4 h-3 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !searched ? (
          // Pre-Search Guidance State
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Temukan Komunitas</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-[240px] leading-relaxed">
              Mulai mengetik nama pesantren, nama rekan, produk marketplace, atau postingan untuk mencari.
            </p>
          </div>
        ) : !hasAnyResults ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200/60 p-6">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-sm">Tidak ada hasil ditemukan</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-[240px] leading-relaxed">
              Coba ganti kata kunci pencarian Anda dengan ejaan atau kueri lainnya.
            </p>
          </div>
        ) : (
          // Search Results
          <div className="space-y-6">
            
            {/* Tab: SEMUA (Aggregated overview) */}
            {activeTab === 'semua' && (
              <div className="space-y-6">
                {/* Orang matching snippet */}
                {profiles.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" /> Orang / Profil
                      </span>
                      <button onClick={() => setActiveTab('orang')} className="text-blue-600 text-xs font-bold flex items-center gap-0.5 hover:underline">
                        Lihat Semua <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {profiles.slice(0, 3).map(u => (
                        <Link key={u.id} href={getProfileUrl({ id: u.id, username: u.username })} className="p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-slate-400 text-xs uppercase">{(u.name || 'U').charAt(0)}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-1">
                              {u.name}
                              {u.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                            </p>
                            <p className="text-[10px] text-slate-500 capitalize">{getDisplayRole(u)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Produk matching snippet */}
                {products.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-blue-600" /> Produk Pilihan
                      </span>
                      <button onClick={() => setActiveTab('produk')} className="text-blue-600 text-xs font-bold flex items-center gap-0.5 hover:underline">
                        Lihat Semua <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {products.slice(0, 3).map(p => (
                        <Link key={p.id} href={`/marketplace/${p.slug}`} className="p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                            {p.image_url ? (
                              <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Store className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 text-sm truncate">{p.name}</p>
                            <p className="text-blue-600 font-extrabold text-xs mt-0.5">Rp {p.price?.toLocaleString('id-ID')}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Postingan matching snippet */}
                {posts.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Postingan Feed
                      </span>
                      <button onClick={() => setActiveTab('postingan')} className="text-blue-600 text-xs font-bold flex items-center gap-0.5 hover:underline">
                        Lihat Semua <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {posts.slice(0, 3).map(post => (
                        <Link key={post.id} href={`/post/${post.id}`} className="p-4 flex flex-col gap-2 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                              {post.author?.avatar_url ? (
                                <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-bold text-slate-400 text-[10px] uppercase">{(post.author?.name || 'U').charAt(0)}</span>
                              )}
                            </div>
                            <span className="font-bold text-slate-800 text-xs">{post.author?.name || 'User'}</span>
                          </div>
                          <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed pl-9">{post.content}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: ORANG */}
            {activeTab === 'orang' && (
              <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden divide-y divide-slate-100 shadow-xs">
                {profiles.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-medium">Tidak ada profil cocok.</div>
                ) : (
                  profiles.map(u => (
                    <Link key={u.id} href={getProfileUrl({ id: u.id, username: u.username })} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-slate-400 text-sm uppercase">{(u.name || 'U').charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-1">
                          {u.name}
                          {u.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{getDisplayRole(u)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">@{u.username}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Tab: PRODUK */}
            {activeTab === 'produk' && (
              <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden divide-y divide-slate-100 shadow-xs">
                {products.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-medium">Tidak ada produk cocok.</div>
                ) : (
                  products.map(p => (
                    <Link key={p.id} href={`/marketplace/${p.slug}`} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-sm truncate">{p.name}</p>
                        <p className="text-blue-600 font-extrabold text-xs mt-0.5">Rp {p.price?.toLocaleString('id-ID')}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{p.pesantren?.name || 'Pesantren Jawa Barat'}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Tab: POSTINGAN */}
            {activeTab === 'postingan' && (
              <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden divide-y divide-slate-100 shadow-xs">
                {posts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-medium">Tidak ada postingan cocok.</div>
                ) : (
                  posts.map(post => (
                    <Link key={post.id} href={`/post/${post.id}`} className="p-4 flex flex-col gap-2.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                          {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-slate-400 text-xs uppercase">{(post.author?.name || 'U').charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                            {post.author?.name || 'User'}
                            {post.author?.is_verified && <BadgeCheck className="w-3 h-3 text-blue-500 shrink-0" />}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed pl-11 break-words">{post.content}</p>
                    </Link>
                  ))
                )}
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
