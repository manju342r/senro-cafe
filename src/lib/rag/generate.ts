import type { RagAnswer, RagCitation, RagHit } from '@/lib/rag/types'

const OFF_TOPIC =
  /^(hi|hello|hey|yo)\b|weather|crypto|politics|code this|write code|hack|password|jailbreak/i

function isGreeting(q: string) {
  return /^(hi|hello|hey|good\s+(morning|evening|afternoon)|namaste)\b/i.test(q.trim())
}

function dedupeCitations(hits: RagHit[]): RagCitation[] {
  const seen = new Set<string>()
  const out: RagCitation[] = []
  for (const h of hits) {
    const key = h.chunk.documentId
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ id: h.chunk.id, title: h.chunk.title, kind: h.chunk.kind })
  }
  return out.slice(0, 4)
}

function confidenceFromHits(hits: RagHit[]): RagAnswer['confidence'] {
  if (!hits.length) return 'low'
  const top = hits[0].score
  if (top >= 0.28) return 'high'
  if (top >= 0.14) return 'medium'
  return 'low'
}

function synthesizeFromHits(query: string, hits: RagHit[]): string {
  const q = query.toLowerCase()
  const kinds = new Set(hits.map((h) => h.chunk.kind))

  // Prefer concise lead-ins by intent
  let lead = 'Here’s what I found from Maña Katha’s info:'
  if (kinds.has('menu') && (q.includes('price') || q.includes('cost') || q.includes('₹') || q.includes('rupee'))) {
    lead = 'From the live menu:'
  } else if (kinds.has('hours') || q.includes('open') || q.includes('timing') || q.includes('hour')) {
    lead = 'About our hours:'
  } else if (kinds.has('location') || q.includes('where') || q.includes('address') || q.includes('map')) {
    lead = 'Here’s how to find us:'
  } else if (kinds.has('ordering') || q.includes('order') || q.includes('pay') || q.includes('cart')) {
    lead = 'About ordering ahead:'
  }

  // Merge unique sentences from top chunks (grounded — no invented facts)
  const sentences: string[] = []
  const seen = new Set<string>()
  for (const hit of hits.slice(0, 4)) {
    for (const s of hit.chunk.text.split(/(?<=\.)\s+/)) {
      const t = s.trim()
      if (!t || seen.has(t)) continue
      seen.add(t)
      sentences.push(t)
      if (sentences.length >= 5) break
    }
    if (sentences.length >= 5) break
  }

  return `${lead}\n\n${sentences.join(' ')}`
}

/**
 * Grounded generation from retrieved chunks only (no external LLM key on the client).
 * Architecture mirrors production RAG: retrieve → augment → generate.
 * Swap this module for a server call to OpenAI/Anthropic with the same context pack.
 */
export function generateGroundedAnswer(query: string, hits: RagHit[]): RagAnswer {
  const trimmed = query.trim()

  if (isGreeting(trimmed)) {
    return {
      answer:
        'Hi — I’m the Maña Katha assistant. Ask about the menu, prices, hours, location, ordering, or what food is best / best for the season. I answer from our café knowledge — no external AI key on this demo.',
      citations: [],
      confidence: 'high',
      refused: false,
      retrieved: [],
    }
  }

  if (!hits.length) {
    const off = OFF_TOPIC.test(trimmed) && !/menu|cafe|café|coffee|order|hour|address|hyd/i.test(trimmed)
    return {
      answer: off
        ? 'I can only help with Maña Katha Café — menu, hours, location, and ordering. Try asking about a dish, our rooftop address, or how pickup works.'
        : 'I don’t have enough grounded info for that. Try asking about a menu item, opening hours, Vanasthalipuram location, or how to order ahead. You can also open the Menu page or Visit for directions.',
      citations: [],
      confidence: 'low',
      refused: true,
      retrieved: [],
    }
  }

  const citations = dedupeCitations(hits)
  const confidence = confidenceFromHits(hits)
  const answer = synthesizeFromHits(trimmed, hits)

  return {
    answer,
    citations,
    confidence,
    refused: false,
    retrieved: hits,
  }
}
