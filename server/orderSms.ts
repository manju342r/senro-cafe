/**
 * Server-only order confirmation SMS.
 * Supports Fast2SMS (India) or Twilio. Never expose keys via VITE_*.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'

type Env = Record<string, string | undefined>

export type OrderSmsPayload = {
  phone: string
  customer_name: string
  tracking_token: string
  /** Short daily pickup number when available. */
  token_label?: string
  total_cents: number
  items: { name: string; quantity: number }[]
}

type ConnectMiddleware = {
  use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void
}

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as Record<string, unknown>)
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** 10-digit Indian mobile */
export function toIndiaMobile(raw: string): string | null {
  const d = digitsOnly(raw)
  if (d.length === 10 && /^[6-9]/.test(d)) return d
  if (d.length === 12 && d.startsWith('91') && /^[6-9]/.test(d.slice(2))) return d.slice(2)
  if (d.length === 11 && d.startsWith('0') && /^[6-9]/.test(d.slice(1))) return d.slice(1)
  return null
}

export function formatInr(cents: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function buildOrderSmsText(payload: OrderSmsPayload): string {
  const lines = payload.items
    .slice(0, 8)
    .map((i) => `${i.quantity}x ${i.name}`)
    .join(', ')
  const extra = payload.items.length > 8 ? ` +${payload.items.length - 8} more` : ''
  const token =
    payload.token_label?.trim() ||
    payload.tracking_token.slice(0, 8)
  return [
    `Maña Katha Café`,
    `Hi ${payload.customer_name}, order confirmed.`,
    `Token: ${token}`,
    `Items: ${lines}${extra}`,
    `Total: ${formatInr(payload.total_cents)}`,
    `Pay at the counter on pickup.`,
  ].join('\n')
}

function smsConfig(env: Env) {
  const fast2sms = (env.FAST2SMS_API_KEY || '').trim()
  const twilioSid = (env.TWILIO_ACCOUNT_SID || '').trim()
  const twilioToken = (env.TWILIO_AUTH_TOKEN || '').trim()
  const twilioFrom = (env.TWILIO_FROM_NUMBER || '').trim()
  if (fast2sms) return { provider: 'fast2sms' as const, apiKey: fast2sms }
  if (twilioSid && twilioToken && twilioFrom) {
    return { provider: 'twilio' as const, sid: twilioSid, token: twilioToken, from: twilioFrom }
  }
  return { provider: 'none' as const }
}

async function sendFast2Sms(apiKey: string, mobile10: string, message: string) {
  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q',
      message,
      language: 'english',
      flash: 0,
      numbers: mobile10,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as { return?: boolean; message?: string | string[] }
  if (!res.ok || data.return === false) {
    const detail = Array.isArray(data.message) ? data.message.join(', ') : data.message
    throw new Error(detail || `Fast2SMS HTTP ${res.status}`)
  }
  return data
}

async function sendTwilio(
  sid: string,
  token: string,
  from: string,
  mobile10: string,
  message: string,
) {
  const to = `+91${mobile10}`
  const body = new URLSearchParams({ To: to, From: from, Body: message })
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string }
  if (!res.ok) throw new Error(data.message || `Twilio HTTP ${res.status}`)
  return data
}

export async function dispatchOrderSms(payload: OrderSmsPayload, env: Env = process.env) {
  const mobile = toIndiaMobile(payload.phone)
  if (!mobile) throw new Error('Invalid phone number for SMS')

  const message = buildOrderSmsText(payload)
  const config = smsConfig(env)

  if (config.provider === 'none') {
    console.info('[order-sms] skipped (no FAST2SMS_API_KEY or TWILIO_* in env)\n', message)
    return { ok: false, skipped: true as const, provider: null, preview: message }
  }

  if (config.provider === 'fast2sms') {
    await sendFast2Sms(config.apiKey, mobile, message)
    return { ok: true as const, skipped: false as const, provider: 'fast2sms' as const }
  }

  await sendTwilio(config.sid, config.token, config.from, mobile, message)
  return { ok: true as const, skipped: false as const, provider: 'twilio' as const }
}

export function attachOrderSmsApi(middlewares: ConnectMiddleware, env: Env = process.env) {
  middlewares.use((req, res, next) => {
    void (async () => {
      const url = req.url?.split('?')[0]
      if (url !== '/api/order-sms' && url !== '/api/order-sms/status') {
        next()
        return
      }

      if (req.method === 'OPTIONS') {
        res.statusCode = 204
        res.end()
        return
      }

      if (url === '/api/order-sms/status' && req.method === 'GET') {
        const config = smsConfig(env)
        sendJson(res, 200, {
          live: config.provider !== 'none',
          provider: config.provider === 'none' ? null : config.provider,
        })
        return
      }

      if (url === '/api/order-sms' && req.method === 'POST') {
        try {
          const body = await readJson(req)
          const itemsRaw = Array.isArray(body.items) ? body.items : []
          const payload: OrderSmsPayload = {
            phone: String(body.phone || ''),
            customer_name: String(body.customer_name || 'Guest').trim() || 'Guest',
            tracking_token: String(body.tracking_token || '').trim(),
            token_label: body.token_label ? String(body.token_label) : undefined,
            total_cents: Number(body.total_cents) || 0,
            items: itemsRaw
              .slice(0, 20)
              .map((row) => {
                const r = row as { name?: unknown; quantity?: unknown }
                return {
                  name: String(r.name || 'Item'),
                  quantity: Math.max(1, Number(r.quantity) || 1),
                }
              }),
          }

          if (!payload.tracking_token || payload.items.length === 0) {
            sendJson(res, 400, { error: 'tracking_token and items are required' })
            return
          }

          const result = await dispatchOrderSms(payload, env)
          sendJson(res, 200, result)
        } catch (e) {
          sendJson(res, 500, {
            error: e instanceof Error ? e.message : 'SMS failed',
          })
        }
        return
      }

      sendJson(res, 405, { error: 'Method not allowed' })
    })().catch((e) => {
      sendJson(res, 500, { error: e instanceof Error ? e.message : 'SMS error' })
    })
  })
}
