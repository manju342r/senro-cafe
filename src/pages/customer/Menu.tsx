import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
import { createOrder, getMenu } from '@/lib/demoStore'
import { useDemoState } from '@/hooks/useDemo'
import { formatCents, type MenuItem } from '@/types/database'

export function MenuPage() {
  const live = useDemoState()
  const { categories, items } = getMenu()
  const { addItem, count, lines, totalCents, setQuantity, removeItem, clear } = useCart()
  const [categoryId, setCategoryId] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [pickupName, setPickupName] = useState('')
  const [orderError, setOrderError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const deferredQuery = useDeferredValue(query.trim().toLowerCase())
  const navigate = useNavigate()

  useEffect(() => {
    if (count === 0) setCartOpen(false)
  }, [count])

  const qtyById = useMemo(() => {
    const map = new Map<string, number>()
    for (const line of lines) map.set(line.menu_item_id, line.quantity)
    return map
  }, [lines])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1)
    }
    return counts
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const inCategory = categoryId === 'all' || item.category_id === categoryId
      if (!inCategory) return false
      if (!deferredQuery) return true
      const haystack = `${item.name} ${item.description ?? ''}`.toLowerCase()
      return haystack.includes(deferredQuery)
    })
  }, [items, categoryId, deferredQuery])

  function handleAdd(item: MenuItem) {
    addItem({
      menu_item_id: item.id,
      name: item.name,
      price_cents: item.price_cents,
    })
    setCartOpen(true)
  }

  async function placeOrder() {
    if (lines.length === 0) return
    const name = pickupName.trim()
    if (!name) {
      setOrderError('Enter your name for pickup.')
      return
    }
    setSubmitting(true)
    setOrderError(null)
    try {
      const order = await createOrder({
        customer_name: name,
        items: lines.map((l) => ({
          menu_item_id: l.menu_item_id,
          quantity: l.quantity,
        })),
        idempotency_key: crypto.randomUUID(),
      })
      clear()
      setCartOpen(false)
      navigate(`/orders/${order.tracking_token}`)
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : 'Could not place order')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className={`page-shell ${count > 0 ? 'pb-36' : ''}`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-page text-leaf">Menu</h1>
          <p className="mt-3 text-steam">
            {live.ready
              ? `Add dishes here — your cart stays on this page.`
              : 'Loading live menu…'}
          </p>
        </div>
        {count > 0 ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCartOpen(true)}
          >
            Cart · {count}
          </button>
        ) : null}
      </div>

      <div className="mb-6">
        <label htmlFor="menu-search" className="sr-only">
          Search menu
        </label>
        <div className="relative">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-steam"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            id="menu-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes, drinks, desserts…"
            autoComplete="off"
            className="field pl-10"
          />
        </div>
        {query.trim() ? (
          <p className="mt-2 text-sm text-steam">
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
            {categoryId !== 'all' ? ' in this category' : ''}
          </p>
        ) : null}
      </div>

      <div className="-mx-4 mb-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
          <button
            type="button"
            onClick={() => setCategoryId('all')}
            className={`chip ${categoryId === 'all' ? 'chip-active' : 'chip-idle'}`}
          >
            All ({items.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`chip ${categoryId === cat.id ? 'chip-active' : 'chip-idle'}`}
            >
              {cat.name} ({categoryCounts.get(cat.id) ?? 0})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="border border-line bg-forest/40 px-6 py-10 text-steam">
          {query.trim()
            ? `No matches for “${query.trim()}”. Try another name or clear search.`
            : 'No items in this category right now.'}
        </p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {filtered.map((item) => {
            const qty = qtyById.get(item.id) ?? 0
            const inCart = qty > 0

            return (
              <li key={item.id} className="menu-row flex items-start justify-between gap-4 py-5">
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[1.35rem] font-semibold leading-tight tracking-tight text-foam sm:text-[1.5rem]">
                    {item.name}
                  </h2>
                  {item.description ? (
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-steam">
                      {item.description}
                    </p>
                  ) : null}
                  {inCart ? (
                    <p className="mt-1.5 text-sm text-steam">
                      {formatCents(item.price_cents)} each
                    </p>
                  ) : (
                    <p className="mt-2.5 text-xs font-medium uppercase tracking-[0.16em] text-steam/75">
                      {item.is_available
                        ? `~${Math.max(1, Math.round(item.prep_time_seconds / 60))} min`
                        : 'Sold out'}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-3">
                  <p className="font-semibold tracking-wide text-leaf">
                    {formatCents(inCart ? item.price_cents * qty : item.price_cents)}
                  </p>
                  {!item.is_available && !inCart ? (
                    <button
                      type="button"
                      disabled
                      className="btn btn-primary min-w-[5.5rem] disabled:bg-steam/25 disabled:text-steam"
                    >
                      Sold out
                    </button>
                  ) : inCart ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary min-h-11 min-w-11 px-0"
                        onClick={() => setQuantity(item.id, qty - 1)}
                        aria-label={`Decrease ${item.name}`}
                      >
                        −
                      </button>
                      <span className="w-7 text-center font-medium tabular-nums text-foam">
                        {qty}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary min-h-11 min-w-11 px-0"
                        onClick={() =>
                          addItem({
                            menu_item_id: item.id,
                            name: item.name,
                            price_cents: item.price_cents,
                          })
                        }
                        disabled={!item.is_available}
                        aria-label={`Increase ${item.name}`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost px-2 text-sm"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAdd(item)}
                      className="btn btn-primary min-w-[5.5rem]"
                    >
                      Add
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {count > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pe-20 ps-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6">
          <div className="pointer-events-auto w-full max-w-3xl border border-leaf/35 bg-ink/95 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
            {cartOpen ? (
              <div className="max-h-[min(70vh,32rem)] overflow-y-auto p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow">Your cart</p>
                    <h2 className="mt-1 font-display text-2xl text-foam">
                      {count} item{count === 1 ? '' : 's'}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost px-2 text-sm"
                    onClick={() => setCartOpen(false)}
                  >
                    Close
                  </button>
                </div>

                <ul className="mt-4 divide-y divide-line border-y border-line">
                  {lines.map((line) => (
                    <li key={line.menu_item_id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foam">{line.name}</p>
                        <p className="text-sm text-steam">
                          {formatCents(line.price_cents)} each
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-secondary min-h-10 min-w-10 px-0"
                          onClick={() => setQuantity(line.menu_item_id, line.quantity - 1)}
                          aria-label={`Decrease ${line.name}`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center tabular-nums text-foam">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary min-h-10 min-w-10 px-0"
                          onClick={() =>
                            addItem({
                              menu_item_id: line.menu_item_id,
                              name: line.name,
                              price_cents: line.price_cents,
                            })
                          }
                          aria-label={`Increase ${line.name}`}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost px-2 text-sm"
                          onClick={() => removeItem(line.menu_item_id)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <label className="mt-4 block text-sm font-medium text-steam" htmlFor="menu-pickup-name">
                  Name for pickup <span className="text-leaf">*</span>
                </label>
                <input
                  id="menu-pickup-name"
                  value={pickupName}
                  onChange={(e) => {
                    setPickupName(e.target.value)
                    if (orderError) setOrderError(null)
                  }}
                  placeholder="Your name"
                  className="field mt-2"
                  autoComplete="name"
                  required
                  aria-required="true"
                />

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-steam">Total</span>
                  <span className="font-display text-2xl font-semibold text-leaf">
                    {formatCents(totalCents)}
                  </span>
                </div>

                {orderError ? (
                  <p className="mt-3 text-sm text-red-300" role="alert">
                    {orderError}
                  </p>
                ) : null}

                <button
                  type="button"
                  disabled={submitting || !pickupName.trim()}
                  onClick={() => void placeOrder()}
                  className="btn btn-primary mt-4 w-full"
                >
                  {submitting ? 'Placing…' : 'Place order'}
                </button>
                <p className="mt-2 text-center text-xs text-steam">
                  Pay at the counter — no online payment.
                </p>
              </div>
            ) : (
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5"
                onClick={() => setCartOpen(true)}
              >
                <div>
                  <p className="text-sm text-steam">
                    {count} item{count === 1 ? '' : 's'} in cart
                  </p>
                  <p className="font-display text-xl font-semibold text-leaf">
                    {formatCents(totalCents)}
                  </p>
                </div>
                <span className="btn btn-primary pointer-events-none shrink-0">Open cart</span>
              </button>
            )}
          </div>
        </div>
      ) : null}
    </main>
  )
}
