'use client';

export function FeedTabs({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) {
  const tabs = [
    { id: 'semua', label: 'Semua' },
    { id: 'mengikuti', label: 'Mengikuti' },
    { id: 'kabar', label: 'Kabar' },
    { id: 'musyawarah', label: 'Musyawarah' },
    { id: 'kegiatan_santri', label: 'Kegiatan Santri' },
    { id: 'produk', label: 'Marketplace' },
    { id: 'program', label: 'Program' },
    { id: 'donasi', label: 'Donasi' },
    { id: 'dakwah', label: 'Dakwah' },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-3 mb-6 scroll-smooth">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button 
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-sm transition-all active:scale-95 ${
              isActive 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
