import { createClient } from '@supabase/supabase-js';
import { loadEnv, requireEnv } from './config/loadEnv.js';

loadEnv();

const supabaseUrl = requireEnv('SUPABASE_URL');
const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
