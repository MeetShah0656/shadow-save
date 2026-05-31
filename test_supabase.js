const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/['"]/g, '');
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' || key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
        supabaseAnonKey = val;
      }
    }
  });
}

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Anon Key length:', supabaseAnonKey.length);
console.log('Anon Key preview:', supabaseAnonKey.substring(0, 15) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Credentials missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  try {
    console.log('Fetching transactions...');
    const { data, error } = await supabase.from('transactions').select('*').limit(5);
    if (error) {
      console.error('Query Error:', error);
    } else {
      console.log('Query Success! Transactions retrieved:', data);
    }
  } catch (err) {
    console.error('Thrown exception:', err);
  }
}

runTest();
