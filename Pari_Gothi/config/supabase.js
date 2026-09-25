const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ [WARNING] SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables. Please check your .env file.'
  );
}

// Create a single Supabase client for interacting with database & auth
const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

module.exports = supabase;
