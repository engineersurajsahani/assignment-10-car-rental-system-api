const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// Use service_role key if available for backend administrative operations, otherwise fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Warning: SUPABASE_URL or Supabase API Key is not set in environment variables.');
}

/**
 * Standard Supabase client instance initialized with project credentials.
 * Used for general database operations, auth verification, and admin queries.
 */
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Helper to create a user-scoped Supabase client with the caller's JWT token.
 * Enables queries to respect Row Level Security (RLS) policies defined for authenticated users.
 * 
 * @param {string} accessToken - Supabase access token (JWT) from Authorization header
 * @returns {SupabaseClient}
 */
const createUserClient = (accessToken) => {
  return createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    process.env.SUPABASE_ANON_KEY || supabaseKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
};

module.exports = {
  supabase,
  createUserClient,
};
