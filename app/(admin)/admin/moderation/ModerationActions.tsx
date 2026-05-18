'use client';

import { useState } from 'react';
import { updateReportStatus, hideReportedPost, deleteReportedPost } from './actions';
import { Loader2, MoreVertical, EyeOff, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface ModerationActionsProps {
  reportId: string;
  postId: string;
  currentStatus: string;
  postStatus: string;
}

export function ModerationActions({ reportId, postId, currentStatus, postStatus }: ModerationActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: () => Promise<{error?: string}>) => {
    setIsLoading(true);
    setIsOpen(false);
    try {
      const res = await action();
      if (res?.error) alert(res.error);
    } catch (err) {
      alert('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MoreVertical className="w-5 h-5" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden py-1">
            {currentStatus !== 'reviewed' && currentStatus !== 'resolved' && (
              <button 
                onClick={() => handleAction(() => updateReportStatus(reportId, 'reviewed'))}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
              >
                <CheckCircle className="w-4 h-4 text-blue-500" /> Tandai Ditinjau
              </button>
            )}
            
            {postStatus !== 'hidden' && (
              <button 
                onClick={() => handleAction(() => hideReportedPost(postId, reportId))}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
              >
                <EyeOff className="w-4 h-4 text-orange-500" /> Sembunyikan Post
              </button>
            )}

            <button 
              onClick={() => {
                if(confirm('Apakah Anda yakin ingin menghapus postingan ini secara permanen?')) {
                  handleAction(() => deleteReportedPost(postId, reportId));
                }
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
            >
              <Trash2 className="w-4 h-4 text-red-500" /> Hapus Post
            </button>
            
            <div className="h-px bg-slate-100 my-1"></div>
            
            <button 
              onClick={() => handleAction(() => updateReportStatus(reportId, 'ignored'))}
              className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
            >
              <XCircle className="w-4 h-4 text-slate-400" /> Abaikan Laporan
            </button>
          </div>
        </>
      )}
    </div>
  );
}
