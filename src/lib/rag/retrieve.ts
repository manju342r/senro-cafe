import { buildKnowledgeChunks } from '@/lib/rag/knowledge'
import { buildIdf, cosine, tokenize, toTfIdf, type SparseVector } from '@/lib/rag/embed'
import type { RagChunk, RagHit } from '@/lib/rag/types'

interface RagIndex {
  chunks: RagChunk[]
  vectors: SparseVector[]
  idf: Map<string, number>
  builtAt: number
}

let cache: RagIndex | null = null
const TTL_MS = 30_000

function getIndex(): RagIndex {
  const now = Date.now()
  if (cache && now - cache.builtAt < TTL_MS) return cache

  const chunks = buildKnowledgeChunks()
  const tokenized = chunks.map((c) => tokenize(`${c.title} ${c.text}`))
  const idf = buildIdf(tokenized)
  const vectors = tokenized.map((tokens) => toTfIdf(tokens, idf))
  cache = { chunks, vectors, idf, builtAt: now }
  return cache
}

/** Invalidate after menu availability / price changes if needed. */
export function invalidateRagIndex() {
  cache = null
}

/**
 * Retrieve top-k chunks for a query (RAG retrieval step).
 */
export function retrieve(query: string, k = 5, minScore = 0.08): RagHit[] {
  const q = query.trim()
  if (!q) return []

  const index = getIndex()
  const qVec = toTfIdf(tokenize(q), index.idf)

  const scored: RagHit[] = index.chunks.map((chunk, i) => ({
    chunk,
    score: cosine(qVec, index.vectors[i]),
  }))

  return scored
    .filter((h) => h.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
}
