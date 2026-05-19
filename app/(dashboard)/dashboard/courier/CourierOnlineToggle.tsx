'use client';

import { useState } from 'react';
import { toggleOnlineStatus } from '@/app/actions/delivery';

interface CourierOnlineToggleProps {
  defaultOnline: boolean;
}

export function CourierOnlineToggle({ defaultOnline }: CourierOnlineToggleProps) {
  const [online, setOnline] = useState(defaultOnline);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleToggle = async () => {
    setLoading(true);
    setMsg(null);

    const nextState = !online;
    const res = await toggleOnlineStatus(nextState);

    setLoading(false);

    if (res?.error) {
      setMsg(res.error);
    } else {
      setOnline(nextState);
      setMsg(nextState ? 'Status Anda kini ONLINE' : 'Status Anda kini OFFLINE');
      setTimeout(() => setMsg(null), 3000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        disabled={loading}
        onClick={handleToggle}
        className={`w-28 py-2 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-300 border ${
          online 
            ? 'bg-green-600 border-green-500 text-white hover:bg-green-700 active:scale-95' 
            : 'bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300 active:scale-95'
        }`}
      >
        {loading ? '...' : online ? '🟢 Online' : '🔴 Offline'}
      </button>

      {msg && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          online ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'
        }`}>
          {msg}
        </span>
      )}
    </div>
  );
}
