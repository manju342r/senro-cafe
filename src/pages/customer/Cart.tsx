import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
import { createOrder } from '@/lib/demoStore'
import { formatCents } from '@/types/database'

export function CartPage() {
  const { lines, totalCents, setQuantity, removeItem, clear } = useCart()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function placeOrder() {
    if (lines.length === 0) return
    const pickup = name.trim()
    if (!pickup) {
      setError('Enter your name for pickup.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const order = await createOrder({
        customer_name: pickup,
        items: lines.map((l) => ({
          menu_item_id: l.menu_item_id,
          quantity: l.quantity,
        })),
        idempotency_key: crypto.randomUUID(),
      })
      clear()
      navigate(`/orders/${order.tracking_token}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place order')
    } finally {
      setSubmitting(false)
    }
  }

  if (lines.length === 0) {
    return (
      <main className="page-shell-narrow py-20">
        <h1 className="type-page text-leaf">Cart</h1>
        <p className="mt-4 text-steam">Your cart is empty.</p>
        <Link to="/menu" className="btn btn-primary mt-10">
          Browse menu
        </Link>
      </main>
    )
  }

  return (
    <main className="page-shell-narrow">
      <h1 className="type-page text-leaf">Cart</h1>
      <p className="mt-3 text-steam">Review items, then place your order.</p>

      <ul className="mt-10 divide-y divide-line border-y border-line">
        {lines.map((line) => (
          <li key={line.menu_item_id} className="py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium tracking-wide text-foam">{line.name}</p>
                <p className="mt-0.5 text-sm text-steam">{formatCents(line.price_cents)} each</p>
              </div>
              <p className="font-semibold text-leaf">
                {formatCents(line.price_cents * line.quantity)}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                className="btn btn-secondary min-h-11 min-w-11 px-0"
                onClick={() => setQuantity(line.menu_item_id, line.quantity - 1)}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-8 text-center font-medium tabular-nums">{line.quantity}</span>
              <button
                type="button"
                className="btn btn-secondary min-h-11 min-w-11 px-0"
                onClick={() => setQuantity(line.menu_item_id, line.quantity + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
              <button
                type="button"
                className="btn btn-ghost ml-auto px-2 text-sm"
                onClick={() => removeItem(line.menu_item_id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 border border-line bg-forest/40 p-6">
        <label className="block text-sm font-medium text-steam" htmlFor="customer-name">
          Name for pickup <span className="text-leaf">*</span>
        </label>
        <input
          id="customer-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (error) setError(null)
          }}
          placeholder="Your name"
          className="field mt-2"
          required
          aria-required="true"
          autoComplete="name"
        />
        <div className="mt-6 flex items-center justify-between">
          <span className="text-steam">Total</span>
          <span className="font-display text-3xl font-semibold text-leaf">
            {formatCents(totalCents)}
          </span>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={submitting || !name.trim()}
          onClick={placeOrder}
          className="btn btn-primary mt-6 w-full"
        >
          {submitting ? 'Placing…' : 'Place order'}
        </button>
        <p className="mt-3 text-center text-xs tracking-wide text-steam">
          Pay at the counter — no online payment.
        </p>
      </div>
    </main>
  )
}
