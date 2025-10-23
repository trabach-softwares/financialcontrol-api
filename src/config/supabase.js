import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for authenticated requests
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role for privileged operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
