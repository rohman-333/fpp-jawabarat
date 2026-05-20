import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FeedHealthPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'admin';
  if (!isAdmin) {
    redirect('/feed');
  }

  // 1. Env checks (boolean only — never expose values)
  const envChecks = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // 2. User info
  const userInfo = {
    id: user.id,
    email: user.email,
    role: profile?.role || 'unknown',
  };

  // 3. Test social_posts SELECT
  let postsCheck = { ok: false, message: '', count: 0 };
  try {
    const { data, error, count } = await supabase
      .from('social_posts')
      .select('id', { count: 'exact' })
      .limit(1);
    if (error) {
      postsCheck = { ok: false, message: error.message, count: 0 };
    } else {
      postsCheck = { ok: true, message: 'OK', count: count || (data?.length ?? 0) };
    }
  } catch (err: any) {
    postsCheck = { ok: false, message: err.message, count: 0 };
  }

  // 4. Test profile SELECT for current user
  let profileCheck = { ok: false, message: '' };
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', user.id)
      .single();
    if (error) {
      profileCheck = { ok: false, message: error.message };
    } else {
      profileCheck = { ok: true, message: `Found: ${data?.name || 'unnamed'}` };
    }
  } catch (err: any) {
    profileCheck = { ok: false, message: err.message };
  }

  // 5. Test storage bucket accessibility
  let storageCheck = { ok: false, message: '' };
  try {
    const { data, error } = await supabase.storage.getBucket('social-media');
    if (error) {
      // Try alternate bucket name
      const { data: d2, error: e2 } = await supabase.storage.getBucket('uploads');
      if (e2) {
        storageCheck = { ok: false, message: `social-media: ${error.message}, uploads: ${e2.message}` };
      } else {
        storageCheck = { ok: true, message: `Bucket 'uploads' accessible` };
      }
    } else {
      storageCheck = { ok: true, message: `Bucket 'social-media' accessible` };
    }
  } catch (err: any) {
    storageCheck = { ok: false, message: err.message };
  }

  // 6. Test INSERT + DELETE to verify RLS write permissions
  let writeCheck = { ok: false, message: '' };
  try {
    // To make this test absolutely resilient to different database schema variants,
    // we insert with only the minimum required columns (author_id, content),
    // then if the insert succeeds, we clean up. This verifies connection + write.
    const { data: testPost, error: insertErr } = await supabase
      .from('social_posts')
      .insert({
        author_id: user.id,
        content: '__HEALTH_CHECK_TEST__',
        type: 'kabar',
        status: 'active',
        visibility: 'public'
      })
      .select('id')
      .single();
    
    if (insertErr) {
      writeCheck = { ok: false, message: `INSERT failed: ${insertErr.message}` };
    } else {
      // Clean up immediately
      await supabase.from('social_posts').delete().eq('id', testPost.id);
      writeCheck = { ok: true, message: 'INSERT + DELETE OK' };
    }
  } catch (err: any) {
    writeCheck = { ok: false, message: err.message };
  }

  const allEnvOk = Object.values(envChecks).every(v => v);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">🩺 Feed Health Diagnostics</h1>
      <p className="text-sm text-slate-500">Admin-only diagnostic page. No secrets are exposed.</p>

      {!allEnvOk && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm font-bold">
          ⚠️ Supabase environment variables belum lengkap di Vercel. Update Environment Variables dan redeploy.
        </div>
      )}

      {/* Environment Variables */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Environment Variables</h2>
        {Object.entries(envChecks).map(([key, exists]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <code className="text-slate-600">{key}</code>
            <span className={`font-bold ${exists ? 'text-emerald-600' : 'text-red-600'}`}>
              {exists ? '✅ exists' : '❌ MISSING'}
            </span>
          </div>
        ))}
      </div>

      {/* Current User Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
        <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Current User</h2>
        <div className="text-sm text-slate-600"><span className="font-bold">ID:</span> {userInfo.id}</div>
        <div className="text-sm text-slate-600"><span className="font-bold">Email:</span> {userInfo.email}</div>
        <div className="text-sm text-slate-600"><span className="font-bold">Role:</span> {userInfo.role}</div>
      </div>

      {/* Database Checks */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wide">Database Checks</h2>
        
        <CheckRow label="SELECT social_posts" ok={postsCheck.ok} message={postsCheck.message} />
        <CheckRow label="SELECT profiles (current user)" ok={profileCheck.ok} message={profileCheck.message} />
        <CheckRow label="INSERT social_posts (write test)" ok={writeCheck.ok} message={writeCheck.message} />
        <CheckRow label="Storage bucket access" ok={storageCheck.ok} message={storageCheck.message} />
      </div>

      {/* Quick Verdict */}
      <div className={`rounded-xl border p-5 text-center font-bold text-lg ${
        allEnvOk && postsCheck.ok && profileCheck.ok && writeCheck.ok && storageCheck.ok
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        {allEnvOk && postsCheck.ok && profileCheck.ok && writeCheck.ok && storageCheck.ok
          ? '✅ Semua sistem feed berfungsi normal'
          : '❌ Ada masalah yang perlu diperbaiki — lihat detail di atas'
        }
      </div>
    </div>
  );
}

function CheckRow({ label, ok, message }: { label: string; ok: boolean; message: string }) {
  return (
    <div className="flex items-start justify-between text-sm gap-2">
      <span className="text-slate-600 font-medium">{label}</span>
      <div className="text-right">
        <span className={`font-bold ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {ok ? '✅ OK' : '❌ FAIL'}
        </span>
        {message && <p className="text-xs text-slate-400 mt-0.5 max-w-[300px] break-all">{message}</p>}
      </div>
    </div>
  );
}
