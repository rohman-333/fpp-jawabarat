const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Checking profiles...");
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').limit(5);
  console.log("Profiles:", profiles, pErr);

  console.log("\nChecking products count and sample...");
  const { data: products, error: prodErr } = await supabase.from('products').select('*').limit(2);
  console.log("Products:", products, prodErr);

  console.log("\nChecking product categories...");
  const { data: categories, error: catErr } = await supabase.from('product_categories').select('*').limit(5);
  console.log("Categories:", categories, catErr);

  console.log("\nChecking programs...");
  const { data: programs, error: progErr } = await supabase.from('programs').select('*').limit(5);
  console.log("Programs:", programs, progErr);
}

run();
