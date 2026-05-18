import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';

const RESERVED_ROUTES = [
  'feed', 'login', 'register', 'dashboard', 'admin', 
  'marketplace', 'pesantren', 'forum', 'program', 
  'donations', 'cart', 'checkout', 'orders', 
  'api', 'auth', 'post', 'u'
];

export default async function ShortProfileRoute({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  
  // 1. Check if it's a reserved route
  if (RESERVED_ROUTES.includes(username.toLowerCase())) {
    notFound();
  }

  // 2. Check if username exists in DB
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', username)
    .single();

  if (profile) {
    // Redirect to the canonical public profile route
    redirect(`/u/${profile.username}`);
  }

  // 3. Not found
  notFound();
}
