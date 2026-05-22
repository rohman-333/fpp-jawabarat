'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Eye, EyeOff, Trash2, MessageSquare, Clock, User, 
  Search, Filter, AlertCircle, CheckCircle, Loader2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  status?: string;
  is_hidden?: boolean;
  is_pinned?: boolean;
  created_at: string;
  updated_at: string;
  profiles?: { name: string; avatar_url: string | null; role: string };
  _source?: string; // 'forum_discussions' if from that table
}

export function AdminForumClient({ posts: initialPosts }: { posts: ForumPost[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const getTableName = (post: ForumPost) => post._source === 'forum_discussions' ? 'forum_discussions' : 'forum_posts';

  const toggleHidden = async (postId: string, currentHidden: boolean) => {
    const post = posts.find(p => p.id === postId);
    const table = post ? getTableName(post) : 'forum_posts';
    startTransition(async () => {
      const { error } = await supabase
        .from(table)
        .update({ is_hidden: !currentHidden })
        .eq('id', postId);

      if (error) {
        // Graceful: if is_hidden column doesn't exist yet, show helpful message
        const msg = error.message.includes('does not exist')
          ? 'Kolom moderasi belum tersedia. Jalankan migration 059 di Supabase SQL Editor.'
          : `Gagal mengubah visibilitas: ${error.message}`;
        showToast(msg, 'error');
      } else {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_hidden: !currentHidden } : p));
        showToast(currentHidden ? 'Diskusi ditampilkan kembali' : 'Diskusi disembunyikan');
      }
    });
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Yakin ingin menghapus diskusi ini? Tindakan ini tidak bisa dibatalkan.')) return;

    const post = posts.find(p => p.id === postId);
    const table = post ? getTableName(post) : 'forum_posts';
    startTransition(async () => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', postId);

      if (error) {
        showToast(`Gagal menghapus: ${error.message}`, 'error');
      } else {
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (selectedPost?.id === postId) setSelectedPost(null);
        showToast('Diskusi berhasil dihapus');
      }
    });
  };

  // Filter posts by search and status
  const filtered = posts.filter(p => {
    const matchesSearch = !searchQuery || 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'hidden' && p.is_hidden) ||
      (statusFilter === 'visible' && !p.is_hidden) ||
      (statusFilter === 'pinned' && p.is_pinned);
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-lg transition-all ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-bold">{toast.text}</span>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Forum Musyawarah</h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola {posts.length} topik diskusi. Moderasi konten, sembunyikan, atau hapus diskusi yang tidak sesuai.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul / pembuat..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="relative shrink-0">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer font-medium text-slate-700"
            >
              <option value="all">Semua ({posts.length})</option>
              <option value="visible">Tampil ({posts.filter(p => !p.is_hidden).length})</option>
              <option value="hidden">Tersembunyi ({posts.filter(p => p.is_hidden).length})</option>
              <option value="pinned">Disematkan ({posts.filter(p => p.is_pinned).length})</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Post List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            {isPending && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="p-12">
                <EmptyState 
                  title="Tidak Ada Diskusi"
                  description="Tidak ada diskusi yang cocok dengan filter."
                  icon={<MessageSquare className="w-10 h-10 text-slate-300" />}
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filtered.map(post => (
                  <div 
                    key={post.id} 
                    onClick={() => setSelectedPost(post)}
                    className={`p-4 sm:p-5 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      selectedPost?.id === post.id ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''
                    } ${post.is_hidden ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {post.is_hidden && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full border border-amber-200 uppercase">
                              Hidden
                            </span>
                          )}
                          {post.is_pinned && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full border border-blue-200 uppercase">
                              Pinned
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{post.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <User className="w-3 h-3" />
                            {post.profiles?.name || 'Anonim'}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleHidden(post.id, !!post.is_hidden); }}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            post.is_hidden 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                          }`}
                          title={post.is_hidden ? 'Tampilkan' : 'Sembunyikan'}
                        >
                          {post.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deletePost(post.id); }}
                          className="p-1.5 bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail Preview */}
        <div className="lg:col-span-1">
          {selectedPost ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Detail Diskusi</h3>
                <a href={`/forum`} target="_blank" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-xs font-bold">
                  <ExternalLink className="w-3 h-3" /> Lihat di Forum
                </a>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Judul</span>
                  <h4 className="text-base font-bold text-slate-800 mt-1">{selectedPost.title}</h4>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Isi</span>
                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pembuat</span>
                    <span className="font-medium text-slate-800">{selectedPost.profiles?.name || 'Anonim'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Role</span>
                    <span className="font-medium text-slate-800 capitalize">{selectedPost.profiles?.role || 'user'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal</span>
                    <span className="font-medium text-slate-800">
                      {new Date(selectedPost.created_at).toLocaleDateString('id-ID', { 
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      selectedPost.is_hidden 
                        ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {selectedPost.is_hidden ? 'Tersembunyi' : 'Tampil'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => toggleHidden(selectedPost.id, !!selectedPost.is_hidden)}
                    className={selectedPost.is_hidden 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex-1'
                      : 'bg-amber-500 hover:bg-amber-600 text-white text-xs flex-1'
                    }
                  >
                    {selectedPost.is_hidden ? <><Eye className="w-3.5 h-3.5 mr-1" /> Tampilkan</> : <><EyeOff className="w-3.5 h-3.5 mr-1" /> Sembunyikan</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deletePost(selectedPost.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">Pilih diskusi dari daftar untuk melihat detail dan opsi moderasi.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
