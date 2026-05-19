'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Mail, User, Briefcase, CheckCircle2, Copy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function InviteTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'team',
    team_division: 'marketplace'
  });

  const divisions = [
    { id: 'marketplace', label: 'Marketplace & UMKM' },
    { id: 'pesantren', label: 'Verifikasi Pesantren' },
    { id: 'konten', label: 'Moderasi Konten & Berita' },
    { id: 'kurir', label: 'Layanan Kurir' },
    { id: 'keuangan', label: 'Keuangan & Donasi' },
    { id: 'support', label: 'Customer Support' },
    { id: 'teknis', label: 'Tim Teknis / IT' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Harap login ulang');

      // Insert invitation
      const { data, error: insertError } = await supabase
        .from('team_invitations')
        .insert({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          team_division: formData.role === 'team' ? formData.team_division : null,
          invited_by: user.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data?.token) {
        setInviteLink(`${window.location.origin}/invite/${data.token}`);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal membuat undangan. Pastikan email belum diundang.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      alert('Tautan disalin ke clipboard!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/team" className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Buat Undangan Tim
          </h1>
          <p className="text-slate-500 text-sm">Berikan akses internal kepada staf atau admin baru.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {inviteLink ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Undangan Berhasil Dibuat!</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Kirimkan tautan eksklusif ini kepada <strong>{formData.name}</strong> secara pribadi.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3 mb-6 max-w-lg mx-auto">
              <input 
                type="text" 
                readOnly 
                value={inviteLink} 
                className="flex-1 bg-transparent text-sm text-slate-600 font-mono focus:outline-none"
              />
              <button 
                onClick={copyToClipboard}
                className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors shrink-0"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <Link href="/admin/team" className="text-blue-600 font-bold hover:underline">
              Kembali ke Manajemen Team
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Nama staf"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 block">Alamat Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 block">Level Akses (Role)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`cursor-pointer border-2 rounded-xl p-4 flex gap-3 transition-colors ${formData.role === 'team' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="team" 
                    checked={formData.role === 'team'}
                    onChange={() => setFormData({...formData, role: 'team'})}
                    className="mt-1"
                  />
                  <div>
                    <span className="block font-bold text-slate-800">Team Internal</span>
                    <span className="text-xs text-slate-500">Akses terbatas sesuai divisi spesifik.</span>
                  </div>
                </label>

                <label className={`cursor-pointer border-2 rounded-xl p-4 flex gap-3 transition-colors ${formData.role === 'admin' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="admin" 
                    checked={formData.role === 'admin'}
                    onChange={() => setFormData({...formData, role: 'admin'})}
                    className="mt-1"
                  />
                  <div>
                    <span className="block font-bold text-slate-800">Administrator</span>
                    <span className="text-xs text-slate-500">Akses penuh ke seluruh sistem manajemen.</span>
                  </div>
                </label>
              </div>
            </div>

            {formData.role === 'team' && (
              <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-sm font-bold text-slate-700 block">Pilih Divisi Team</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <select
                    value={formData.team_division}
                    onChange={(e) => setFormData({...formData, team_division: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {divisions.map(div => (
                      <option key={div.id} value={div.id}>{div.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading || !formData.email || !formData.name}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Membuat Undangan...' : 'Generate Invite Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
