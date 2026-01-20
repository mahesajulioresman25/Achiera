import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

// Create a singleton client, but only if the URL is provided to avoid crashing at build time
export const supabase = supabaseUrl
    ? createClient(supabaseUrl, supabaseKey)
    : null as any; // Routes using this must be marked dynamic to avoid execution at build
