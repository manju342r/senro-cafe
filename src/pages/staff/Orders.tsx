import { useEffect, useMemo, useState } from 'react'
import { listOrders, transitionOrder } from '@/lib/demoStore'
import { useDemoState } from '@/hooks/useDemo'
import { StatusBadge } from '@/components/shared/StatusBadge'
import {
  ORDER_TRANSITIONS,
  displayOrderToken,
  formatCents,
  type OrderStatus,
  type OrderWithItems,
} from '@/types/database'

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  accepted: 'Accept',
  preparing: 'Start prep',
  ready: 'Mark ready',
  completed: 'Complete',
  cancelled: 'Cancel',
}

function orderAgeSeconds(order: OrderWithItems) {
  return (Date.now() - new Date(order.created_at).getTime()) / 1000
}

function estPrep(order: OrderWithItems) {
  return order.items.reduce((n, i) => n + i.prep_time_seconds * i.quantity, 0)
}

export function StaffOrdersPage() {
  useDemoState()
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 15000)
    return () => window.clearInterval(id)
  }, [])

  const orders = listOrders()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const active = orders.filter((o) => !['completed', 'cancelled'].includes(o.status))
  const selected = orders.find((o) => o.id === selectedId) ?? null

  const stats = useMemo(() => {
    const overdue = active.filter((o) => orderAgeSeconds(o) > estPrep(o)).length
    const completed = orders.filter(
      (o) => o.status === 'completed' && o.preparing_at && o.ready_at,
    )
    const avgPrep =
      completed.length === 0
        ? 0
        : completed.reduce((n, o) => {
            return (
              n +
              (new Date(o.ready_at!).getTime() - new Date(o.preparing_at!).getTime()) /
                1000
            )
          }, 0) / completed.length
    return { active: active.length, overdue, avgPrep }
  }, [orders, active])

  async function act(orderId: string, to: OrderStatus) {
    try {
      setError(null)
      await transitionOrder(orderId, to, to === 'cancelled' ? 'Cancelled by staff' : undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transition failed')
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Active orders" value={String(stats.active)} />
        <Stat label="Overdue" value={String(stats.overdue)} warn={stats.overdue > 0} />
        <Stat
          label="Avg prep"
          value={stats.avgPrep ? `${Math.round(stats.avgPrep / 60)}m` : '—'}
        />
      </div>

      <h1 className="type-page text-leaf">Live queue</h1>
      <p className="mt-2 text-steam">
        Overdue when age exceeds estimated prep · sold-out toggles sync to the customer menu.
      </p>
      {error && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}

      {active.length === 0 ? (
        <p className="mt-8 border border-line bg-forest/40 px-6 py-10 text-steam">
          No active orders. Place one from the customer menu to start the demo loop.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {active.map((order) => {
            const age = orderAgeSeconds(order)
            const prep = estPrep(order)
            const overdue = age > prep
            const critical = age > prep * 1.5
            const severity = critical
              ? 'border-red-400/55'
              : overdue
                ? 'border-clay/70'
                : 'border-line'

            return (
              <li
                key={order.id}
                className={`surface-interactive border p-5 ${severity}`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(order.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-4xl font-semibold leading-none text-leaf">
                        #{displayOrderToken(order)}
                      </p>
                      <p className="type-section mt-2 text-foam">{order.customer_name}</p>
                      {order.customer_phone ? (
                        <p className="mt-0.5 text-sm text-leaf">
                          <a href={`tel:+91${order.customer_phone}`} className="hover:underline">
                            +91 {order.customer_phone}
                          </a>
                        </p>
                      ) : null}
                      <p className="text-xs text-steam">
                        {Math.floor(age / 60)}m {String(Math.floor(age % 60)).padStart(2, '0')}s
                        ago · {formatCents(order.total_cents)}
                        {overdue ? (critical ? ' · CRITICAL' : ' · OVERDUE') : ''}
                      </p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-steam">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity}× {item.item_name}
                      </li>
                    ))}
                  </ul>
                </button>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ORDER_TRANSITIONS[order.status].map((next) => (
                    <button
                      key={next}
                      type="button"
                      onClick={() => act(order.id, next)}
                      className={`btn text-sm ${
                        next === 'cancelled'
                          ? 'btn-secondary hover:border-red-300 hover:text-red-300'
                          : 'btn-primary'
                      }`}
                    >
                      {ACTION_LABELS[next] ?? next}
                    </button>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {selected && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/70 p-4 sm:items-center">
          <div
            className="surface max-h-[85vh] w-full max-w-lg overflow-auto border border-line p-6"
            role="dialog"
            aria-label="Order detail"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-5xl font-semibold leading-none text-leaf">
                  #{displayOrderToken(selected)}
                </p>
                <h2 className="type-section mt-3 text-foam">{selected.customer_name}</h2>
                {selected.customer_phone ? (
                  <p className="mt-1 text-sm text-leaf">
                    <a href={`tel:+91${selected.customer_phone}`} className="hover:underline">
                      +91 {selected.customer_phone}
                    </a>
                  </p>
                ) : null}
                <div className="mt-2">
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost px-3"
                onClick={() => setSelectedId(null)}
              >
                Close
              </button>
            </div>
            <ul className="mt-5 space-y-2 text-sm">
              {selected.items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}× {item.item_name}
                  </span>
                  <span>{formatCents(item.item_price_cents * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <h3 className="type-section mt-6 text-lg text-foam">Timeline</h3>
            <ul className="mt-2 space-y-1 text-sm text-steam">
              {selected.events.map((event) => (
                <li key={event.id}>
                  {event.to_status} · {new Date(event.created_at).toLocaleTimeString()}
                  {event.notes ? ` — ${event.notes}` : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  )
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="border border-line bg-forest/40 p-4">
      <p className="eyebrow">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${warn ? 'text-clay' : 'text-leaf'}`}>
        {value}
      </p>
    </div>
  )
}
