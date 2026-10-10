import { cafeClient, cors } from './_cafe.js';

// GET /api/menu -> { categories: [...], items: [...] } (available items only)
export default async function handler(req, res) {
  cors(res, 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const supabase = cafeClient();
    const [{ data: categories, error: catErr }, { data: items, error: itemErr }] =
      await Promise.all([
        supabase
          .from('menu_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('display_order'),
      ]);
    if (catErr) throw catErr;
    if (itemErr) throw itemErr;
    return res.status(200).json({ categories: categories ?? [], items: items ?? [] });
  } catch (e) {
    console.error('[menu]', e);
    return res.status(500).json({ error: 'menu_unavailable' });
  }
}
