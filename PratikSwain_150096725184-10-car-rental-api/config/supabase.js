const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder_key';
const anonKey = process.env.SUPABASE_ANON_KEY || serviceKey;

if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_ANON_KEY)) {
  console.warn(
    '[Supabase Config Warning]: SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be defined in .env'
  );
}

/**
 * Dedicated Database Supabase Client.
 * Uses SUPABASE_SERVICE_ROLE_KEY to perform server-side queries and bypass RLS.
 * Global headers explicitly enforce the Service Role Authorization header
 * so database operations are never blocked by missing RLS policies.
 */
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      Authorization: `Bearer ${serviceKey}`
    }
  }
});

/**
 * Dedicated Auth Client.
 * Used exclusively for customer signUp and signInWithPassword so that user login
 * sessions never mutate the service-role Authorization header of the database client.
 */
const authClient = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Helper to verify JWT token in an isolated client context.
 */
const verifyToken = async (token) => {
  const verifier = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  return verifier.auth.getUser(token);
};

module.exports = supabase;
module.exports.supabase = supabase;
module.exports.authClient = authClient;
module.exports.verifyToken = verifyToken;
