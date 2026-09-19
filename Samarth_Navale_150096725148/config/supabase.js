const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || 'https://mock.supabase.co';
const key = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'mock_key';

let supabase;
try {
  supabase = createClient(url, key);
} catch (e) {
  supabase = null;
}

module.exports = supabase;
