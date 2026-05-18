import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Store, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SellerApplyForm } from './SellerApplyForm';

export default async function SellerApplyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_seller, seller_status')
    .eq('id', user.id)
    .single();

  if (profile?.seller_status === 'pending') {
    redirect('/dashboard/seller');
  }

  if (profile?.is_seller && profile?.seller_status === 'approved') {
    redirect('/dashboard/products');
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Store className="w-6 h-6 text-emerald-600" /> Buka Toko Anda
          </h1>
          <p className="text-slate-500 text-sm">Jangkau ribuan anggota komunitas FPP JAWABARAT.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8">
          <SellerApplyForm />
        </div>
      </div>
    </div>
  );
}
