import { useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { getSalesOverview, isAdmin } from '@/lib/demoStore'
import { useDemoState } from '@/hooks/useDemo'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCents } from '@/types/database'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function Kpi({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="border border-line bg-forest/40 p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-leaf">{value}</p>
      {hint ? <p className="mt-1 text-xs text-steam">{hint}</p> : null}
    </div>
  )
}

export function StaffSalesPage() {
  const live = useDemoState()
  const admin = isAdmin()
  const sales = getSalesOverview()
  const chartData = useMemo(
    () =>
      sales.daily.map((d) => ({
        day: d.date.slice(5),
        revenue: d.revenue_cents / 100,
        orders: d.orders,
      })),
    [sales.daily],
  )

  if (!admin) {
    return <Navigate to="/staff/orders" replace />
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Super admin · live Supabase</p>
          <h1 className="type-page mt-2 text-leaf">Sales overview</h1>
          <p className="mt-2 max-w-xl text-steam">
            Live GMV from completed orders, queue health, and what customers are buying.
          </p>
          {!live.ready ? (
            <p className="mt-2 text-sm text-steam">Loading live data…</p>
          ) : live.hydrateError ? (
            <p className="mt-2 text-sm text-clay">{live.hydrateError}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Net sales"
          value={formatCents(sales.revenue_cents)}
          hint={`${sales.completed_count} completed orders`}
        />
        <Kpi
          label="Avg order value"
          value={sales.aov_cents ? formatCents(sales.aov_cents) : '—'}
          hint="Completed tickets only"
        />
        <Kpi
          label="Active queue"
          value={String(sales.active_count)}
          hint={`${sales.by_status.ready} ready · ${sales.by_status.preparing} prep`}
        />
        <Kpi
          label="Completion rate"
          value={`${Math.round(sales.completion_rate * 100)}%`}
          hint={`${sales.cancelled_count} cancelled · ${formatCents(sales.cancelled_cents)} lost`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="border border-line bg-forest/40 p-4">
          <h2 className="type-section text-foam">Daily revenue</h2>
          {chartData.length === 0 ? (
            <p className="mt-6 text-sm text-steam">No completed sales yet.</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="rgba(240,193,75,0.08)" vertical={false} />
                  <XAxis dataKey="day" stroke="#b5a494" fontSize={12} />
                  <YAxis stroke="#b5a494" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: '#2a1f1a',
                      border: '1px solid rgba(240,193,75,0.16)',
                      borderRadius: 4,
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#f0c14b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="border border-line bg-forest/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="type-section text-foam">Top sellers</h2>
            <Link to="/staff/analytics" className="text-sm text-leaf hover:underline">
              Contribution →
            </Link>
          </div>
          {sales.top_items.length === 0 ? (
            <p className="mt-6 text-sm text-steam">Complete orders to see bestsellers.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {sales.top_items.map((item, i) => (
                <li key={item.name} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foam">
                      <span className="mr-2 text-steam">{i + 1}.</span>
                      {item.name}
                    </p>
                    <p className="text-xs text-steam">{item.quantity} sold</p>
                  </div>
                  <p className="shrink-0 font-semibold text-leaf">
                    {formatCents(item.revenue_cents)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="type-section text-foam">Recent orders</h2>
          <Link to="/staff/customers" className="text-sm text-leaf hover:underline">
            All customers →
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-steam">
                <th className="py-3 font-medium">When</th>
                <th className="py-3 font-medium">Customer</th>
                <th className="py-3 font-medium">Items</th>
                <th className="py-3 font-medium">Status</th>
                <th className="py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.recent_orders.map((order) => (
                <tr key={order.id} className="border-b border-line/60">
                  <td className="py-3 text-steam">
                    {new Date(order.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3">
                    <Link
                      to={`/staff/customers?c=${encodeURIComponent(order.customer_name)}`}
                      className="font-medium text-foam hover:text-leaf"
                    >
                      {order.customer_name}
                    </Link>
                  </td>
                  <td className="max-w-[220px] truncate py-3 text-steam">
                    {order.items.map((i) => `${i.quantity}× ${i.item_name}`).join(', ')}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3 text-right font-semibold text-leaf">
                    {formatCents(order.total_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
