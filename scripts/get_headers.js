async function run() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tazbsyjulkmyscohiwgq.supabase.co') + '/rest/v1/';
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key';
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': apiKey
      }
    });
    console.log("Status:", res.status);
    console.log("Headers:", JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
