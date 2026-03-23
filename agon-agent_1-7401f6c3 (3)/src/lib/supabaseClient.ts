import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://fbrofkbbewxjalmxvhlm.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_F54555Uehy2KTTWgYRF5hg_RzrG3XwI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
