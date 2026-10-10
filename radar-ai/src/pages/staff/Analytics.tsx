import React from 'react';
import { StaffLayout } from '../../layouts/StaffLayout';
import { supabase } from '../../lib/supabase';
import { defaultRange, fetchContribution, fetchRush, fmtMin, type ContributionRow, type RushHour } from '../../lib/profit';
import { formatCents } from '../../types/database';

export const AnalyticsPage: React.FC = () => {
  const [range, setRange] = React.useState(defaultRange);
  const [category, setCategory] = React.useState('');
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
  const [rows, setRows] = React.useState<ContributionRow[]>([]);
  const [totals, setTotals] = React.useState({ revenue_cents: 0, units: 0, contribution_cents: 0, unknown_cost_items: 0 });
  const [ordersCount, setOrdersCount] = React.useState(0);
  const [rush, setRush] = React.useState<RushHour[]>([]);
  const [peaks, setPeaks] = React.useState<RushHour[]>([]);
  const [delayedItems, setDelayedItems] = React.useState<{ menu_item_id: string; name: string; delayed_qty: number }[]>([]);
  const [rushNote, setRushNote] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.resolve(
      supabase.from('menu_categories').select('id, name').eq('is_active', true).order('display_order')
    )
      .then(({ data }) => setCategories((data ?? []) as { id: string; name: string }[]))
      .catch(() => undefined);
  }, []);

  const load = React.useCallback(() => {
    setLoading(true);
    const f = { ...range, ...(category ? { category } : {}) };
    Promise.all([fetchContribution(f), fetchRush(f)])
      .then(([c, r]) => {
        setRows(c.rows);
        setTotals(c.totals);
        setOrdersCount(c.orders_count);
        setRush(r.hourly);
        setPeaks(r.peak_hours);
        setDelayedItems(r.delayed_items);
        setRushNote(r.note);
        setError(null);
      })
      .catch(() => setError('Analytics failed to load.'))
      .finally(() => setLoading(false));
  }, [range, category]);

  React.useEffect(() => {
    load();
  }, [load]);

  const maxHourly = Math.max(1, ...rush.map((h) => h.orders));

  return (
    <StaffLayout active="/staff/analytics">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Profit intelligence</h1>
      <p className="mb-4 text-sm text-muted">
        Contribution = price − ingredient cost. Not net profit: labour, rent, utilities excluded.
        Based on {ordersCount} orders in range.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="text-sm">
          From{' '}
          <input
            type="date"
            value={range.from.slice(0, 10)}
            onChange={(e) => setRange((r) => ({ ...r, from: new Date(e.target.value).toISOString() }))}
            className="rounded-xl border border-line bg-input px-2 py-1.5 text-sm outline-none"
          />
        </label>
        <label className="text-sm">
          To{' '}
          <input
            type="date"
            value={range.to.slice(0, 10)}
            onChange={(e) => setRange((r) => ({ ...r, to: new Date(e.target.value).toISOString() }))}
            className="rounded-xl border border-line bg-input px-2 py-1.5 text-sm outline-none"
          />
        </label>
        <label className="text-sm">
          Category{' '}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-line bg-input px-2 py-1.5 text-sm outline-none"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mb-3 rounded-xl border border-line bg-surface p-3 text-sm" role="alert">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted" aria-live="polite">Computing from stored orders…</p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-line bg-surface p-3 text-center">
              <p className="text-lg font-semibold">{formatCents(totals.revenue_cents)}</p>
              <p className="text-xs text-muted">Revenue</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-3 text-center">
              <p className="text-lg font-semibold">{formatCents(totals.contribution_cents)}</p>
              <p className="text-xs text-muted">Contribution*</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-3 text-center">
              <p className="text-lg font-semibold">{totals.units}</p>
              <p className="text-xs text-muted">Units sold</p>
            </div>
          </div>
          {totals.unknown_cost_items > 0 && (
            <p className="mb-3 text-xs text-muted" role="note">
              * Excludes {totals.unknown_cost_items} item(s) with incomplete cost data (shown as “unknown” below).
            </p>
          )}

          <h2 className="mb-2 text-base font-semibold">Contribution by item</h2>
          <div className="mb-6 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th className="p-3 font-medium">Item</th>
                  <th className="p-3 font-medium">Price</th>
                  <th className="p-3 font-medium">Cost</th>
                  <th className="p-3 font-medium">Margin</th>
                  <th className="p-3 font-medium">Sold</th>
                  <th className="p-3 font-medium">Revenue</th>
                  <th className="p-3 font-medium">Contribution</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.menu_item_id} className="border-b border-line last:border-0">
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3">{formatCents(r.price_cents)}</td>
                    <td className="p-3">{r.cost_known && r.unit_cost_cents !== null ? formatCents(r.unit_cost_cents) : <span className="text-muted">unknown</span>}</td>
                    <td className="p-3">{r.margin_cents !== null ? formatCents(r.margin_cents) : <span className="text-muted">–</span>}</td>
                    <td className="p-3">{r.units_sold}</td>
                    <td className="p-3">{formatCents(r.revenue_cents)}</td>
                    <td className="p-3 font-medium">
                      {r.total_contribution_cents !== null ? formatCents(r.total_contribution_cents) : <span className="font-normal text-muted">–</span>}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td className="p-4 text-sm text-muted" colSpan={7}>No items in this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mb-2 text-base font-semibold">Rush hours</h2>
          {peaks.length > 0 && (
            <p className="mb-2 text-sm text-muted">
              Busiest: {peaks.map((p) => `${p.hour}:00 (${p.orders} orders)`).join(', ')}
            </p>
          )}
          <div className="mb-2 space-y-1.5" aria-label="Orders per hour">
            {rush.map((h) => (
              <div key={h.hour} className="flex items-center gap-2 text-xs">
                <span className="w-10 shrink-0 text-muted">{h.hour}:00</span>
                <div className="h-4 flex-1 rounded bg-surface-elevated">
                  <div
                    className="h-4 rounded bg-content"
                    style={{ width: `${Math.round((h.orders / maxHourly) * 100)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-muted">
                  {h.orders} ord · {fmtMin(h.median_prep_s)} prep{h.delayed > 0 ? ` · ${h.delayed} late` : ''}
                </span>
              </div>
            ))}
            {rush.length === 0 && <p className="text-sm text-muted">No orders in range.</p>}
          </div>

          {delayedItems.length > 0 && (
            <>
              <h3 className="mb-1 mt-4 text-sm font-semibold">Most present in delayed orders</h3>
              <p className="mb-2 text-xs text-muted">{rushNote}</p>
              <ul className="space-y-1 text-sm">
                {delayedItems.map((d) => (
                  <li key={d.menu_item_id} className="flex justify-between rounded-xl border border-line bg-surface px-3 py-2">
                    <span>{d.name}</span>
                    <span className="text-muted">{d.delayed_qty}× in late orders</span>
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
