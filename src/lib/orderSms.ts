import { displayOrderToken, type OrderWithItems } from '@/types/database'

/** Fire-and-forget order confirmation SMS (never blocks checkout). */
export async function notifyOrderSms(order: OrderWithItems): Promise<void> {
  const phone = order.customer_phone?.trim()
  if (!phone || !order.items.length) return

  try {
    await fetch('/api/order-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        customer_name: order.customer_name,
        tracking_token: order.tracking_token,
        token_number: order.token_number,
        token_label: displayOrderToken(order),
        total_cents: order.total_cents,
        items: order.items.map((i) => ({
          name: i.item_name,
          quantity: i.quantity,
        })),
      }),
    })
  } catch {
    /* SMS is best-effort */
  }
}
