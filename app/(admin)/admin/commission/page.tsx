import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Percent, Activity, DollarSign } from 'lucide-react';
import { CommissionForm } from './CommissionForm';

export const metadata = {
  title: 'Komisi Platform - FPP JAWABARAT',
};

export default async function AdminCommissionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'superadmin', 'team'].includes(profile.role)) redirect('/dashboard');

  const { data: currentSetting } = await supabase
    .from('platform_commission_settings')
    .select('*')
    .eq('is_active', true)
    .single();

  const { data: ledger } = await supabase
    .from('platform_commission_ledger')
    .select(`
      *,
      orders(invoice_number),
      seller:seller_id(name)
    `)
    .order('created_at', { ascending: false });

  const totalCommission = ledger?.reduce((sum, item) => sum + item.commission_amount, 0) || 0;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Percent className="w-6 h-6 text-emerald-600" /> Komisi Platform
          </h1>
          <p className="text-slate-500 text-sm mt-1">Atur potongan fee dan pantau pendapatan platform</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" /> Pengaturan Komisi Saat Ini
          </h2>
          <CommissionForm initialSetting={currentSetting} />
        </div>

        <div className="bg-emerald-600 text-white rounded-2xl shadow-sm p-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-emerald-500 opacity-50">
            <DollarSign className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h2 className="font-medium text-emerald-100 mb-1">Total Pendapatan Platform</h2>
            <div className="text-4xl font-extrabold tracking-tight mb-2">
              {formatRupiah(totalCommission)}
            </div>
            <p className="text-sm text-emerald-200">Berdasarkan seluruh transaksi di marketplace.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
          Riwayat Ledger Komisi
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Tanggal & Invoice</th>
                <th className="px-6 py-4">Seller</th>
                <th className="px-6 py-4">Gross Amount</th>
                <th className="px-6 py-4">Komisi (Platform Cut)</th>
                <th className="px-6 py-4">Net Seller</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!ledger || ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Belum ada riwayat komisi.
                  </td>
                </tr>
              ) : (
                ledger.map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{l.orders?.invoice_number}</div>
                      <div className="text-xs text-slate-500 mt-1">{new Date(l.created_at).toLocaleString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{l.seller?.name || 'Seller'}</td>
                    <td className="px-6 py-4 text-slate-600">{formatRupiah(l.gross_amount)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">+{formatRupiah(l.commission_amount)}</td>
                    <td className="px-6 py-4 font-medium text-blue-600">{formatRupiah(l.seller_net_amount)}</td>
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
