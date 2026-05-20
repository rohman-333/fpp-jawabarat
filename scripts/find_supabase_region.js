const dns = require('dns').promises;
const { Client } = require('pg');

const regions = [
  'ap-southeast-1', // Singapore (highly likely)
  'us-east-1',      // N. Virginia
  'us-west-1',      // N. California
  'us-west-2',      // Oregon
  'eu-central-1',   // Frankfurt
  'eu-west-1',      // Ireland
  'eu-west-2',      // London
  'ca-central-1',   // Canada
  'sa-east-1'       // São Paulo
];

const ports = [6543, 5432];

async function check() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    try {
      await dns.lookup(host);
      console.log(`Region resolved DNS: ${region}`);
      
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
