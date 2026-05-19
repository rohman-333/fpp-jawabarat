import { MessageSquare, ThumbsUp, Clock, Share2 } from 'lucide-react';

interface FeedPostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    created_at: string;
    profiles?: {
      name: string;
      avatar_url: string;
      role: string;
    };
  };
}

export function FeedPostCard({ post }: FeedPostCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-700 font-bold overflow-hidden">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (post.profiles?.name?.[0] || 'A').toUpperCase()
            )}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
              {post.profiles?.name || 'Anonim'}
              {post.profiles?.role === 'admin' && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded text-[10px] font-bold uppercase tracking-wider">
                  Admin
                </span>
              )}
            </p>
            <div className="flex items-center text-xs text-slate-500 gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          <Share2 className="w-5 h-5" />
        </button>
      </div>
      
      <h2 className="text-xl font-bold text-slate-900 mb-2 leading-snug">{post.title}</h2>
      <p className="text-slate-600 mb-6 leading-relaxed line-clamp-3">{post.content}</p>
      
      <div className="flex items-center gap-6 text-sm font-medium border-t border-slate-100 pt-4">
        <button className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
          <ThumbsUp className="w-5 h-5" /> 0 Suka
        </button>
        <button className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
          <MessageSquare className="w-5 h-5" /> Balas
        </button>
      </div>
    </div>
  );
}
