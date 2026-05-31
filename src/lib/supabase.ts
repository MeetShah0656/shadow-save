import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project-url.supabase.co';
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  'placeholder-anon-key';

const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !hasKey) {
  console.warn(
    'Warning: Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are missing in environment variables. Auth and database sync will fall back or fail.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
