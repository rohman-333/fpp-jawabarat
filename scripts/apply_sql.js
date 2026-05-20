const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const regions = [
    'us-west-2',     // Oregon (highly common)
    'eu-west-1',     // Ireland (highly common)
    'eu-west-2',     // London
    'ca-central-1',  // Canada
    'sa-east-1'      // São Paulo
  ];

  for (const region of regions) {
    const connectionString = `postgresql://postgres.tazbsyjulkmyscohiwgq:FppJabar2026!@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    const client = new Client({ 
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    
    try {
      console.log(`Trying to connect to region: ${region}...`);
      await client.connect();
      console.log(`Connected successfully to region: ${region}!`);
      
      const sqlPath = path.join(__dirname, '../supabase/migrations/050_courier_dispatch_system.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      console.log("Executing migration SQL...");
      await client.query(sql);
      console.log("Migration executed successfully!");
      await client.end();
      return; // Stop if success
    } catch (err) {
      console.error(`Failed for region: ${region}. Error: ${err.message}`);
      try { await client.end(); } catch (e) {}
    }
  }
  
  console.log("All tried regions failed.");
}

run();
