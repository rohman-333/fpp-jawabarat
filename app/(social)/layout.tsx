import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SocialSidebar } from '@/components/social/SocialSidebar';
import { RightRail } from '@/components/social/RightRail';
import { InstallAppPrompt } from '@/components/shared/InstallAppPrompt';

export default async function SocialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, pesantren(name, logo_url)')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-100/50 flex">
      {/* Left Sidebar */}
      <SocialSidebar profile={profile} />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 w-full pt-[calc(3.5rem+env(safe-area-inset-top))] md:pt-0">
        <div className="max-w-[1080px] mx-auto px-0 md:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,680px)_320px] gap-6 xl:gap-8 items-start justify-center xl:justify-start">
            <main className="w-full pb-20 md:pb-8 min-w-0">
              {children}
            </main>
            
            {/* Right Sidebar (Desktop only) */}
            <RightRail currentUserId={user.id} />
          </div>
        </div>
      </div>
      
      <InstallAppPrompt />
    </div>
  );
}
