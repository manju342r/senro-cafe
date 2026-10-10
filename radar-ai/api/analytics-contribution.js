import { cafeClient, cors, getBearer, requireStaff } from './_cafe.js';

// GET /api/analytics-contribution?from=ISO&to=ISO&category=<uuid>
// Staff only. Every figure derives from stored rows:
// revenue + units from order_items snapshots (cancelled orders excluded),
// unit cost from recipe_ingredients × ingredients. Items without a recipe
// report cost: null (shown as "unknown", never silently zero).
export default async function handler(req, res) {
  cors(res, 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const bearer = getBearer(req);
  if (!bearer) return res.status(401).json({ error: 'auth_required' });

  const { from, to, category } = req.query ?? {};

  try {
    const supabase = cafeClient(bearer);
    if (!(await requireStaff(supabase))) return res.status(403).json({ error: 'forbidden' });

    const [itemsRes, recipesRes] = await Promise.all([
      supabase.from('menu_items').select('id, name, category_id, price_cents'),
      supabase
        .from('recipe_ingredients')
        .select('menu_item_id, quantity, ingredients(cost_per_unit_cents)'),
    ]);
    if (itemsRes.error) throw itemsRes.error;
    if (recipesRes.error) throw recipesRes.error;

    // Unit cost per item; null when no recipe rows exist.
    const unitCost = new Map();
    const hasRecipe = new Set();
    for (const r of recipesRes.data ?? []) {
      hasRecipe.add(r.menu_item_id);
      const qty = Number(r.quantity);
      const cpu = r.ingredients?.cost_per_unit_cents;
      if (cpu === null || cpu === undefined) {
        unitCost.set(r.menu_item_id, null);
        continue;
      }
      if (unitCost.get(r.menu_item_id) !== null) {
        unitCost.set(
          r.menu_item_id,
          Math.round(((unitCost.get(r.menu_item_id) ?? 0) + qty * Number(cpu)) * 100) / 100
        );
      }
    }

    let orderQuery = supabase
      .from('orders')
      .select('id')
      .neq('status', 'cancelled');
    if (from) orderQuery = orderQuery.gte('created_at', from);
    if (to) orderQuery = orderQuery.lte('created_at', to);
    const { data: ordersIn, error: oErr } = await orderQuery;
    if (oErr) throw oErr;
    const orderIds = (ordersIn ?? []).map((o) => o.id);

    let lines = [];
    if (orderIds.length > 0) {
      // Chunk to stay under URL/filter limits.
      for (let i = 0; i < orderIds.length; i += 200) {
        const chunk = orderIds.slice(i, i + 200);
        const { data, error } = await supabase
          .from('order_items')
          .select('menu_item_id, quantity, item_price_cents')
          .in('order_id', chunk);
        if (error) throw error;
        lines = lines.concat(data ?? []);
      }
    }

    const agg = new Map();
    for (const l of lines) {
      const cur = agg.get(l.menu_item_id) ?? { units: 0, revenue: 0 };
      cur.units += l.quantity;
      cur.revenue += l.quantity * l.item_price_cents;
      agg.set(l.menu_item_id, cur);
    }

    let items = itemsRes.data ?? [];
    if (category) items = items.filter((i) => i.category_id === category);

    const rows = items.map((i) => {
      const a = agg.get(i.id) ?? { units: 0, revenue: 0 };
      const cost = hasRecipe.has(i.id) ? (unitCost.get(i.id) ?? null) : null;
      const margin = cost === null ? null : i.price_cents - Math.round(cost);
      const totalContribution = cost === null ? null : a.revenue - Math.round(cost * a.units);
      return {
        menu_item_id: i.id,
        name: i.name,
        price_cents: i.price_cents,
        unit_cost_cents: cost === null ? null : Math.round(cost),
        cost_known: cost !== null,
        margin_cents: margin,
        units_sold: a.units,
        revenue_cents: a.revenue,
        total_contribution_cents: totalContribution,
      };
    });

    rows.sort((a, b) => (b.total_contribution_cents ?? -1) - (a.total_contribution_cents ?? -1));

    const totals = rows.reduce(
      (t, r) => ({
        revenue_cents: t.revenue_cents + r.revenue_cents,
        units: t.units + r.units_sold,
        contribution_cents: t.contribution_cents + (r.total_contribution_cents ?? 0),
        unknown_cost_items: t.unknown_cost_items + (r.cost_known ? 0 : 1),
      }),
      { revenue_cents: 0, units: 0, contribution_cents: 0, unknown_cost_items: 0 }
    );

    return res.status(200).json({ rows, totals, orders_count: orderIds.length });
  } catch (e) {
    const msg = e?.message ?? '';
    if (/not_authorized|JWT|auth/i.test(msg)) return res.status(403).json({ error: 'forbidden' });
    console.error('[analytics-contribution]', e);
    return res.status(500).json({ error: 'analytics_failed' });
  }
}
