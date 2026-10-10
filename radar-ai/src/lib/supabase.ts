import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Profile } from '../types';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!URL || !ANON) {
  console.warn('[cafe] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase: SupabaseClient = createClient(
  URL ?? 'https://placeholder.supabase.co',
  ANON ?? 'placeholder-anon-key'
);

export async function sessionProfile(): Promise<{ userId: string | null; role: string | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, role: null };
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return { userId: user.id, role: (data as Profile | null)?.role ?? null };
}

export async function staffHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) h.Authorization = `Bearer ${session.access_token}`;
  return h;
}
