import { dispatchOrderSms, type OrderSmsPayload } from '../server/orderSms'

type VercelReq = {
  method?: string
  body?: unknown
}

type VercelRes = {
  status: (code: number) => VercelRes
  json: (body: unknown) => void
  end: () => void
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method === 'GET') {
    const hasFast = Boolean(process.env.FAST2SMS_API_KEY?.trim())
    const hasTwilio = Boolean(
      process.env.TWILIO_ACCOUNT_SID?.trim() &&
        process.env.TWILIO_AUTH_TOKEN?.trim() &&
        process.env.TWILIO_FROM_NUMBER?.trim(),
    )
    res.status(200).json({
      live: hasFast || hasTwilio,
      provider: hasFast ? 'fast2sms' : hasTwilio ? 'twilio' : null,
    })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const body = (
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body ?? {}
    ) as Record<string, unknown>
    const itemsRaw = Array.isArray(body.items) ? body.items : []
    const payload: OrderSmsPayload = {
      phone: String(body.phone || ''),
      customer_name: String(body.customer_name || 'Guest').trim() || 'Guest',
      tracking_token: String(body.tracking_token || '').trim(),
      token_label: body.token_label ? String(body.token_label) : undefined,
      total_cents: Number(body.total_cents) || 0,
      items: itemsRaw.slice(0, 20).map((row) => {
        const r = row as { name?: unknown; quantity?: unknown }
        return {
          name: String(r.name || 'Item'),
          quantity: Math.max(1, Number(r.quantity) || 1),
        }
      }),
    }

    if (!payload.tracking_token || payload.items.length === 0) {
      res.status(400).json({ error: 'tracking_token and items are required' })
      return
    }

    const result = await dispatchOrderSms(payload, process.env)
    res.status(200).json(result)
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'SMS failed' })
  }
}
