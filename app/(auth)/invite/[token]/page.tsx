import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Shield, Mail, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { AcceptInviteForm } from './AcceptInviteForm';

export default async function InvitePage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const supabase = await createClient();

  // Fetch the invitation
  const { data: invite, error } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Undangan Tidak Valid</h1>
          <p className="text-slate-600 mb-6">Tautan undangan ini mungkin salah, sudah digunakan, atau telah kedaluwarsa.</p>
          <Link href="/" className="text-emerald-600 font-bold hover:underline">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  // Check expiration
  if (new Date(invite.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-orange-200 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Undangan Kedaluwarsa</h1>
          <p className="text-slate-600 mb-6">Tautan undangan ini sudah melewati batas waktu 7 hari.</p>
          <Link href="/" className="text-emerald-600 font-bold hover:underline">Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-100 max-w-md w-full overflow-hidden">
        <div className="bg-emerald-600 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
          <Shield className="w-16 h-16 mx-auto mb-4 relative z-10" />
          <h1 className="text-2xl font-bold relative z-10">Undangan Bergabung</h1>
          <p className="text-emerald-100 mt-2 relative z-10">FPP JAWABARAT Internal Team</p>
        </div>

        <div className="p-8">
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Anda diundang sebagai:</p>
            <p className="font-bold text-slate-800 text-lg">{invite.name}</p>
            
            <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
              <Mail className="w-4 h-4 text-emerald-600" />
              {invite.email}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md uppercase">
                {invite.role === 'admin' ? 'Administrator' : 'Team Internal'}
              </span>
              {invite.team_division && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-md capitalize">
                  {invite.team_division}
                </span>
              )}
            </div>
          </div>

          <AcceptInviteForm 
            token={token} 
            inviteEmail={invite.email} 
            currentUserEmail={user?.email} 
          />
        </div>
      </div>
    </div>
  );
}
