import { displayOrderToken, type OrderWithItems } from '@/types/database'

const MY_ORDERS_KEY = 'mana-katha-my-orders-v1'

export type SavedOrderRef = {
  tracking_token: string
  token_label: string
  customer_name: string
  total_cents: number
  created_at: string
}

export function orderTrackingPath(trackingToken: string): string {
  return `/orders/${trackingToken}`
}

export function orderTrackingUrl(trackingToken: string): string {
  if (typeof window === 'undefined') return orderTrackingPath(trackingToken)
  return `${window.location.origin}${orderTrackingPath(trackingToken)}`
}

export function rememberOrder(order: OrderWithItems): void {
  try {
    const entry: SavedOrderRef = {
      tracking_token: order.tracking_token,
      token_label: displayOrderToken(order),
      customer_name: order.customer_name,
      total_cents: order.total_cents,
      created_at: order.created_at,
    }
    const prev = listRememberedOrders().filter((o) => o.tracking_token !== order.tracking_token)
    localStorage.setItem(MY_ORDERS_KEY, JSON.stringify([entry, ...prev].slice(0, 20)))
  } catch {
    /* ignore quota / private mode */
  }
}

export function listRememberedOrders(): SavedOrderRef[] {
  try {
    const raw = localStorage.getItem(MY_ORDERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedOrderRef[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
