import { contributionRows } from '@/lib/demoStore'
import { useDemoState } from '@/hooks/useDemo'
import { formatCents } from '@/types/database'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export function StaffAnalyticsPage() {
  const live = useDemoState()
  const rows = contributionRows()
  const chartData = rows
    .filter((r) => r.units_sold > 0 && r.total_contribution_cents !== null)
    .map((r) => ({
      name: r.item.name.split(' ').slice(0, 2).join(' '),
      contribution: (r.total_contribution_cents ?? 0) / 100,
      sold: r.units_sold,
    }))

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-page text-leaf">Contribution</h1>
          <p className="mt-2 text-steam">
            Price minus recipe cost from live orders. Incomplete recipes are flagged — never shown as ₹0.
          </p>
          {!live.ready ? (
            <p className="mt-2 text-sm text-steam">Loading live data…</p>
          ) : null}
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="mt-8 border border-line bg-forest/40 px-6 py-10 text-steam">
          No contribution yet. Complete a few customer orders with recipe-backed items (e.g. Filter
          Coffee, Dosa).
        </p>
      ) : (
        <div className="mt-8 h-64 border border-line bg-forest/40 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#b5a494" fontSize={12} />
              <YAxis stroke="#b5a494" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#2a1f1a',
                  border: '1px solid rgba(240,193,75,0.16)',
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="contribution" fill="#f0c14b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-steam">
            <tr className="border-b border-line">
              <th className="py-3 font-medium">Item</th>
              <th className="py-3 font-medium">Price</th>
              <th className="py-3 font-medium">Cost</th>
              <th className="py-3 font-medium">Contribution</th>
              <th className="py-3 font-medium">Sold</th>
              <th className="py-3 font-medium">Total contrib.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.item.id} className="border-b border-line/60">
                <td className="py-3 text-foam">{row.item.name}</td>
                <td className="py-3">{formatCents(row.item.price_cents)}</td>
                <td className="py-3">
                  {row.cost_cents === null ? (
                    <span className="text-clay">Cost data incomplete</span>
                  ) : (
                    formatCents(row.cost_cents)
                  )}
                </td>
                <td className="py-3">
                  {row.contribution_cents === null
                    ? '—'
                    : formatCents(row.contribution_cents)}
                </td>
                <td className="py-3">{row.units_sold}</td>
                <td className="py-3 text-leaf">
                  {row.total_contribution_cents === null
                    ? '—'
                    : formatCents(row.total_contribution_cents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
