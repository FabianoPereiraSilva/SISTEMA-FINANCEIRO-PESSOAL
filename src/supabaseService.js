const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Retorna cliente com a sessão/token do usuário para acionar o RLS nativo
function getSupabaseClientForUser(token) {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// Cliente anônimo geral
let anonClient = null;
function getAnonClient() {
  if (!anonClient && supabaseUrl && supabaseAnonKey) {
    anonClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return anonClient;
}

module.exports = {
  getSupabaseClientForUser,
  getAnonClient
};
