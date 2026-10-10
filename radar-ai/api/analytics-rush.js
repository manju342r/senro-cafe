import { cafeClient, cors, getBearer, requireStaff } from './_cafe.js';

// GET /api/analytics-rush?from=ISO&to=ISO
// Staff only. Deterministic rush-hour metrics from order timestamps:
// per-hour order volume, median kitchen time (preparing→ready, falling back
// to created→ready), delayed counts, and items most present in delayed orders.
// Correlation is reported as-is; causation ("X causes delays") is NOT claimed.
export default async function handler(req, res) {
  cors(res, 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const bearer = getBearer(req);
  if (!bearer) return res.status(401).json({ error: 'auth_required' });

  const { from, to } = req.query ?? {};

  try {
    const supabase = cafeClient(bearer);
    if (!(await requireStaff(supabase))) return res.status(403).json({ error: 'forbidden' });

    let q = supabase
      .from('orders')
      .select('id, status, created_at, preparing_at, ready_at, estimated_ready_at')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true })
      .limit(2000);
    if (from) q = q.gte('created_at', from);
    if (to) q = q.lte('created_at', to);
    const { data: orders, error: oErr } = await q;
    if (oErr) throw oErr;

    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      orders: 0,
      preps: [],
      delayed: 0,
    }));

    const delayedIds = [];
    for (const o of orders ?? []) {
      const h = new Date(o.created_at).getHours();
      const b = hours[h];
      b.orders += 1;
      const start = o.preparing_at ?? o.created_at;
      if (o.ready_at && start) b.preps.push((new Date(o.ready_at) - new Date(start)) / 1000);
      const readyMs = o.ready_at ? new Date(o.ready_at).getTime() : null;
      const estMs = o.estimated_ready_at ? new Date(o.estimated_ready_at).getTime() : null;
      let delayed = false;
      if (readyMs !== null && estMs !== null) delayed = readyMs > estMs;
      else if (readyMs === null && estMs !== null && ['received', 'accepted', 'preparing'].includes(o.status))
        delayed = Date.now() > estMs;
      if (delayed) {
        b.delayed += 1;
        delayedIds.push(o.id);
      }
    }

    const hourly = hours
      .map((b) => {
        const sorted = b.preps.sort((x, y) => x - y);
        const median =
          sorted.length === 0 ? null : Math.round(sorted[Math.floor(sorted.length / 2)]);
        return { hour: b.hour, orders: b.orders, median_prep_s: median, delayed: b.delayed };
      })
      .filter((b) => b.orders > 0);

    // Items most present in delayed orders (co-occurrence, not causation).
    let delayedItems = [];
    if (delayedIds.length > 0) {
      for (let i = 0; i < delayedIds.length; i += 200) {
        const { data, error } = await supabase
          .from('order_items')
          .select('menu_item_id, item_name, quantity')
          .in('order_id', delayedIds.slice(i, i + 200));
        if (error) throw error;
        const agg = new Map();
        for (const l of data ?? []) {
          const cur = agg.get(l.menu_item_id) ?? { name: l.item_name, qty: 0 };
          cur.qty += l.quantity;
          agg.set(l.menu_item_id, cur);
        }
        delayedItems = [...agg.entries()].map(([id, v]) => ({
          menu_item_id: id,
          name: v.name,
          delayed_qty: v.qty,
        }));
      }
      delayedItems.sort((a, b) => b.delayed_qty - a.delayed_qty);
    }

    const peak = [...hourly].sort((a, b) => b.orders - a.orders).slice(0, 3);

    return res.status(200).json({
      hourly,
      peak_hours: peak,
      delayed_items: delayedItems.slice(0, 10),
      orders_count: (orders ?? []).length,
      note: 'Delayed co-occurrence does not imply an item caused the delay; busy periods slow everything.',
    });
  } catch (e) {
    const msg = e?.message ?? '';
    if (/not_authorized|JWT|auth/i.test(msg)) return res.status(403).json({ error: 'forbidden' });
    console.error('[analytics-rush]', e);
    return res.status(500).json({ error: 'analytics_failed' });
  }
}
