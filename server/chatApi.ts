/**
 * Server-only café chat (RAG generation).
 * Prefers free Gemini (GEMINI_API_KEY), falls back to OpenAI-compatible keys.
 * Never expose keys via VITE_*.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'

type Env = Record<string, string | undefined>

interface ContextChunk {
  id?: string
  title?: string
  kind?: string
  text?: string
}

type Provider = 'gemini' | 'openai-compatible'

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}'
        resolve(JSON.parse(raw) as Record<string, unknown>)
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(payload)
}

export function getChatConfig(env: Env = process.env) {
  const geminiKey = (env.GEMINI_API_KEY || env.GOOGLE_API_KEY || '').trim()
  const openaiKey = (env.OPENAI_API_KEY || '').trim()

  if (geminiKey) {
    return {
      live: true,
      provider: 'gemini' as Provider,
      apiKey: geminiKey,
      model: (env.RAG_CHAT_MODEL || 'gemini-2.0-flash').trim(),
      baseUrl: '',
    }
  }

  if (openaiKey) {
    return {
      live: true,
      provider: 'openai-compatible' as Provider,
      apiKey: openaiKey,
      model: (env.RAG_CHAT_MODEL || 'gpt-4o-mini').trim(),
      baseUrl: (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
    }
  }

  return {
    live: false,
    provider: 'gemini' as Provider,
    apiKey: '',
    model: 'gemini-2.0-flash',
    baseUrl: '',
  }
}

function buildSystemPrompt() {
  return `You are the Maña Katha Café (MKC) assistant for a rooftop café in Vanasthalipuram, Hyderabad.

Rules:
- Answer ONLY using the provided CONTEXT blocks.
- If the answer is not in CONTEXT, say you don't know and suggest Menu or Visit pages.
- Never invent prices, hours, or dishes not present in CONTEXT.
- Be warm, concise, and helpful (2–6 short sentences or a short bullet list).
- For recommendations, suggest at most 3 items and include prices only if present in CONTEXT.
- Never mention internal systems, API keys, or model names unless asked how you work — say you use café knowledge with AI assistance.
- Do not discuss unrelated topics (politics, coding help, etc.).`
}

function buildUserPrompt(query: string, chunks: ContextChunk[]) {
  const context =
    chunks.length === 0
      ? '(No café context retrieved.)'
      : chunks
          .map(
            (c, i) =>
              `[${i + 1}] ${c.title ?? 'Source'}${c.kind ? ` (${c.kind})` : ''}\n${c.text ?? ''}`,
          )
          .join('\n\n')

  return `CONTEXT:\n${context}\n\nQUESTION:\n${query}`
}

async function callGemini(opts: {
  apiKey: string
  model: string
  query: string
  chunks: ContextChunk[]
}) {
  const model = opts.model.replace(/^models\//, '')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': opts.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemPrompt() }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: buildUserPrompt(opts.query, opts.chunks) }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 500,
      },
    }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string }
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini error ${res.status}`)
  }

  const answer = data?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || '')
    .join('')
    .trim()

  if (!answer) throw new Error('Empty Gemini response')
  return answer
}

async function callOpenAI(opts: {
  baseUrl: string
  apiKey: string
  model: string
  query: string
  chunks: ContextChunk[]
}) {
  const res = await fetch(`${opts.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0.4,
      max_tokens: 500,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(opts.query, opts.chunks) },
      ],
    }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string }
    choices?: Array<{ message?: { content?: string } }>
  }
  if (!res.ok) {
    throw new Error(data?.error?.message || `OpenAI error ${res.status}`)
  }

  const answer = data?.choices?.[0]?.message?.content?.trim()
  if (!answer) throw new Error('Empty model response')
  return answer
}

type ConnectMiddleware = {
  use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void
}

export function attachChatApi(middlewares: ConnectMiddleware, env: Env = process.env) {
  middlewares.use((req, res, next) => {
    void (async () => {
      const url = req.url?.split('?')[0]
      if (url !== '/api/chat' && url !== '/api/chat/status') {
        next()
        return
      }

      if (req.method === 'OPTIONS') {
        res.statusCode = 204
        res.end()
        return
      }

      const config = getChatConfig(env)

      if (url === '/api/chat/status' && req.method === 'GET') {
        sendJson(res, 200, {
          live: config.live,
          model: config.live ? config.model : null,
          provider: config.live ? config.provider : null,
        })
        return
      }

      if (url === '/api/chat' && req.method === 'POST') {
        if (!config.live) {
          sendJson(res, 503, {
            error:
              'Live LLM not configured. Add GEMINI_API_KEY to .env (free from Google AI Studio) and restart npm run dev.',
          })
          return
        }

        try {
          const body = await readJson(req)
          const query = String(body.query || '').trim()
          const rawChunks = Array.isArray(body.chunks) ? body.chunks : []
          const chunks = rawChunks.slice(0, 8) as ContextChunk[]

          if (!query) {
            sendJson(res, 400, { error: 'query is required' })
            return
          }

          const answer =
            config.provider === 'gemini'
              ? await callGemini({
                  apiKey: config.apiKey,
                  model: config.model,
                  query,
                  chunks,
                })
              : await callOpenAI({
                  baseUrl: config.baseUrl,
                  apiKey: config.apiKey,
                  model: config.model,
                  query,
                  chunks,
                })

          const citations = chunks.slice(0, 4).map((c, i) => ({
            id: c.id || `ctx-${i}`,
            title: c.title || 'Source',
            kind: c.kind || 'faq',
          }))

          sendJson(res, 200, {
            answer,
            citations,
            confidence: chunks.length ? 'high' : 'medium',
            refused: false,
            live: true,
            model: config.model,
            provider: config.provider,
          })
        } catch (e) {
          sendJson(res, 502, {
            error: e instanceof Error ? e.message : 'Chat generation failed',
          })
        }
        return
      }

      sendJson(res, 405, { error: 'Method not allowed' })
    })()
  })
}
