import { generateGroundedAnswer } from '@/lib/rag/generate'
import { answerRecommendation, isRecommendationQuery } from '@/lib/rag/recommend'
import { retrieve } from '@/lib/rag/retrieve'
import type { RagAnswer, RagCitation, RagHit } from '@/lib/rag/types'

export interface AskOptions {
  topK?: number
  minScore?: number
}

export interface ChatStatus {
  live: boolean
  model: string | null
  provider: string | null
}

let statusCache: { at: number; value: ChatStatus } | null = null

export async function getChatStatus(): Promise<ChatStatus> {
  const now = Date.now()
  if (statusCache && now - statusCache.at < 15_000) return statusCache.value

  try {
    const res = await fetch('/api/chat/status')
    if (!res.ok) throw new Error('status failed')
    const data = (await res.json()) as ChatStatus
    statusCache = { at: now, value: data }
    return data
  } catch {
    const fallback = { live: false, model: null, provider: null }
    statusCache = { at: now, value: fallback }
    return fallback
  }
}

function hitsToChunks(hits: RagHit[]) {
  return hits.map((h) => ({
    id: h.chunk.id,
    title: h.chunk.title,
    kind: h.chunk.kind,
    text: h.chunk.text,
  }))
}

async function askLiveLlm(
  query: string,
  chunks: ReturnType<typeof hitsToChunks>,
  citations: RagCitation[],
): Promise<RagAnswer | null> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, chunks }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.warn('[chat]', data?.error || res.statusText)
      return null
    }
    return {
      answer: String(data.answer || ''),
      citations:
        Array.isArray(data.citations) && data.citations.length
          ? data.citations
          : citations,
      confidence: data.confidence ?? 'high',
      refused: Boolean(data.refused),
      retrieved: [],
    }
  } catch (e) {
    console.warn('[chat] live request failed', e)
    return null
  }
}

/**
 * RAG pipeline: retrieve locally → live LLM when configured.
 * Category recommendations (best coffee, best pizza, …) stay menu-filtered and exact.
 */
export async function askCafeRag(query: string, opts: AskOptions = {}): Promise<RagAnswer> {
  const topK = opts.topK ?? 5
  const minScore = opts.minScore ?? 0.07

  await new Promise((r) => setTimeout(r, 120))

  // Keep "best coffee / pizza / …" strictly on-category (no LLM mix-ups).
  if (isRecommendationQuery(query)) {
    return answerRecommendation(query)
  }

  const status = await getChatStatus()
  const hits = retrieve(query, topK, minScore)
  const local = generateGroundedAnswer(query, hits)
  const chunks = hitsToChunks(hits)

  if (status.live) {
    const live = await askLiveLlm(query, chunks, local.citations)
    if (live?.answer) return live
  }

  return local
}

export const SUGGESTED_PROMPTS = [
  'Best coffee here?',
  'Best pizza?',
  'What are your hours?',
  'Where is the café?',
  'How do I order ahead?',
] as const
