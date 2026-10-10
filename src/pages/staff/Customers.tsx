import { useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { isAdmin, listCustomers, listOrdersByCustomer } from '@/lib/demoStore'
import { useDemoState } from '@/hooks/useDemo'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCents } from '@/types/database'

export function StaffCustomersPage() {
  useDemoState()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const admin = isAdmin()
  const customers = listCustomers()
  const selectedName = params.get('c')
  const selectedOrders = useMemo(
    () => (selectedName ? listOrdersByCustomer(selectedName) : []),
    [selectedName, customers],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => c.name.toLowerCase().includes(q))
  }, [customers, query])

  if (!admin) {
    return <Navigate to="/staff/orders" replace />
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="eyebrow">Super admin · live Supabase</p>
      <h1 className="type-page mt-2 text-leaf">Customers</h1>
      <p className="mt-2 max-w-xl text-steam">
        Stored in Supabase from real orders — lifetime spend from completed tickets.
      </p>

      <div className="mt-6">
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <input
          id="customer-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="field max-w-md"
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.15fr]">
        <section>
          <p className="text-sm text-steam">
            {filtered.length} customer{filtered.length === 1 ? '' : 's'}
          </p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {filtered.length === 0 ? (
              <li className="py-8 text-steam">No customers match.</li>
            ) : (
              filtered.map((customer) => {
                const active = selectedName === customer.name
                return (
                  <li key={customer.name}>
                    <button
                      type="button"
                      onClick={() =>
                        setParams(active ? {} : { c: customer.name }, { replace: true })
                      }
                      className={`flex w-full flex-col gap-1 py-4 text-left transition ${
                        active ? 'bg-leaf/10' : 'hover:bg-forest/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 px-2">
                        <div>
                          <p className="font-display text-xl font-semibold text-foam">
                            {customer.name}
                          </p>
                          <p className="mt-1 text-xs text-steam">
                            {customer.order_count} orders · {customer.completed_count} completed
                            {customer.cancelled_count
                              ? ` · ${customer.cancelled_count} cancelled`
                              : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-leaf">
                            {formatCents(customer.total_spent_cents)}
                          </p>
                          <p className="text-xs text-steam">
                            AOV{' '}
                            {customer.avg_order_cents
                              ? formatCents(customer.avg_order_cents)
                              : '—'}
                          </p>
                        </div>
                      </div>
                      <p className="px-2 text-xs text-steam/80">
                        Last order{' '}
                        {new Date(customer.last_order_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </section>

        <section className="border border-line bg-forest/30 p-5">
          {!selectedName ? (
            <p className="text-steam">Select a customer to see their full order history.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="type-section text-foam">{selectedName}</h2>
                  <p className="mt-1 text-sm text-steam">
                    {selectedOrders.length} order{selectedOrders.length === 1 ? '' : 's'} on file
                  </p>
                </div>
                <Link to="/staff/sales" className="text-sm text-leaf hover:underline">
                  Sales overview →
                </Link>
              </div>

              <ul className="mt-6 space-y-4">
                {selectedOrders.map((order) => (
                  <li key={order.id} className="border border-line/80 bg-ink/40 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-steam">
                          {new Date(order.created_at).toLocaleString('en-IN')}
                        </p>
                        <div className="mt-2">
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                      <p className="font-display text-2xl font-semibold text-leaf">
                        {formatCents(order.total_cents)}
                      </p>
                    </div>
                    <ul className="mt-4 space-y-1.5 text-sm">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-3">
                          <span className="text-steam">
                            {item.quantity}× {item.item_name}
                          </span>
                          <span className="tabular-nums text-foam">
                            {formatCents(item.item_price_cents * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {order.cancellation_reason ? (
                      <p className="mt-3 text-xs text-clay">{order.cancellation_reason}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
