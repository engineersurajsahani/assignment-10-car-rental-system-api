const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] SUPABASE_URL / SUPABASE_ANON_KEY are not set. ' +
      'Copy .env.example to .env and fill in your Supabase project credentials.'
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function getClientForToken(accessToken) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

module.exports = { supabase, getClientForToken };
