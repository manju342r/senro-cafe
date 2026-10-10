import React from 'react';
import { StaffLayout } from '../../layouts/StaffLayout';
import { supabase } from '../../lib/supabase';
import { getContribution, getRush } from '../../lib/api';
import { inr } from '../../types';

interface CRow {
  menu_item_id: string; name: string; price_cents: number;
  unit_cost_cents: number | null; cost_known: boolean;
  margin_cents: number | null; units_sold: number;
  revenue_cents: number; total_contribution_cents: number | null;
}
interface Hour { hour: number; orders: number; median_prep_s: number | null; delayed: number }

function monday(): string {
  return new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
}

export const AnalyticsPage: React.FC = () => {
  const [from, setFrom] = React.useState(monday);
  const [to, setTo] = React.useState(() => new Date().toISOString());
  const [cat, setCat] = React.useState('');
  const [cats, setCats] = React.useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = React.useState<CRow[]>([]);
  const [totals, setTotals] = React.useState({ revenue_cents: 0, units: 0, contribution_cents: 0, unknown_cost_items: 0 });
  const [count, setCount] = React.useState(0);
  const [hours, setHours] = React.useState<Hour[]>([]);
  const [late, setLate] = React.useState<{ menu_item_id: string; name: string; delayed_qty: number }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.from('menu_categories').select('id,name').eq('is_active', true).order('display_order')
      .then(({ data }) => setCats((data ?? []) as { id: string; name: string }[]));
  }, []);

  React.useEffect(() => {
    setLoading(true);
    const q = { from, to, ...(cat ? { category: cat } : {}) };
    Promise.all([getContribution(q), getRush(q)])
      .then(([c, r]: [any, any]) => {
        setRows(c.rows); setTotals(c.totals); setCount(c.orders_count);
        setHours(r.hourly); setLate(r.delayed_items); setError(null);
      })
      .catch(() => setError('Analytics failed to load.'))
      .finally(() => setLoading(false));
  }, [from, to, cat]);

  const peak = Math.max(1, ...hours.map((h) => h.orders));

  return (
    <StaffLayout active="/staff/analytics">
      <h1 className="font-display text-2xl font-semibold">Profit intelligence</h1>
      <p className="mt-1 text-sm text-cocoa">
        Contribution = price − ingredients. Not net profit: rent, labour and utilities excluded. {count} orders in range.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <label>From <input type="date" value={from.slice(0, 10)} onChange={(e) => setFrom(new Date(e.target.value).toISOString())}
          className="rounded-xl bg-card px-2 py-1.5 shadow-sm outline-none" /></label>
        <label>To <input type="date" value={to.slice(0, 10)} onChange={(e) => setTo(new Date(e.target.value).toISOString())}
          className="rounded-xl bg-card px-2 py-1.5 shadow-sm outline-none" /></label>
        <label>Category
          <select value={cat} onChange={(e) => setCat(e.target.value)}
            className="rounded-xl bg-card px-2 py-1.5 shadow-sm outline-none">
            <option value="">All</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="mt-3 rounded-xl bg-card p-3 text-sm text-ember-deep shadow-sm" role="alert">{error}</p>}
      {loading ? <p className="mt-4 text-sm text-cocoa">Crunching stored orders…</p> : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { v: inr(totals.revenue_cents), l: 'Revenue' },
              { v: inr(totals.contribution_cents), l: 'Contribution*' },
              { v: String(totals.units), l: 'Units' },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-card p-3 text-center shadow-sm">
                <p className="text-lg font-bold">{s.v}</p>
                <p className="text-xs text-cocoa">{s.l}</p>
              </div>
            ))}
          </div>
          {totals.unknown_cost_items > 0 && (
            <p className="mt-2 text-xs text-cocoa">* Excludes {totals.unknown_cost_items} item(s) with incomplete costs (“unknown” below — never zeroed).</p>
          )}

          <h2 className="mb-2 mt-6 font-display text-lg font-semibold">By item</h2>
          <div className="overflow-x-auto rounded-2xl bg-card shadow-sm">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead><tr className="border-b border-latte text-xs text-cocoa">
                {['Item', 'Price', 'Cost', 'Margin', 'Sold', 'Revenue', 'Contribution'].map((h) => (
                  <th key={h} className="p-3 font-semibold">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.menu_item_id} className="border-b border-latte/60 last:border-0">
                    <td className="p-3 font-semibold">{r.name}</td>
                    <td className="p-3">{inr(r.price_cents)}</td>
                    <td className="p-3">{r.cost_known && r.unit_cost_cents !== null ? inr(r.unit_cost_cents) : <span className="text-faded">unknown</span>}</td>
                    <td className="p-3">{r.margin_cents !== null ? inr(r.margin_cents) : '–'}</td>
                    <td className="p-3">{r.units_sold}</td>
                    <td className="p-3">{inr(r.revenue_cents)}</td>
                    <td className="p-3 font-bold">{r.total_contribution_cents !== null ? inr(r.total_contribution_cents) : '–'}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="p-4 text-sm text-cocoa">No items in this filter.</td></tr>}
              </tbody>
            </table>
          </div>

          <h2 className="mb-2 mt-6 font-display text-lg font-semibold">Rush hours</h2>
          <div className="space-y-1.5 rounded-2xl bg-card p-3 shadow-sm" aria-label="Orders per hour">
            {hours.map((h) => (
              <div key={h.hour} className="flex items-center gap-2 text-xs">
                <span className="w-10 shrink-0 text-cocoa">{h.hour}:00</span>
                <div className="h-4 flex-1 rounded bg-parchment">
                  <div className="h-4 rounded bg-ember" style={{ width: `${Math.round((h.orders / peak) * 100)}%` }} />
                </div>
                <span className="w-28 shrink-0 text-right text-cocoa">
                  {h.orders} ord · {h.median_prep_s === null ? '–' : h.median_prep_s < 60 ? `${h.median_prep_s}s` : `${Math.round(h.median_prep_s / 60)}m`}{h.delayed > 0 ? ` · ${h.delayed} late` : ''}
                </span>
              </div>
            ))}
            {hours.length === 0 && <p className="text-sm text-cocoa">No orders in range.</p>}
          </div>

          {late.length > 0 && (
            <>
              <h3 className="mb-1 mt-4 text-sm font-bold">Seen most in late orders</h3>
              <p className="mb-2 text-xs text-cocoa">Co-occurrence only — busy periods slow everything, this does not prove an item causes delays.</p>
              <ul className="space-y-1 text-sm">
                {late.map((d) => (
                  <li key={d.menu_item_id} className="flex justify-between rounded-xl bg-card px-3 py-2 shadow-sm">
                    <span>{d.name}</span><span className="text-cocoa">{d.delayed_qty}× in late orders</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </StaffLayout>
  );
};
