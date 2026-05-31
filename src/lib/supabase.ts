import { createClient } from '@supabase/supabase-js';

const getCleanEnv = (val: string | undefined, fallback: string): string => {
  if (!val) return fallback;
  const trimmed = val.trim().replace(/['"]/g, '');
  return trimmed === '' ? fallback : trimmed;
};

const supabaseUrl = getCleanEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'https://placeholder-project-url.supabase.co'
);

const supabaseAnonKey = getCleanEnv(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  'placeholder-anon-key'
);

const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.trim() !== '';
const hasKey = (
  (!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() !== '') ||
  (!!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.trim() !== '')
);

if (!hasUrl || !hasKey) {
  console.warn(
    'Warning: Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are missing or empty in environment variables. Auth and database sync will fall back or fail.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
