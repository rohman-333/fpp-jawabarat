'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function SuggestedPrograms() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPrograms() {
      // Assuming 'programs' table exists. If not, we will just safely return empty or handle error.
      const { data, error } = await supabase
        .from('programs')
        .select('id, title, status')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && data) {
        setPrograms(data);
      }
      setLoading(false);
    }
    fetchPrograms();
  }, [supabase]);

  if (loading && programs.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mt-6">
        <h3 className="font-bold text-slate-800 text-sm mb-4">Program Unggulan</h3>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-2 items-center animate-pulse">
              <div className="w-8 h-8 rounded-full bg-slate-200"></div>
              <div className="space-y-1 flex-1">
                <div className="w-24 h-3 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (programs.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6 xl:mt-6">
      <div className="p-3 xl:p-4 border-b border-slate-100 flex items-center gap-2">
        <Target className="w-4 h-4 text-emerald-600" />
        <h3 className="font-bold text-slate-800 text-sm">Program Unggulan</h3>
      </div>
      <div className="p-3 xl:p-4 flex xl:flex-col gap-3 overflow-x-auto xl:overflow-visible hide-scrollbar snap-x">
        {programs.map(p => (
          <Link key={p.id} href={`#`} className="flex flex-col xl:flex-row items-center gap-2 xl:gap-3 group min-w-[120px] xl:min-w-0 p-3 xl:p-0 border border-slate-100 xl:border-none rounded-xl snap-center shrink-0 text-center xl:text-left">
            <div className="w-10 h-10 xl:w-8 xl:h-8 rounded-full bg-emerald-50 shrink-0 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Target className="w-5 h-5 xl:w-4 xl:h-4" />
            </div>
            <div className="flex-1 min-w-0 w-full">
              <h4 className="font-bold text-slate-700 text-xs xl:text-sm group-hover:text-emerald-600 truncate transition-colors">{p.title}</h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
