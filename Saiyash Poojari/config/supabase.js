const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let rawUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_URL.includes('your-supabase-project')) {
  console.warn('⚠️ WARNING: SUPABASE_URL and SUPABASE_ANON_KEY are missing or unconfigured in .env');
  console.warn('👉 Please set your real SUPABASE_URL and SUPABASE_ANON_KEY in your .env file to connect to your Supabase PostgreSQL Database and Auth.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
