const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQueries() {
  console.log("1. Testing primary products query...");
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug, description, price, stock, category, category_id, image_url, status, seller_id, created_at')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Primary query failed with error:", error);
    } else {
      console.log(`Primary query succeeded! Fetched ${data.length} products.`);
      if (data.length > 0) console.log("Sample:", data[0]);
    }
  } catch (err) {
    console.error("Primary query exception:", err);
  }

  console.log("\n2. Testing select * products query...");
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Select * query failed with error:", error);
    } else {
      console.log(`Select * succeeded! Fetched ${data.length} products.`);
    }
  } catch (err) {
    console.error("Select * query exception:", err);
  }

  console.log("\n3. Testing profile query...");
  try {
    // Let's test profile query for a user (we will use first profile ID)
    const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
    if (profiles && profiles.length > 0) {
      const targetId = profiles[0].id;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, is_seller, seller_status, has_pesantren, pesantren_id, avatar_url')
        .eq('id', targetId)
        .single();
      if (error) {
        console.error("Profile query failed with error:", error);
      } else {
        console.log("Profile query succeeded:", data);
      }
    } else {
      console.log("No profiles found to test profile query.");
    }
  } catch (err) {
    console.error("Profile query exception:", err);
  }
}

testQueries();
