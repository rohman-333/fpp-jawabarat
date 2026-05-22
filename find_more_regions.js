const dns = require('dns').promises;
const { Client } = require('pg');

const regions = [
  'ap-northeast-1', // Tokyo
  'ap-northeast-2', // Seoul
  'ap-south-1',     // Mumbai
  'ap-southeast-2', // Sydney
  'eu-west-3',      // Paris
  'us-east-2'       // Ohio
];

async function check() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    try {
      await dns.lookup(host);
      console.log(`Region resolved DNS: ${region}`);
      
      const ports = [6543, 5432];
      for (const port of ports) {
        const connectionString = `postgresql://postgres.tazbsyjulkmyscohiwgq:FppJabar2026!@${host}:${port}/postgres`;
        const client = new Client({
          connectionString,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000
        });
        try {
          console.log(`Trying ${region} on port ${port}...`);
          await client.connect();
          console.log(`SUCCESS CONNECTED to region: ${region} on port ${port}!!!`);
          await client.end();
          return;
        } catch (err) {
          console.log(`Failed for ${region}:${port} - ${err.message}`);
        }
      }
    } catch (e) {
      // DNS resolution failed
    }
  }
  console.log("Check complete.");
}

check();
