import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Shield, CheckCircle, EyeOff, Trash2, XCircle } from 'lucide-react';
import { ModerationActions } from './ModerationActions';

export const metadata = {
  title: 'Moderasi Konten - Admin WIBAWA NUSANTARA',
};

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'superadmin', 'team'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const { data: reports } = await supabase
    .from('post_reports')
    .select(`
      *,
      reporter:reporter_id(name),
      post:post_id(content, type, status, author:author_id(name))
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            Moderasi Konten
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kelola laporan konten dari pengguna platform.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Laporan Masuk</th>
                <th className="px-6 py-4">Konten yang Dilaporkan</th>
                <th className="px-6 py-4">Alasan & Detail</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="font-medium text-slate-600">Tidak ada laporan konten</p>
                    <p className="text-sm">Semua konten saat ini aman.</p>
                  </td>
                </tr>
              ) : (
                reports?.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{report.reporter?.name || 'Anonim'}</div>
                      {/* Email removed as profiles no longer contain email */}
                      <div className="text-[10px] text-slate-400 mt-1">{new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px]">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 mb-1">
                          {report.post?.type || 'Post'}
                        </span>
                        <p className="text-slate-700 text-xs line-clamp-2" title={report.post?.content}>
                          {report.post?.content || '(Tanpa teks)'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">Oleh: {report.post?.author?.name || 'Anonim'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700 mb-1">
                        {report.reason.replace(/_/g, ' ')}
                      </span>
                      {report.details && (
                        <p className="text-xs text-slate-600 mt-1 max-w-[200px] line-clamp-2" title={report.details}>
                          "{report.details}"
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {report.status === 'pending' && <span className="px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">Menunggu</span>}
                      {report.status === 'reviewed' && <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">Ditinjau</span>}
                      {report.status === 'resolved' && <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">Selesai (Dihapus/Disembunyikan)</span>}
                      {report.status === 'ignored' && <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">Diabaikan</span>}
                      
                      {report.post?.status === 'hidden' && (
                        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          <EyeOff className="w-3 h-3" /> Post Hidden
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ModerationActions 
                        reportId={report.id} 
                        postId={report.post_id} 
                        currentStatus={report.status}
                        postStatus={report.post?.status} 
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}