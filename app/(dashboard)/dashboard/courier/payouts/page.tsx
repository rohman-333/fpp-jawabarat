import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { PayoutForm } from './PayoutForm';
import { 
  Wallet, DollarSign, ArrowUpRight, ArrowDownLeft, Landmark, Clock, CheckCircle2, XCircle 
} from 'lucide-react';

export default async function CourierPayoutsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile?.is_courier || profile?.courier_status !== 'approved') {
    redirect('/dashboard/courier/apply');
  }

  // Fetch balance summary from wallet transactions
  const { data: transactions } = await supabase
    .from('courier_wallet_transactions')
    .select('*')
    .eq('courier_id', user.id)
    .order('created_at', { ascending: false });

  const balance = transactions?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

  // Fetch payouts list
  const { data: payouts } = await supabase
    .from('courier_payouts')
    .select('*')
    .eq('courier_id', user.id)
    .order('created_at', { ascending: false });

  const totalPendingPayout = payouts
    ?.filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

  const availableBalance = balance - totalPendingPayout;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar 
        isAdmin={profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'operator' || profile?.role === 'team'} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar 
          title="Keuangan & Pencairan" 
          userName={profile?.name || 'User'} 
          avatarUrl={profile?.avatar_url} 
        />

        <main className="p-4 sm:p-8 space-y-6 overflow-y-auto">
          {/* Financial summary overview cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Saldo Total</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">Rp {balance.toLocaleString('id-ID')}</span>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Pencairan Tertunda</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">Rp {totalPendingPayout.toLocaleString('id-ID')}</span>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Tersedia untuk Dicairkan</span>
                <span className="text-2xl font-black text-green-600 mt-1 block">Rp {availableBalance.toLocaleString('id-ID')}</span>
              </div>
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form component */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Ajukan Pencairan Baru</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Dana akan diproses oleh administrator dalam 1-2 hari kerja.</p>
                </div>
                <PayoutForm available={availableBalance} />
              </div>
            </div>

            {/* Payout records list */}
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-800 text-base">Riwayat Penarikan Dana</h3>
                
                {payouts?.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Belum ada pengajuan pencairan dana.
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-96 custom-scrollbar">
                    {payouts?.map((po) => (
                      <div key={po.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-800">Rp {Number(po.amount).toLocaleString('id-ID')}</p>
                          <p className="text-slate-500 font-medium">{po.method} — {po.account_number} ({po.account_name})</p>
                          <p className="text-[10px] text-slate-400">{new Date(po.created_at).toLocaleDateString('id-ID')}</p>
                          {po.note && <p className="text-[10px] text-slate-500 bg-white p-1 rounded border mt-1">Catatan: {po.note}</p>}
                        </div>

                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                            po.status === 'paid' ? 'bg-green-100 text-green-800' :
                            po.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            po.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {po.status === 'paid' ? 'Terkirim' :
                             po.status === 'approved' ? 'Disetujui' :
                             po.status === 'rejected' ? 'Ditolak' :
                             'Menunggu Review'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ledger of wallet transactions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base">Log Mutasi Rekening</h3>
            {transactions?.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Belum ada mutasi transaksi pada akun Anda.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions?.map((tx) => {
                  const isEarning = Number(tx.amount || 0) > 0;
                  return (
                    <div key={tx.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isEarning ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {isEarning ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800">{tx.description || 'Transaksi Kurir'}</p>
                          <p className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      <span className={`font-black text-sm ${isEarning ? 'text-green-600' : 'text-red-600'}`}>
                        {isEarning ? '+' : ''}Rp {Number(tx.amount).toLocaleString('id-ID')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
