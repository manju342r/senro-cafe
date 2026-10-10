import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
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
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (count === 0) setCartOpen(false)
  }, [count])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [reduceMotion])

  const qtyById = useMemo(() => {
    const map = new Map<string, number>()
    for (const line of lines) map.set(line.menu_item_id, line.quantity)
    return map
  }, [lines])

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
    <motion.main
      className={`relative ${count > 0 ? 'pb-36' : ''}`}
      initial={reduceMotion ? false : { opacity: 0, x: '12%' }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="border-b border-line/60 bg-ink/40">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="eyebrow text-leaf">Our menu</p>
          <h1 className="mt-3 font-display text-[clamp(2.4rem,4vw+1rem,3.75rem)] font-semibold leading-[1.05] tracking-tight text-foam">
            A culinary <em className="text-leaf italic">journey</em>
          </h1>
          <p className="mt-4 max-w-xl text-steam">
            {live.ready
              ? 'Seasonal comfort · Cooked fresh to order · Pay at the counter'
              : 'Loading live menu…'}
          </p>

          <div className="mt-8 max-w-md">
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
          </div>
        </div>
      </div>

      <div className="sticky top-[3.5rem] z-10 border-b border-line bg-ink/92 backdrop-blur-xl">
        <div className="-mx-0 overflow-x-auto">
          <div className="mx-auto flex min-w-max max-w-5xl gap-1 px-4 sm:gap-2 sm:px-6">
            <button
              type="button"
              onClick={() => setCategoryId('all')}
              className={`relative whitespace-nowrap px-3 py-3.5 text-[11px] font-medium uppercase tracking-[0.16em] transition sm:px-4 sm:text-xs ${
                categoryId === 'all' ? 'text-leaf' : 'text-steam hover:text-foam'
              }`}
            >
              All
              {categoryId === 'all' ? (
                <span className="absolute inset-x-3 bottom-0 h-px bg-leaf sm:inset-x-4" />
              ) : null}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`relative whitespace-nowrap px-3 py-3.5 text-[11px] font-medium uppercase tracking-[0.16em] transition sm:px-4 sm:text-xs ${
                  categoryId === cat.id ? 'text-leaf' : 'text-steam hover:text-foam'
                }`}
              >
                {cat.name}
                {categoryId === cat.id ? (
                  <span className="absolute inset-x-3 bottom-0 h-px bg-leaf sm:inset-x-4" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {query.trim() ? (
          <p className="mb-6 text-sm text-steam">
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
            {categoryId !== 'all' ? ' in this category' : ''}
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <p className="border border-line bg-forest/40 px-6 py-10 text-steam">
            {query.trim()
              ? `No matches for “${query.trim()}”. Try another name or clear search.`
              : 'No items in this category right now.'}
          </p>
        ) : (
          <ul className="grid gap-x-10 gap-y-0 sm:grid-cols-2">
            {filtered.map((item) => {
              const qty = qtyById.get(item.id) ?? 0
              const inCart = qty > 0
              const mins = Math.max(1, Math.round(item.prep_time_seconds / 60))

              return (
                <li
                  key={item.id}
                  className="menu-row border-b border-line/80 py-6 first:border-t sm:[&:nth-child(-n+2)]:border-t"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="min-w-0 font-display text-[1.35rem] font-semibold leading-tight tracking-tight text-foam sm:text-[1.5rem]">
                      {item.name}
                    </h2>
                    <p className="shrink-0 font-display text-lg font-semibold tabular-nums text-leaf sm:text-xl">
                      {formatCents(item.price_cents)}
                    </p>
                  </div>

                  {item.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-steam">{item.description}</p>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-steam/80">
                      {item.is_available
                        ? `Fresh to order · ~${mins} min prep`
                        : 'Currently unavailable'}
                    </p>
                  )}

                  {!item.is_available && !inCart ? (
                    <span className="mt-3 inline-block border border-steam/40 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-steam">
                      Sold out
                    </span>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {!item.is_available && !inCart ? null : inCart ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-secondary min-h-10 min-w-10 px-0"
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
                          className="btn btn-secondary min-h-10 min-w-10 px-0"
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
                        className="btn btn-secondary min-h-9 px-4 text-sm uppercase tracking-[0.08em]"
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
      </div>

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
                        <p className="text-sm text-steam">{formatCents(line.price_cents)} each</p>
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
                        <span className="w-6 text-center tabular-nums text-foam">{line.quantity}</span>
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
    </motion.main>
  )
}
