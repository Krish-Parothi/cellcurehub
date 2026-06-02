const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in env!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching users from database...");
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, shop_id, is_active, created_at')
    .order('email');

  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  console.log(`Found ${users.length} users:`);
  console.table(users);
}

run();
