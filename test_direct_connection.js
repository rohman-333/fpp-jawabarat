const { Client } = require('pg');

async function test() {
  const hosts = [
    'db.tazbsyjulkmyscohiwgq.supabase.co',
    'aws-0-ap-southeast-1.pooler.supabase.com'
  ];
  
  for (const host of hosts) {
    console.log(`Testing host: ${host}`);
    const connectionString = host.includes('pooler')
      ? `postgresql://postgres.tazbsyjulkmyscohiwgq:FppJabar2026!@${host}:6543/postgres`
      : `postgresql://postgres:FppJabar2026!@${host}:5432/postgres`;
      
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    
    try {
      await client.connect();
      console.log(`SUCCESS CONNECTED to ${host}!!!`);
      const res = await client.query('SELECT current_user, now();');
      console.log('Result:', res.rows[0]);
      await client.end();
      return;
    } catch (err) {
      console.log(`Failed for ${host} - ${err.message}`);
    }
  }
}

test();
