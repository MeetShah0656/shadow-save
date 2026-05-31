import { createClient } from '@supabase/supabase-js';

const getCleanUrl = (val: string | undefined, fallback: string): string => {
  if (!val) return fallback;
  const trimmed = val.trim().replace(/['"]/g, '');
  if (
    trimmed === '' || 
    trimmed === 'undefined' || 
    trimmed === 'null' || 
    (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))
  ) {
    return fallback;
  }
  return trimmed;
};

const getCleanKey = (val: string | undefined, fallback: string): string => {
  if (!val) return fallback;
  const trimmed = val.trim().replace(/['"]/g, '');
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
    return fallback;
  }
  return trimmed;
};

const supabaseUrl = getCleanUrl(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'https://placeholder-project-url.supabase.co'
);

const supabaseAnonKey = getCleanKey(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  'placeholder-anon-key'
);

const hasUrl = (
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_URL.trim() !== '' && 
  process.env.NEXT_PUBLIC_SUPABASE_URL.trim() !== 'undefined'
);
const hasKey = (
  (!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() !== '' && 
   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim() !== 'undefined') ||
  (!!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && 
   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.trim() !== '' && 
   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.trim() !== 'undefined')
);

if (!hasUrl || !hasKey) {
  console.warn(
    'Warning: Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are missing, empty, or undefined in environment variables. Auth and database sync will fall back or fail.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use browser localStorage for session persistence across reloads.
    // The typeof check ensures this works safely in Next.js SSR/build environments.
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});
