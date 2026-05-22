import Link from 'next/link';
import { ArrowLeft, Users, MessageSquare, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default function CommunityPage() {
  const dummyCommunities = [
    { id: '1', name: 'Digitalisasi Pesantren', members: 124, posts: 45, desc: 'Fokus gerakan modernisasi sistem administrasi dan e-learning pondok pesantren.' },
    { id: '2', name: 'Pemberdayaan Santri Preneur', members: 89, posts: 28, desc: 'Komunitas santri pengusaha untuk bertukar ide bisnis, tips manajemen, dan kemitraan.' },
    { id: '3', name: 'Nusantara Mengaji', members: 210, posts: 92, desc: 'Forum kajian, tilawah rutin, dan pendampingan tahfidz Quran.' },
  ];

  return (
    <div className="pt-4 md:pt-8 max-w-[680px] mx-auto w-full px-4 md:px-0">
      {/* Header Navigation */}
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <Link href="/feed">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Komunitas WIBAWA
          </h1>
          <p className="text-xs text-slate-500 font-medium">Jelajahi dan bergabung dengan ekosistem pergerakan</p>
        </div>
      </div>

      {/* Grid of Recommended Groups */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Grup Komunitas Unggulan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dummyCommunities.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-200 transition-all duration-300 shadow-2xs hover:shadow-xs flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {c.members} Anggota
                </span>
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm mb-1.5 line-clamp-1">{c.name}</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-3">{c.desc}</p>
              <Button size="sm" className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                Gabung Grup
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Active Activities Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-2xs text-center flex flex-col items-center">
        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-6 h-6 text-slate-400" />
        </div>
        <h2 className="font-extrabold text-slate-800 text-base mb-1.5">Aktivitas Terbaru Komunitas</h2>
        <p className="text-slate-500 text-xs md:text-sm max-w-sm mb-6 leading-relaxed font-medium">
          Belum ada aktivitas komunitas. Mulailah bergabung ke salah satu grup di atas atau buat diskusi baru untuk memicu obrolan!
        </p>
        <Link href="/forum">
          <Button variant="outline" className="border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-slate-700">
            Kunjungi Forum Diskusi
          </Button>
        </Link>
      </div>
    </div>
  );
}
