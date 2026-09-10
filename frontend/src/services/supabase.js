import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ajkaiffhcmygofkvzxmw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqa2FpZmZoY215Z29ma3Z6eG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NTc5ODYsImV4cCI6MjEwNDUzMzk4Nn0.0nPbkzomQd57zl9X_tDLvHDlzDt6_LGgdGrpHg_0-Bk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
