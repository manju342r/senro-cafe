/**
 * Lightweight TF-IDF embeddings for client-side RAG retrieval.
 * No API keys required. Swap for OpenAI/Voyage embeddings on a server later.
 */

const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are',
  'was', 'were', 'be', 'been', 'with', 'from', 'by', 'as', 'it', 'this', 'that', 'you',
  'your', 'we', 'our', 'do', 'does', 'did', 'can', 'will', 'me', 'my', 'i', 'what', 'where',
  'when', 'how', 'which', 'who', 'please', 'tell', 'about',
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP.has(t))
}

export type SparseVector = Map<string, number>

export function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1)
  const n = tokens.length || 1
  for (const [k, v] of tf) tf.set(k, v / n)
  return tf
}

export function buildIdf(docs: string[][]): Map<string, number> {
  const df = new Map<string, number>()
  const N = docs.length || 1
  for (const tokens of docs) {
    const uniq = new Set(tokens)
    for (const t of uniq) df.set(t, (df.get(t) ?? 0) + 1)
  }
  const idf = new Map<string, number>()
  for (const [term, count] of df) {
    idf.set(term, Math.log(1 + N / (1 + count)) + 1)
  }
  return idf
}

export function toTfIdf(tokens: string[], idf: Map<string, number>): SparseVector {
  const tf = termFrequency(tokens)
  const vec: SparseVector = new Map()
  for (const [term, f] of tf) {
    vec.set(term, f * (idf.get(term) ?? 1))
  }
  return vec
}

export function cosine(a: SparseVector, b: SparseVector): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (const [, v] of a) na += v * v
  for (const [, v] of b) nb += v * v
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  if (denom === 0) return 0
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a]
  for (const [term, v] of smaller) {
    const u = larger.get(term)
    if (u !== undefined) dot += v * u
  }
  return dot / denom
}
