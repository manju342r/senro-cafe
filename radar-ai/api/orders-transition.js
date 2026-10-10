import { cafeClient, cors, getBearer } from './_cafe.js';

// POST /api/orders-transition { order_id, to_status, notes? }
// Staff only: the caller's JWT is forwarded so transition_order() can enforce
// is_staff() server-side. Transition legality is enforced in SQL, not here.
export default async function handler(req, res) {
  cors(res, 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const bearer = getBearer(req);
  if (!bearer) return res.status(401).json({ error: 'auth_required' });

  const { order_id, to_status, notes = null } = req.body ?? {};
  if (!order_id || !to_status) {
    return res.status(400).json({ error: 'missing_params' });
  }

  try {
    const supabase = cafeClient(bearer);
    const { data, error } = await supabase.rpc('transition_order', {
      p_order_id: order_id,
      p_to_status: to_status,
      p_notes: notes,
    });
    if (error) {
      const msg = error.message ?? '';
      if (/not_authorized/.test(msg)) return res.status(403).json({ error: 'forbidden' });
      if (/illegal_transition/.test(msg)) return res.status(400).json({ error: msg });
      if (/order_not_found/.test(msg)) return res.status(404).json({ error: msg });
      throw error;
    }
    return res.status(200).json({ order: data });
  } catch (e) {
    console.error('[orders-transition]', e);
    return res.status(500).json({ error: 'transition_failed' });
  }
}
