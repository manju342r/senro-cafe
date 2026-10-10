import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

const LOCAL_KEY = 'mana-katha-event-bookings-v1'

export type EventBookingStatus = 'new' | 'contacted' | 'confirmed' | 'declined' | 'done'

export type EventBookingInput = {
  name: string
  phone: string
  email?: string
  event_date?: string
  guest_count?: number
  occasion?: string
  notes?: string
}

export type EventBooking = {
  id: string
  name: string
  phone: string
  email: string | null
  event_date: string | null
  guest_count: number | null
  occasion: string | null
  notes: string | null
  status: EventBookingStatus
  created_at: string
}

function loadLocal(): EventBooking[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as EventBooking[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocal(rows: EventBooking[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 200)))
}

function upsertLocal(row: EventBooking) {
  const prev = loadLocal().filter((b) => b.id !== row.id)
  saveLocal([row, ...prev])
}

export function whatsappBookingUrl(input: EventBookingInput): string {
  const lines = [
    `Hi Maña Katha — I'd like to book an event.`,
    `Name: ${input.name}`,
    `Phone: ${input.phone}`,
  ]
  if (input.event_date) lines.push(`Date: ${input.event_date}`)
  if (input.guest_count) lines.push(`Guests: ${input.guest_count}`)
  if (input.occasion) lines.push(`Occasion: ${input.occasion}`)
  if (input.notes?.trim()) lines.push(`Notes: ${input.notes.trim()}`)
  const text = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/918883031111?text=${text}`
}

export async function submitEventBooking(input: EventBookingInput): Promise<'saved'> {
  const name = input.name.trim()
  const phone = input.phone.trim()
  if (!name) throw new Error('Enter your name.')
  if (!phone) throw new Error('Enter your phone number.')

  const localRow: EventBooking = {
    id: crypto.randomUUID(),
    name,
    phone,
    email: input.email?.trim() || null,
    event_date: input.event_date || null,
    guest_count: input.guest_count && input.guest_count > 0 ? input.guest_count : null,
    occasion: input.occasion?.trim() || null,
    notes: input.notes?.trim() || null,
    status: 'new',
    created_at: new Date().toISOString(),
  }

  // Always save for the super-admin Event bookings panel (this device).
  upsertLocal(localRow)

  // Best-effort sync to Supabase when configured — never redirect to WhatsApp on submit.
  if (isSupabaseConfigured()) {
    try {
      const sb = getSupabase()
      const { data, error } = await sb
        .from('event_bookings')
        .insert({
          name: localRow.name,
          phone: localRow.phone,
          email: localRow.email,
          event_date: localRow.event_date,
          guest_count: localRow.guest_count,
          occasion: localRow.occasion,
          notes: localRow.notes,
          status: 'new',
        })
        .select('*')
        .maybeSingle()

      if (!error && data) {
        upsertLocal({
          ...localRow,
          id: data.id,
          created_at: data.created_at ?? localRow.created_at,
          status: (data.status as EventBookingStatus) || 'new',
        })
      }
    } catch {
      // Local copy already saved for super admin.
    }
  }

  return 'saved'
}

export async function listEventBookings(): Promise<EventBooking[]> {
  const local = loadLocal()

  if (!isSupabaseConfigured()) {
    return [...local].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  }

  const sb = getSupabase()
  const { data, error } = await sb
    .from('event_bookings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) {
    return [...local].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  }

  const remote = data.map(
    (row): EventBooking => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email ?? null,
      event_date: row.event_date ?? null,
      guest_count: row.guest_count ?? null,
      occasion: row.occasion ?? null,
      notes: row.notes ?? null,
      status: (row.status as EventBookingStatus) || 'new',
      created_at: row.created_at,
    }),
  )

  const byId = new Map<string, EventBooking>()
  for (const row of [...remote, ...local]) byId.set(row.id, row)
  return [...byId.values()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

export async function updateEventBookingStatus(
  id: string,
  status: EventBookingStatus,
): Promise<void> {
  const local = loadLocal()
  const next = local.map((b) => (b.id === id ? { ...b, status } : b))
  saveLocal(next)

  if (!isSupabaseConfigured()) return
  const sb = getSupabase()
  await sb.from('event_bookings').update({ status }).eq('id', id)
}
