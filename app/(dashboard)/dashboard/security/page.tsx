import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChangePasswordForm } from '@/components/dashboard/ChangePasswordForm'
import { PushNotificationManager } from '@/components/dashboard/PushNotificationManager'
import { DashboardSidebar } from '@/components/shared/DashboardSidebar'
import { DashboardTopbar } from '@/components/shared/DashboardTopbar'

export const metadata = {
  title: 'Keamanan Akun | WIBAWA NUSANTARA',
  description: 'Pengaturan keamanan akun WIBAWA NUSANTARA',
}

export default async function SecurityPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={profile?.role === 'superadmin' || profile?.role === 'admin' || profile?.role === 'operator' || profile?.role === 'team'} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="Keamanan Akun" userName={profile?.name || 'User'} avatarUrl={profile?.avatar_url} />

        <main className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Keamanan Akun</h1>
              <p className="text-sm text-slate-500 mt-1">
                Kelola password dan pengaturan keamanan akun Anda
              </p>
            </div>

            <div className="mt-8 space-y-8">
              <ChangePasswordForm />
              
              <div className="pt-4 border-t border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Notifikasi Push</h2>
                <PushNotificationManager />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
