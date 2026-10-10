import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

const LOCAL_KEY = 'mana-katha-feedback-v1'

export type FeedbackStatus = 'new' | 'reviewed' | 'resolved'

export type FeedbackInput = {
  name: string
  message: string
  rating?: number
  phone?: string
  email?: string
}

export type Feedback = {
  id: string
  name: string
  message: string
  rating: number | null
  phone: string | null
  email: string | null
  status: FeedbackStatus
  created_at: string
}

function loadLocal(): Feedback[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Feedback[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocal(rows: Feedback[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 300)))
}

function upsertLocal(row: Feedback) {
  const prev = loadLocal().filter((b) => b.id !== row.id)
  saveLocal([row, ...prev])
}

export async function submitFeedback(input: FeedbackInput): Promise<'saved'> {
  const name = input.name.trim()
  const message = input.message.trim()
  if (!name) throw new Error('Enter your name.')
  if (!message) throw new Error('Enter your feedback.')
  if (message.length < 3) throw new Error('Feedback is too short.')

  let rating: number | null = null
  if (input.rating != null && Number.isFinite(input.rating)) {
    const r = Math.round(input.rating)
    if (r < 1 || r > 5) throw new Error('Rating must be 1–5.')
    rating = r
  }

  const localRow: Feedback = {
    id: crypto.randomUUID(),
    name,
    message,
    rating,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    status: 'new',
    created_at: new Date().toISOString(),
  }

  upsertLocal(localRow)

  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase()
      const { data, error } = await sb
        .from('feedbacks')
        .insert({
          name: localRow.name,
          message: localRow.message,
          rating: localRow.rating,
          phone: localRow.phone,
          email: localRow.email,
          status: 'new',
        })
        .select('*')
        .maybeSingle()

      if (!error && data) {
        upsertLocal({
          ...localRow,
          id: data.id,
          created_at: data.created_at ?? localRow.created_at,
          status: (data.status as FeedbackStatus) || 'new',
        })
      }
    } catch {
      // Local copy already saved for super admin on this device.
    }
  }

  return 'saved'
}

export async function listFeedbacks(): Promise<Feedback[]> {
  const local = loadLocal()

  if (!isSupabaseConfigured()) {
    return [...local].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  }

  const sb = getSupabase()
  const { data, error } = await sb
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) {
    return [...local].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  }

  const remote = data.map(
    (row): Feedback => ({
      id: row.id,
      name: row.name,
      message: row.message,
      rating: row.rating ?? null,
      phone: row.phone ?? null,
      email: row.email ?? null,
      status: (row.status as FeedbackStatus) || 'new',
      created_at: row.created_at,
    }),
  )

  const byId = new Map<string, Feedback>()
  for (const row of [...remote, ...local]) byId.set(row.id, row)
  return [...byId.values()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  const local = loadLocal()
  saveLocal(local.map((b) => (b.id === id ? { ...b, status } : b)))

  if (!isSupabaseConfigured()) return
  const sb = getSupabase()
  await sb.from('feedbacks').update({ status }).eq('id', id)
}
