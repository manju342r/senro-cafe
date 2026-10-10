import { createClient } from '@supabase/supabase-js';

function cafeClient(authHeader) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const headers = {};
  if (authHeader) {
    headers.Authorization = authHeader;
    headers.apikey = anon;
  }
  return createClient(url, anon, { global: { headers } });
}

function cors(res, methods) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function getBearer(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h : '';
}

// Fail-fast staff check for analytics/AI endpoints. RLS would filter rows
// anyway, but an explicit 403 is clearer than a misleading empty 200.
export async function requireStaff(supabase) {
  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) return false;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', me.user.id)
    .single();
  return !!profile && ['staff', 'admin'].includes(profile.role);
}

export { cafeClient, cors };
