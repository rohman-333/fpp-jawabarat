const { Client } = require('pg');

async function test() {
  const host = 'db.tazbsyjulkmyscohiwgq.supabase.co';
  const connectionString = `postgresql://postgres:FppJabar2026!@${host}:5432/postgres`;
    
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });
  
  try {
    await client.connect();
    console.log("Connected! Listing policies on public.products:");
    const res = await client.query(`
      SELECT policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'products';
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
  } catch (err) {
    console.log("Failed:", err.message);
  }
}

test();
