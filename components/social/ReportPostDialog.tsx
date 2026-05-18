'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportPostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  currentUserId: string;
}

export function ReportPostDialog({ isOpen, onClose, postId, currentUserId }: ReportPostDialogProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Silakan pilih alasan pelaporan.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const { error: dbError } = await supabase
        .from('post_reports')
        .insert({
          post_id: postId,
          reporter_id: currentUserId,
          reason,
          details
        });

      if (dbError) {
        if (dbError.code === '23505') {
          throw new Error('Anda sudah melaporkan postingan ini.');
        }
        throw new Error(dbError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReason('');
        setDetails('');
      }, 2000);
    } catch (err: any) {
      console.error('[REPORT_POST_ERROR]', err);
      setError(err.message || 'Terjadi kesalahan saat melaporkan postingan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9998] flex items-center justify-center p-4" onClick={onClose}>
        <div 
          className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Laporkan Postingan
            </h3>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            {success ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h4 className="font-bold text-slate-800 text-lg mb-2">Laporan Terkirim</h4>
                <p className="text-slate-500 text-sm">Terima kasih telah membantu menjaga komunitas FPP JAWABARAT tetap aman dan nyaman.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Mengapa Anda melaporkan postingan ini?</label>
                  <div className="space-y-2 mt-2">
                    {[
                      { id: 'spam', label: 'Spam atau Komersial Berlebihan' },
                      { id: 'konten_tidak_pantas', label: 'Konten Tidak Pantas / Asusila' },
                      { id: 'penipuan', label: 'Penipuan / Scam' },
                      { id: 'ujaran_kebencian', label: 'Ujaran Kebencian / SARA' },
                      { id: 'informasi_palsu', label: 'Hoax / Informasi Palsu' },
                      { id: 'lainnya', label: 'Alasan Lainnya' },
                    ].map(r => (
                      <label key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${reason === r.id ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <input 
                          type="radio" 
                          name="reason" 
                          value={r.id} 
                          checked={reason === r.id}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-4 h-4 text-red-600 border-slate-300 focus:ring-red-600"
                        />
                        <span className={`text-sm ${reason === r.id ? 'font-bold text-red-700' : 'text-slate-700'}`}>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Detail Tambahan (Opsional)</label>
                  <textarea 
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Berikan detail tambahan untuk membantu kami meninjau laporan ini..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all min-h-[80px] resize-none text-slate-800 placeholder-slate-400"
                  />
                </div>
                
                <div className="pt-2 flex gap-3">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1 font-semibold rounded-xl text-slate-600 border-slate-200 h-11">Batal</Button>
                  <Button type="submit" disabled={isSubmitting || !reason} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold border-0 rounded-xl h-11">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Laporan'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
