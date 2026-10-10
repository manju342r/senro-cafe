import { cafeClient, cors } from './_cafe.js';

// GET /api/orders-by-token?token=<uuid> -> { order, items }
// Customer access is scoped to the unguessable tracking token via RPC;
// no order ids or other customers' data are enumerable through this endpoint.
export default async function handler(req, res) {
  cors(res, 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const token = req.query?.token;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'missing_token' });
  }

  try {
    const supabase = cafeClient();
    const { data, error } = await supabase.rpc('get_order_by_token', { p_token: token });
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'order_not_found' });
    return res.status(200).json(data);
  } catch (e) {
    console.error('[orders-by-token]', e);
    return res.status(500).json({ error: 'lookup_failed' });
  }
}
