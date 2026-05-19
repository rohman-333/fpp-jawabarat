'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function MarkAllReadButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleMarkAll = async () => {
    setLoading(true);
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    setLoading(false);
    setDone(true);
    router.refresh();
  };

  if (done) {
    return (
      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
        <Check className="w-3.5 h-3.5" /> Semua dibaca
      </span>
    );
  }

  return (
    <button
      onClick={handleMarkAll}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      Tandai semua dibaca
    </button>
  );
}
