import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '../types/database';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in the CaféOS Supabase project values.'
  );
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL ?? 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
);

export async function getSessionProfile(): Promise<{
  user: import('@supabase/supabase-js').User | null;
  profile: Profile | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return { user, profile: (profile ?? null) as Profile | null };
}

export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'staff' || role === 'admin';
}
