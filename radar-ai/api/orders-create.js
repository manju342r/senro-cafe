import { cafeClient, cors } from './_cafe.js';

// POST /api/orders-create { items: [{menu_item_id, quantity, customizations?}], customer_name?, idempotency_key }
// Prices/availability are re-validated from the DB inside create_order(); the
// client total is never trusted. Same idempotency_key returns the original order.
export default async function handler(req, res) {
  cors(res, 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { items, customer_name = null, idempotency_key = null } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'empty_order' });
  }

  try {
    const supabase = cafeClient();
    const { data, error } = await supabase.rpc('create_order', {
      p_items: items,
      p_customer_name: customer_name,
      p_idempotency_key: idempotency_key,
    });
    if (error) {
      const msg = error.message ?? '';
      if (/unavailable|not_found|invalid_quantity|empty_order|too_many/.test(msg)) {
        return res.status(400).json({ error: msg });
      }
      throw error;
    }
    return res.status(200).json({ order: data });
  } catch (e) {
    console.error('[orders-create]', e);
    return res.status(500).json({ error: 'order_failed' });
  }
}
