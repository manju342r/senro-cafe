import { cafeClient, cors, getBearer } from './_cafe.js';

// POST /api/ai-analyze { days?: number }
// Staff only. Evidence-backed recommendations from REAL stored data:
//  1. recompute contribution + rush stats server-side (same logic as analytics),
//  2. derive deterministic findings (thin margins, delayed co-occurrence),
//  3. optionally ask the LLM to phrase the experiment (1 call, failure-safe),
//  4. persist recommendation + evidence snapshots, return them.
// Without an LLM key the analysis is rule-based and labelled as such —
// never presented as model-generated.
export default async function handler(req, res) {
  cors(res, 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const bearer = getBearer(req);
  if (!bearer) return res.status(401).json({ error: 'auth_required' });

  const days = Math.min(60, Math.max(1, Number(req.body?.days ?? 14)));
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  try {
    const supabase = cafeClient(bearer);

    // Staff check (RLS would also block, but fail fast with a clear error).
    const { data: me } = await supabase.auth.getUser();
    const { data: profile } = me?.user
      ? await supabase.from('profiles').select('role').eq('id', me.user.id).single()
      : { data: null };
    if (!profile || !['staff', 'admin'].includes(profile.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // ---- gather real stats
    const [{ data: items }, { data: recipes }, { data: orders }] = await Promise.all([
      supabase.from('menu_items').select('id, name, price_cents'),
      supabase.from('recipe_ingredients').select('menu_item_id, quantity, ingredients(cost_per_unit_cents)'),
      supabase.from('orders').select('id, status, created_at, preparing_at, ready_at, estimated_ready_at').gte('created_at', since).neq('status', 'cancelled').limit(2000),
    ]);

    const unitCost = new Map();
    const hasRecipe = new Set();
    for (const r of recipes ?? []) {
      hasRecipe.add(r.menu_item_id);
      const cpu = r.ingredients?.cost_per_unit_cents;
      if (cpu === null || cpu === undefined) unitCost.set(r.menu_item_id, null);
      else if (unitCost.get(r.menu_item_id) !== null)
        unitCost.set(r.menu_item_id, (unitCost.get(r.menu_item_id) ?? 0) + Number(r.quantity) * Number(cpu));
    }

    const orderIds = (orders ?? []).map((o) => o.id);
    let lines = [];
    for (let i = 0; i < orderIds.length; i += 200) {
      const { data, error } = await supabase
        .from('order_items')
        .select('menu_item_id, item_name, quantity, item_price_cents')
        .in('order_id', orderIds.slice(i, i + 200));
      if (error) throw error;
      lines = lines.concat(data ?? []);
    }

    const sales = new Map();
    for (const l of lines) {
      const cur = sales.get(l.menu_item_id) ?? { name: l.item_name, units: 0, revenue: 0 };
      cur.units += l.quantity;
      cur.revenue += l.quantity * l.item_price_cents;
      sales.set(l.menu_item_id, cur);
    }

    const stats = (items ?? []).map((it) => {
      const s = sales.get(it.id) ?? { units: 0, revenue: 0 };
      const cost = hasRecipe.has(it.id) ? unitCost.get(it.id) ?? null : null;
      return {
        menu_item_id: it.id,
        name: it.name,
        price_cents: it.price_cents,
        unit_cost_cents: cost === null ? null : Math.round(cost),
        margin_cents: cost === null ? null : it.price_cents - Math.round(cost),
        units: s.units,
        revenue: s.revenue,
      };
    });

    const delayedNames = new Map();
    let delayedCount = 0;
    for (const o of orders ?? []) {
      const ready = o.ready_at ? new Date(o.ready_at).getTime() : null;
      const est = o.estimated_ready_at ? new Date(o.estimated_ready_at).getTime() : null;
      const late =
        (ready !== null && est !== null && ready > est) ||
        (ready === null && est !== null && Date.now() > est && ['received', 'accepted', 'preparing'].includes(o.status));
      if (late) delayedCount += 1;
    }
    void delayedNames;

    // ---- deterministic findings
    const findings = [];
    const sold = stats.filter((s) => s.units > 0);
    for (const s of sold) {
      if (s.margin_cents !== null && s.units >= 3 && s.margin_cents <= 0) {
        findings.push({
          kind: 'negative_margin',
          title: `${s.name} loses money per sale`,
          detail: `Margin ${s.margin_cents}c on ${s.units} sales over ${days}d. Evidence: contribution stats below.`,
          subject: s,
        });
      } else if (s.margin_cents !== null && s.margin_cents / s.price_cents < 0.2 && s.units >= 5) {
        findings.push({
          kind: 'thin_margin',
          title: `${s.name}: high demand, thin margin`,
          detail: `Margin ${s.margin_cents}c (${Math.round((s.margin_cents / s.price_cents) * 100)}%) across ${s.units} sales over ${days}d.`,
          subject: s,
        });
      }
    }
    if (delayedCount > 0) {
      findings.push({
        kind: 'delays',
        title: `${delayedCount} delayed orders in ${days}d`,
        detail: 'Orders past their estimated ready time. Check rush-hour view before changing anything.',
        subject: null,
      });
    }

    // Prior recommendations (memory: avoid repeating what was decided).
    const { data: history } = await supabase
      .from('recommendations')
      .select('id, type, title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // ---- narrative: LLM if configured, else honest rules template
    const llmKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY || '';
    let mode = 'rules';
    let narrative = null;
    if (llmKey && findings.length > 0) {
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${llmKey}` },
          body: JSON.stringify({
            model: process.env.LLM_MODEL || 'openai/gpt-oss-120b',
            temperature: 0.2,
            max_tokens: 600,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: 'You advise a café owner. Reply ONLY as JSON: {"experiments":[{"title":string,"steps":string[],"success_metrics":string[]}]}. Never invent numbers; use only the stats given. Every experiment must be reversible and measurable.' },
              { role: 'user', content: JSON.stringify({ findings, history: history ?? [], window_days: days }) },
            ],
          }),
        });
        if (r.ok) {
          const j = await r.json();
          narrative = JSON.parse(j.choices?.[0]?.message?.content ?? 'null');
          if (narrative?.experiments) mode = 'llm';
          else narrative = null;
        }
      } catch (e) {
        console.error('[ai-analyze llm fallback]', e);
        narrative = null;
      }
    }

    // ---- persist (memory write) + return
    const saved = [];
    const topics = findings.length > 0 ? findings : [{ kind: 'healthy', title: 'No pressing issues', detail: `Margins and delays look fine over the last ${days}d.`, subject: null }];
    for (const f of topics.slice(0, 4)) {
      const experiment =
        narrative?.experiments?.[0] ??
        (f.kind === 'healthy'
          ? { title: 'Keep monitoring', steps: ['Re-run this analysis weekly.'], success_metrics: ['No negative-margin items.'] }
          : { title: `Test a fix for: ${f.title}`, steps: ['Pick one change (price, portion, or prep).', 'Run it for 7 days.', 'Re-run this analysis and compare.'], success_metrics: ['Margin per item up.', 'Delayed orders down.'] });
      const { data: rec, error: recErr } = await supabase
        .from('recommendations')
        .insert({
          type: f.kind,
          title: f.title,
          description: `${f.detail} Proposed experiment: ${experiment.title} — ${experiment.steps.join(' ')} Success looks like: ${experiment.success_metrics.join(' ')}${mode === 'rules' ? ' (Rule-based draft: no LLM configured.)' : ''}`,
          evidence: [{ source: 'contribution_stats', window_days: days, stats }, { source: 'history', history: history ?? [] }],
          metrics: { mode, delayed_orders: delayedCount, window_days: days },
        })
        .select()
        .single();
      if (recErr) throw recErr;
      await supabase.from('recommendation_evidence').insert({
        recommendation_id: rec.id,
        source: 'sales_data',
        query_params: { window_days: days },
        result_snapshot: { stats, delayed_orders: delayedCount },
      });
      saved.push(rec);
    }

    return res.status(200).json({ mode, findings, recommendations: saved, history: history ?? [] });
  } catch (e) {
    console.error('[ai-analyze]', e);
    return res.status(500).json({ error: 'analysis_failed' });
  }
}
