require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function test() {
    console.log("Calling RPC...");
    const { data, error } = await supabase.rpc('process_weekly_leagues');
    console.log("Data:", data);
    console.log("Error:", error);
}

test();
