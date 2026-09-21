const { createClient } = require("@supabase/supabase-js");


const SUPABASE_URL = "https://ekpukrluuswzvoicpiuy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrcHVrcmx1dXN3enZvaWNwaXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5ODI4MjYsImV4cCI6MjEwNTU1ODgyNn0.SwozIRjU3thA8KVirOGUcHqGd3pVOK9VdOpuZJE0NyU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = supabase;
