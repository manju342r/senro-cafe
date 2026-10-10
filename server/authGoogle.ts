/**
 * Verify Google ID tokens for super-admin Gmail login.
 * Allowlist emails via ADMIN_EMAILS or VITE_ADMIN_EMAILS (comma-separated).
 */

import type { IncomingMessage, ServerResponse } from 'node:http'

type Env = Record<string, string | undefined>

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

function allowedEmails(env: Env): string[] {
  const raw = env.ADMIN_EMAILS || env.VITE_ADMIN_EMAILS || ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

async function verifyGoogleIdToken(credential: string, clientId: string) {
  const url = new URL('https://oauth2.googleapis.com/tokeninfo')
  url.searchParams.set('id_token', credential)
  const res = await fetch(url)
  const data = (await res.json()) as {
    error?: string
    email?: string
    email_verified?: string
    name?: string
    picture?: string
    aud?: string
    sub?: string
  }
  if (!res.ok || data.error) {
    throw new Error(data.error || 'Invalid Google token')
  }
  if (clientId && data.aud !== clientId) {
    throw new Error('Token audience mismatch — check VITE_GOOGLE_CLIENT_ID')
  }
  if (data.email_verified !== 'true') {
    throw new Error('Google email is not verified')
  }
  if (!data.email) throw new Error('No email on Google account')
  return {
    email: data.email.toLowerCase(),
    name: data.name || data.email,
    picture: data.picture || null,
    sub: data.sub || '',
  }
}

type ConnectMiddleware = {
  use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void
}

export function attachGoogleAuthApi(middlewares: ConnectMiddleware, env: Env = process.env) {
  middlewares.use((req, res, next) => {
    void (async () => {
      const url = req.url?.split('?')[0]
      if (url !== '/api/auth/google' && url !== '/api/auth/google/status') {
        next()
        return
      }

      if (req.method === 'OPTIONS') {
        res.statusCode = 204
        res.end()
        return
      }

      const clientId = (env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || '').trim()
      const allow = allowedEmails(env)

      if (url === '/api/auth/google/status' && req.method === 'GET') {
        sendJson(res, 200, {
          configured: Boolean(clientId),
          allowlistConfigured: allow.length > 0,
          clientIdPrefix: clientId ? `${clientId.slice(0, 12)}…` : null,
        })
        return
      }

      if (url === '/api/auth/google' && req.method === 'POST') {
        if (!clientId) {
          sendJson(res, 503, {
            error:
              'Google login not configured. Set VITE_GOOGLE_CLIENT_ID in .env (Google Cloud OAuth Web client).',
          })
          return
        }
        if (!allow.length) {
          sendJson(res, 503, {
            error:
              'No super-admin emails configured. Set ADMIN_EMAILS=you@gmail.com in .env',
          })
          return
        }

        try {
          const body = await readJson(req)
          const credential = String(body.credential || '').trim()
          if (!credential) {
            sendJson(res, 400, { error: 'credential required' })
            return
          }

          const profile = await verifyGoogleIdToken(credential, clientId)
          if (!allow.includes(profile.email)) {
            sendJson(res, 403, {
              error: `${profile.email} is not an allowed super admin. Add it to ADMIN_EMAILS in .env.`,
            })
            return
          }

          sendJson(res, 200, {
            ok: true,
            role: 'admin',
            email: profile.email,
            name: profile.name,
            picture: profile.picture,
          })
        } catch (e) {
          sendJson(res, 401, {
            error: e instanceof Error ? e.message : 'Google sign-in failed',
          })
        }
        return
      }

      sendJson(res, 405, { error: 'Method not allowed' })
    })()
  })
}
