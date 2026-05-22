const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'app');

const placeholders = [
  // Social
  { route: '(social)/feed/following/page.tsx', title: 'Postingan Diikuti' },
  { route: '(social)/feed/me/page.tsx', title: 'Postingan Saya' },
  
  // Public/General
  { route: '(public)/cart/page.tsx', title: 'Keranjang Belanja' },
  { route: '(public)/checkout/page.tsx', title: 'Checkout' },
  { route: '(public)/orders/page.tsx', title: 'Riwayat Pesanan' },
  { route: '(public)/documents/page.tsx', title: 'Dokumen & Regulasi' },
  { route: '(public)/library/page.tsx', title: 'Perpustakaan Digital' },
  { route: '(public)/articles/page.tsx', title: 'Artikel & Dakwah' },
  { route: '(public)/news/page.tsx', title: 'Kabar WIBAWA NUSANTARA' },
  { route: '(public)/donations/page.tsx', title: 'Donasi & Kebaikan' },
  { route: '(public)/ai/page.tsx', title: 'Ruang AI' },
  { route: '(public)/assistance/page.tsx', title: 'Bantuan & Layanan' },
  { route: '(public)/courier/page.tsx', title: 'Layanan Kurir' },
  { route: '(public)/notifications/page.tsx', title: 'Notifikasi' },
  
  // Admin
  { route: '(admin)/admin/donations/page.tsx', title: 'Kelola Donasi' },
  { route: '(admin)/admin/documents/page.tsx', title: 'Kelola Dokumen' },
  { route: '(admin)/admin/reports/page.tsx', title: 'Laporan Sistem' },
  { route: '(admin)/admin/moderation/page.tsx', title: 'Moderasi Konten' },
  
  // Dashboard
  { route: '(dashboard)/dashboard/orders/page.tsx', title: 'Pesanan Marketplace' },
  { route: '(dashboard)/dashboard/documents/page.tsx', title: 'Dokumen Saya' },
  { route: '(dashboard)/dashboard/settings/page.tsx', title: 'Pengaturan Tambahan' }
];

const dashboardLayoutTemplate = `import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={false} 
        userName={profile?.name || 'User'} 
        avatarUrl={profile?.avatar_url}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="{TITLE}" userName={profile?.name || 'User'} avatarUrl={profile?.avatar_url} />
        <main className="p-4 md:p-8 flex-1 flex">
          <PlaceholderPage title="{TITLE}" />
        </main>
      </div>
    </div>
  );
}`;

const adminLayoutTemplate = `import { PlaceholderPage } from '@/components/shared/PlaceholderPage';
import { DashboardSidebar } from '@/components/shared/DashboardSidebar';
import { DashboardTopbar } from '@/components/shared/DashboardTopbar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 flex pb-20 md:pb-0">
      <DashboardSidebar 
        isAdmin={true} 
        userName={profile?.name || 'Admin'} 
        avatarUrl={profile?.avatar_url}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar title="{TITLE}" userName={profile?.name || 'Admin'} avatarUrl={profile?.avatar_url} />
        <main className="p-4 md:p-8 flex-1 flex">
          <PlaceholderPage title="{TITLE}" />
        </main>
      </div>
    </div>
  );
}`;

const socialLayoutTemplate = `import { PlaceholderPage } from '@/components/shared/PlaceholderPage';

export default function Page() {
  return (
    <div className="max-w-[680px] mx-auto xl:mx-0 w-full pt-4 md:pt-8 px-4 md:px-0 flex-1 flex flex-col">
      <PlaceholderPage title="{TITLE}" />
    </div>
  );
}`;

const publicLayoutTemplate = `import { PlaceholderPage } from '@/components/shared/PlaceholderPage';

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto w-full pt-8 px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
      <PlaceholderPage title="{TITLE}" />
    </div>
  );
}`;

placeholders.forEach(({ route, title }) => {
  const fullPath = path.join(baseDir, route);
  const dirPath = path.dirname(fullPath);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  if (!fs.existsSync(fullPath)) {
    let content = publicLayoutTemplate;
    
    if (route.startsWith('(dashboard)')) {
      content = dashboardLayoutTemplate;
    } else if (route.startsWith('(admin)')) {
      content = adminLayoutTemplate;
    } else if (route.startsWith('(social)')) {
      content = socialLayoutTemplate;
    }
    
    content = content.replace(/{TITLE}/g, title);
    fs.writeFileSync(fullPath, content);
    console.log('Created:', fullPath);
  }
});
