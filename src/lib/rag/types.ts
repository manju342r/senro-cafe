export type RagSourceKind =
  | 'cafe'
  | 'location'
  | 'hours'
  | 'ordering'
  | 'menu'
  | 'policy'
  | 'faq'

export interface RagDocument {
  id: string
  title: string
  kind: RagSourceKind
  text: string
  metadata?: Record<string, string>
}

export interface RagChunk {
  id: string
  documentId: string
  title: string
  kind: RagSourceKind
  text: string
  metadata?: Record<string, string>
}

export interface RagHit {
  chunk: RagChunk
  score: number
}

export interface RagCitation {
  id: string
  title: string
  kind: RagSourceKind
}

export interface RagAnswer {
  answer: string
  citations: RagCitation[]
  confidence: 'high' | 'medium' | 'low'
  refused: boolean
  retrieved: RagHit[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  citations?: RagCitation[]
  confidence?: RagAnswer['confidence']
  createdAt: string
}
