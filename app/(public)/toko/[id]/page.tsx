import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function TokoBridgePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Defensive lookup: support UUID profile id OR username lookup
  let query = supabase.from('profiles').select('id, username');
  
  // UUID check helper
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  
  if (isUUID) {
    query = query.eq('id', id);
  } else {
    query = query.eq('username', id);
  }

  const { data: profile } = await query.maybeSingle();

  if (!profile || !profile.username) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-extrabold text-2xl">
            ✦
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Toko Tidak Ditemukan</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Maaf, toko atau penjual yang Anda cari tidak aktif, terhapus, atau belum terdaftar di WIBAWA NUSANTARA.
          </p>
          <a href="/marketplace" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-xs transition-colors">
            Kembali ke Marketplace
          </a>
        </div>
      </div>
    );
  }

  redirect(`/u/${profile.username}`);
}
