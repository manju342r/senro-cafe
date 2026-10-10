import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getOrderByToken, refreshOrderByToken } from '@/lib/demoStore'
import { useDemoState } from '@/hooks/useDemo'
import { StatusBadge } from '@/components/shared/StatusBadge'
import {
  listRememberedOrders,
  orderTrackingUrl,
  rememberOrder,
} from '@/lib/orderRef'
import { downloadOrderReceiptPdf } from '@/lib/orderReceiptPdf'
import { formatCents, type OrderStatus } from '@/types/database'

const STEPS: OrderStatus[] = ['received', 'accepted', 'preparing', 'ready', 'completed']
const LIVE_POLL_MS = 2500

export function OrderTrackingPage() {
  const live = useDemoState()
  const { trackingToken = '' } = useParams()
  const order = getOrderByToken(trackingToken)
  const [copied, setCopied] = useState(false)
  const remembered = listRememberedOrders()

  useEffect(() => {
    if (order) rememberOrder(order)
  }, [order?.id, order?.tracking_token])

  // Keep status in sync when staff advances the order (no manual reload).
  useEffect(() => {
    if (!trackingToken) return
    let cancelled = false

    const tick = async () => {
      if (cancelled || document.visibilityState === 'hidden') return
      try {
        await refreshOrderByToken(trackingToken)
      } catch {
        /* keep last known status */
      }
    }

    void tick()
    const id = window.setInterval(() => void tick(), LIVE_POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [trackingToken])

  if (!live.ready) {
    return (
      <main className="page-shell-narrow py-20">
        <p className="text-steam">Loading order…</p>
      </main>
    )
  }

  if (!order) {
    return (
      <main className="page-shell-narrow py-20">
        <h1 className="type-page text-leaf">Order not found</h1>
        <p className="mt-4 text-steam">
          Check your token ID or open the tracking link from your receipt.
        </p>
        {remembered.length > 0 ? (
          <section className="mt-10 border border-line bg-forest/40 p-5">
            <h2 className="type-section text-foam">Orders on this device</h2>
            <ul className="mt-4 space-y-3">
              {remembered.map((o) => (
                <li key={o.tracking_token}>
                  <Link
                    to={`/orders/${o.tracking_token}`}
                    className="flex flex-col gap-1 text-sm hover:text-leaf sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                  >
                    <span className="break-all font-semibold text-leaf">{o.tracking_token}</span>
                    <span className="text-steam">{o.customer_name}</span>
                    <span className="tabular-nums text-foam">{formatCents(o.total_cents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <Link to="/menu" className="btn btn-primary mt-10">
          Menu
        </Link>
      </main>
    )
  }

  const tokenId = order.tracking_token
  const trackUrl = orderTrackingUrl(order.tracking_token)
  const activeIndex = order.status === 'cancelled' ? -1 : STEPS.indexOf(order.status)
  const waitMins = order.estimated_ready_at
    ? Math.max(
        0,
        Math.ceil((new Date(order.estimated_ready_at).getTime() - Date.now()) / 60000),
      )
    : null

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(tokenId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="page-shell-narrow">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="eyebrow">Order placed</p>
        <h1 className="type-page mt-2 text-leaf">{order.customer_name}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <StatusBadge status={order.status} />
          <span className="font-medium text-steam">{formatCents(order.total_cents)}</span>
        </div>
      </motion.div>

      <section className="mt-8 border border-leaf/40 bg-leaf/10 p-5">
        <p className="eyebrow text-leaf">Your token ID</p>
        <p className="mt-2 break-all font-mono text-lg font-semibold tracking-wide text-leaf sm:text-xl">
          {tokenId}
        </p>
        <p className="mt-3 text-sm text-steam">
          Save this token ID. Use it to track your order if you close this page. Download a PDF
          anytime with the button below.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={() => void copyToken()}>
            {copied ? 'Copied' : 'Copy token ID'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => void downloadOrderReceiptPdf(order)}
          >
            Download PDF receipt
          </button>
        </div>
        <p className="mt-4 break-all text-xs text-steam/80">
          Tracking link:{' '}
          <a href={trackUrl} className="text-leaf underline-offset-2 hover:underline">
            {trackUrl}
          </a>
        </p>
      </section>

      {order.status === 'ready' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-8 border border-leaf/30 bg-leaf/15 px-4 py-3.5 font-semibold tracking-wide text-leaf"
        >
          Ready for pickup — pay at the counter.
        </motion.p>
      )}

      {order.status !== 'cancelled' &&
        order.status !== 'completed' &&
        order.status !== 'ready' &&
        waitMins !== null && (
          <p className="mt-8 font-medium text-leaf">
            Estimated ready in about {waitMins} min
          </p>
        )}

      {order.status !== 'cancelled' && (
        <ol className="mt-10 space-y-4">
          {STEPS.map((step, i) => {
            const done = activeIndex >= 0 && i <= activeIndex
            return (
              <li key={step} className="flex items-center gap-3.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${done ? 'bg-leaf' : 'bg-steam/30'}`}
                />
                <span
                  className={`text-sm font-medium tracking-wide ${
                    done ? 'text-foam' : 'text-steam/55'
                  }`}
                >
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </span>
              </li>
            )
          })}
        </ol>
      )}

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="type-section text-foam">Items</h2>
        <ul className="mt-5 space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span className="text-steam">
                {item.quantity}× {item.item_name}
              </span>
              <span className="font-medium tabular-nums">
                {formatCents(item.item_price_cents * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="type-section text-foam">Timeline</h2>
        {order.events.length === 0 ? (
          <p className="mt-4 text-sm text-steam">No events yet.</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {order.events.map((event) => (
              <li key={event.id} className="text-sm text-steam">
                <span className="font-medium text-foam">{event.to_status}</span>
                {' · '}
                {new Date(event.created_at).toLocaleTimeString()}
                {event.notes ? ` — ${event.notes}` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link to="/menu" className="btn btn-ghost mt-10">
        ← Back to menu
      </Link>
    </main>
  )
}
