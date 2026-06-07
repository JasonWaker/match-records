const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Supabase environment variables are not set!');
  console.error('Please set SUPABASE_URL and SUPABASE_KEY in Vercel Environment Variables');
}

const supabase = createClient(
  SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_KEY || 'your-supabase-key'
);

module.exports = supabase;