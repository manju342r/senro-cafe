import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  SEED_CATEGORIES,
  SEED_INGREDIENTS,
  SEED_ITEMS,
  SEED_RECIPES,
} from '@/lib/seed'
import {
  ORDER_TRANSITIONS,
  type AdminProfile,
  type CustomerSummary,
  type Ingredient,
  type MenuCategory,
  type MenuItem,
  type Order,
  type OrderStatus,
  type OrderStatusEvent,
  type OrderItem,
  type OrderWithItems,
  type RecipeIngredient,
  type SalesOverview,
  type StaffRole,
} from '@/types/database'

const SESSION_KEY = 'mana-katha-session-v1'
const LEGACY_DEMO_KEYS = [
  'mana-katha-demo-v6',
  'mana-katha-demo-v5',
  'mana-katha-demo-v4',
  'mana-katha-demo-v3',
  'mana-katha-demo-v2',
]

export interface DemoState {
  categories: MenuCategory[]
  items: MenuItem[]
  ingredients: Ingredient[]
  recipes: RecipeIngredient[]
  orders: OrderWithItems[]
  customers: CustomerSummary[]
  staffRole: StaffRole | null
  adminProfile: AdminProfile | null
  hydrated: boolean
  hydrateError: string | null
}

type SessionState = {
  staffRole: StaffRole | null
  adminProfile: AdminProfile | null
}

let cache: DemoState = emptyCache()
let hydratePromise: Promise<void> | null = null
let realtimeBound = false
let bus: BroadcastChannel | null = null

function emptyCache(): DemoState {
  return {
    categories: [],
    items: [],
    ingredients: [],
    recipes: [],
    orders: [],
    customers: [],
    staffRole: null,
    adminProfile: null,
    hydrated: false,
    hydrateError: null,
  }
}

function getBus(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!bus) bus = new BroadcastChannel('mana-katha-live')
  return bus
}

function notify() {
  window.dispatchEvent(new CustomEvent('mana-katha-updated'))
  try {
    getBus()?.postMessage({ type: 'updated', at: Date.now() })
  } catch {
    /* ignore */
  }
}

function bumpRag() {
  void import('@/lib/rag/retrieve').then((m) => m.invalidateRagIndex())
}

function clearLegacyDemoStorage() {
  for (const key of LEGACY_DEMO_KEYS) {
    localStorage.removeItem(key)
  }
}

function loadSession(): SessionState {
  try {
    clearLegacyDemoStorage()
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return { staffRole: null, adminProfile: null }
    const parsed = JSON.parse(raw) as SessionState
    const role =
      parsed.staffRole === 'staff' || parsed.staffRole === 'admin' ? parsed.staffRole : null
    return {
      staffRole: role,
      adminProfile: role === 'admin' ? parsed.adminProfile ?? null : null,
    }
  } catch {
    return { staffRole: null, adminProfile: null }
  }
}

function saveSession(session: SessionState) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  cache.staffRole = session.staffRole
  cache.adminProfile = session.adminProfile
  notify()
}

function normalizeCustomerKey(name: string): string {
  return name.trim().toLowerCase()
}

function customersFromOrders(orders: OrderWithItems[]): CustomerSummary[] {
  const map = new Map<
    string,
    {
      name: string
      order_count: number
      completed_count: number
      cancelled_count: number
      total_spent_cents: number
      last_order_at: string
    }
  >()

  for (const order of orders) {
    const key = normalizeCustomerKey(order.customer_name)
    const existing = map.get(key)
    const spent = order.status === 'completed' ? order.total_cents : 0
    if (!existing) {
      map.set(key, {
        name: order.customer_name,
        order_count: 1,
        completed_count: order.status === 'completed' ? 1 : 0,
        cancelled_count: order.status === 'cancelled' ? 1 : 0,
        total_spent_cents: spent,
        last_order_at: order.created_at,
      })
    } else {
      existing.order_count += 1
      if (order.status === 'completed') existing.completed_count += 1
      if (order.status === 'cancelled') existing.cancelled_count += 1
      existing.total_spent_cents += spent
      if (order.created_at > existing.last_order_at) {
        existing.last_order_at = order.created_at
        existing.name = order.customer_name
      }
    }
  }

  return [...map.values()]
    .map((c) => ({
      ...c,
      avg_order_cents:
        c.completed_count > 0 ? Math.round(c.total_spent_cents / c.completed_count) : 0,
    }))
    .sort((a, b) => b.total_spent_cents - a.total_spent_cents || b.order_count - a.order_count)
}

function mapCustomerRows(
  rows: {
    name: string
    order_count: number
    completed_count: number
    cancelled_count: number
    total_spent_cents: number
    last_order_at: string | null
  }[],
): CustomerSummary[] {
  return rows
    .map((c) => ({
      name: c.name,
      order_count: c.order_count,
      completed_count: c.completed_count,
      cancelled_count: c.cancelled_count,
      total_spent_cents: c.total_spent_cents,
      last_order_at: c.last_order_at ?? new Date(0).toISOString(),
      avg_order_cents:
        c.completed_count > 0 ? Math.round(c.total_spent_cents / c.completed_count) : 0,
    }))
    .sort((a, b) => b.total_spent_cents - a.total_spent_cents || b.order_count - a.order_count)
}

function assembleOrders(
  orderRows: Omit<OrderWithItems, 'items' | 'events'>[],
  itemRows: OrderItem[],
  eventRows: OrderStatusEvent[],
): OrderWithItems[] {
  const itemsByOrder = new Map<string, OrderItem[]>()
  for (const row of itemRows) {
    const list = itemsByOrder.get(row.order_id) ?? []
    list.push(row)
    itemsByOrder.set(row.order_id, list)
  }
  const eventsByOrder = new Map<string, OrderStatusEvent[]>()
  for (const row of eventRows) {
    const list = eventsByOrder.get(row.order_id) ?? []
    list.push(row)
    eventsByOrder.set(row.order_id, list)
  }
  const assembled = orderRows
    .map((o) => ({
      ...o,
      customer_phone: o.customer_phone ?? null,
      token_number: o.token_number ?? null,
      items: itemsByOrder.get(o.id) ?? [],
      events: (eventsByOrder.get(o.id) ?? []).sort((a, b) =>
        a.created_at < b.created_at ? -1 : 1,
      ),
    }))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  return withDailyTokenFallback(assembled)
}

function istDayKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

function istDayBounds(now = new Date()): { start: string; end: string } {
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  return {
    start: new Date(`${day}T00:00:00+05:30`).toISOString(),
    end: new Date(`${day}T24:00:00+05:30`).toISOString(),
  }
}

/** Fill missing token_number from order sequence within each IST day. */
function withDailyTokenFallback(orders: OrderWithItems[]): OrderWithItems[] {
  const byDay = new Map<string, OrderWithItems[]>()
  for (const o of orders) {
    const key = istDayKey(o.created_at)
    const list = byDay.get(key) ?? []
    list.push(o)
    byDay.set(key, list)
  }

  const assigned = new Map<string, number>()
  for (const list of byDay.values()) {
    const sorted = [...list].sort((a, b) =>
      a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0,
    )
    const anyStored = sorted.some((o) => o.token_number != null && o.token_number > 0)
    if (anyStored) {
      let next = Math.max(0, ...sorted.map((o) => o.token_number ?? 0))
      for (const o of sorted) {
        if (o.token_number != null && o.token_number > 0) assigned.set(o.id, o.token_number)
        else assigned.set(o.id, ++next)
      }
    } else {
      sorted.forEach((o, i) => assigned.set(o.id, i + 1))
    }
  }

  return orders.map((o) => ({
    ...o,
    token_number: assigned.get(o.id) ?? o.token_number,
  }))
}

/** Next pickup token for today (Asia/Kolkata). Prefer DB RPC; fall back to max+1 / count. */
async function allocateDailyTokenNumber(
  sb: ReturnType<typeof getSupabase>,
): Promise<number> {
  const { data: rpcToken, error: rpcError } = await sb.rpc('next_order_token')
  if (!rpcError && typeof rpcToken === 'number' && rpcToken > 0) return rpcToken
  if (!rpcError && typeof rpcToken === 'string' && Number(rpcToken) > 0) {
    return Number(rpcToken)
  }

  const { start, end } = istDayBounds()

  const { data: rows, error: tokenErr } = await sb
    .from('orders')
    .select('token_number')
    .gte('created_at', start)
    .lt('created_at', end)
    .not('token_number', 'is', null)
    .order('token_number', { ascending: false })
    .limit(1)

  if (!tokenErr) {
    const last = rows?.[0]?.token_number
    return (typeof last === 'number' ? last : 0) + 1
  }

  const { count } = await sb
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', start)
    .lt('created_at', end)

  return (count ?? 0) + 1
}

async function upsertCustomerForOrder(order: {
  customer_name: string
  status: OrderStatus
  total_cents: number
  created_at: string
}) {
  const sb = getSupabase()
  const name = order.customer_name.trim() || 'Guest'
  const name_key = normalizeCustomerKey(name)

  const { data: existing } = await sb
    .from('customers')
    .select('*')
    .eq('name_key', name_key)
    .maybeSingle()

  if (!existing) {
    await sb.from('customers').insert({
      name,
      name_key,
      order_count: 1,
      completed_count: order.status === 'completed' ? 1 : 0,
      cancelled_count: order.status === 'cancelled' ? 1 : 0,
      total_spent_cents: order.status === 'completed' ? order.total_cents : 0,
      last_order_at: order.created_at,
    })
    return
  }

  await sb
    .from('customers')
    .update({
      name,
      order_count: (existing.order_count ?? 0) + 1,
      completed_count:
        (existing.completed_count ?? 0) + (order.status === 'completed' ? 1 : 0),
      cancelled_count:
        (existing.cancelled_count ?? 0) + (order.status === 'cancelled' ? 1 : 0),
      total_spent_cents:
        (existing.total_spent_cents ?? 0) +
        (order.status === 'completed' ? order.total_cents : 0),
      last_order_at: order.created_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
}

async function syncCustomerStatusChange(
  customerName: string,
  from: OrderStatus,
  to: OrderStatus,
  totalCents: number,
) {
  const sb = getSupabase()
  const name_key = normalizeCustomerKey(customerName)
  const { data: existing } = await sb
    .from('customers')
    .select('*')
    .eq('name_key', name_key)
    .maybeSingle()
  if (!existing) return

  let completed = existing.completed_count ?? 0
  let cancelled = existing.cancelled_count ?? 0
  let spent = existing.total_spent_cents ?? 0

  if (from === 'completed') {
    completed = Math.max(0, completed - 1)
    spent = Math.max(0, spent - totalCents)
  }
  if (from === 'cancelled') cancelled = Math.max(0, cancelled - 1)
  if (to === 'completed') {
    completed += 1
    spent += totalCents
  }
  if (to === 'cancelled') cancelled += 1

  await sb
    .from('customers')
    .update({
      completed_count: completed,
      cancelled_count: cancelled,
      total_spent_cents: spent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
}

function bindRealtime() {
  if (realtimeBound || !isSupabaseConfigured()) return
  try {
    realtimeBound = true
    const sb = getSupabase()
    sb
      .channel('cafe-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void refreshLiveData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        void refreshLiveData()
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_status_events' },
        () => {
          void refreshLiveData()
        },
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        void refreshLiveData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        void refreshLiveData()
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          realtimeBound = false
        }
      })
  } catch {
    realtimeBound = false
  }
}

function applySeedFallback(reason: string | null = null) {
  const session = loadSession()
  cache = {
    categories: structuredClone(SEED_CATEGORIES),
    items: structuredClone(SEED_ITEMS),
    ingredients: structuredClone(SEED_INGREDIENTS),
    recipes: structuredClone(SEED_RECIPES),
    orders: [],
    customers: [],
    staffRole: session.staffRole,
    adminProfile: session.adminProfile,
    hydrated: true,
    hydrateError: reason,
  }
  bumpRag()
  notify()
}

export async function refreshLiveData(): Promise<void> {
  if (!isSupabaseConfigured()) {
    // Production without Vercel env vars → still show the full seeded menu.
    applySeedFallback(null)
    return
  }

  const sb = getSupabase()
  const session = loadSession()

  const [cats, items, ingredients, recipes, orders, orderItems, events, customers] =
    await Promise.all([
      sb.from('menu_categories').select('*').order('display_order'),
      sb.from('menu_items').select('*').order('display_order'),
      sb.from('ingredients').select('*'),
      sb.from('recipe_ingredients').select('*'),
      sb.from('orders').select('*').order('created_at', { ascending: false }),
      sb.from('order_items').select('*'),
      sb.from('order_status_events').select('*'),
      sb.from('customers').select('*').order('last_order_at', { ascending: false }),
    ])

  const firstError =
    cats.error ||
    items.error ||
    ingredients.error ||
    recipes.error ||
    orders.error ||
    orderItems.error ||
    events.error

  if (firstError) {
    applySeedFallback(firstError.message)
    throw new Error(firstError.message)
  }

  const remoteItems = (items.data ?? []).map((row) => ({
    ...(row as MenuItem),
    description: (row as MenuItem).description ?? '',
  }))
  const remoteCategories = (cats.data ?? []) as MenuCategory[]

  // Empty Supabase project → seed menu so production is never blank.
  if (remoteItems.length === 0) {
    applySeedFallback(null)
    return
  }

  const assembled = assembleOrders(
    (orders.data ?? []) as Omit<OrderWithItems, 'items' | 'events'>[],
    (orderItems.data ?? []) as OrderItem[],
    (events.data ?? []) as OrderStatusEvent[],
  )

  let customerList: CustomerSummary[]
  if (customers.error) {
    customerList = customersFromOrders(assembled)
  } else if ((customers.data ?? []).length > 0) {
    customerList = mapCustomerRows(customers.data as never[])
  } else {
    customerList = customersFromOrders(assembled)
  }

  cache = {
    categories: remoteCategories,
    items: remoteItems,
    ingredients: (ingredients.data ?? []) as Ingredient[],
    recipes: (recipes.data ?? []) as RecipeIngredient[],
    orders: assembled,
    customers: customerList,
    staffRole: session.staffRole,
    adminProfile: session.adminProfile,
    hydrated: true,
    hydrateError: null,
  }

  bindRealtime()
  bumpRag()
  notify()
}

export function ensureHydrated(): Promise<void> {
  if (cache.hydrated && !hydratePromise) return Promise.resolve()
  if (!hydratePromise) {
    hydratePromise = refreshLiveData().finally(() => {
      hydratePromise = null
    })
  }
  return hydratePromise
}

export function getDemoState(): DemoState {
  const session = loadSession()
  return {
    ...cache,
    staffRole: cache.staffRole ?? session.staffRole,
    adminProfile: cache.adminProfile ?? session.adminProfile,
  }
}

export function subscribeDemo(cb: () => void): () => void {
  const handler = () => cb()
  const onBus = () => cb()
  window.addEventListener('mana-katha-updated', handler)
  window.addEventListener('storage', handler)
  const channel = getBus()
  channel?.addEventListener('message', onBus)
  return () => {
    window.removeEventListener('mana-katha-updated', handler)
    window.removeEventListener('storage', handler)
    channel?.removeEventListener('message', onBus)
  }
}

/** Lightweight poll used by the customer tracking page for live status. */
export async function refreshOrderByToken(trackingToken: string): Promise<OrderWithItems | null> {
  if (!trackingToken || !isSupabaseConfigured()) return getOrderByToken(trackingToken)

  const sb = getSupabase()
  const { data: orderRow, error } = await sb
    .from('orders')
    .select('*')
    .eq('tracking_token', trackingToken)
    .maybeSingle()

  if (error || !orderRow) return getOrderByToken(trackingToken)

  const [{ data: itemRows }, { data: eventRows }] = await Promise.all([
    sb.from('order_items').select('*').eq('order_id', orderRow.id),
    sb.from('order_status_events').select('*').eq('order_id', orderRow.id),
  ])

  const assembled: OrderWithItems = {
    ...(orderRow as OrderWithItems),
    customer_phone: (orderRow as Order).customer_phone ?? null,
    token_number: (orderRow as Order).token_number ?? null,
    items: (itemRows ?? []) as OrderItem[],
    events: ((eventRows ?? []) as OrderStatusEvent[]).sort((a, b) =>
      a.created_at < b.created_at ? -1 : 1,
    ),
  }

  const prev = cache.orders.find((o) => o.id === assembled.id)
  const merged = withDailyTokenFallback([
    assembled,
    ...cache.orders.filter((o) => o.id !== assembled.id),
  ])
  const resolved = merged.find((o) => o.id === assembled.id) ?? assembled
  const changed =
    !prev ||
    prev.status !== resolved.status ||
    prev.updated_at !== resolved.updated_at ||
    prev.events.length !== resolved.events.length ||
    prev.token_number !== resolved.token_number

  cache.orders = merged
  if (changed) notify()
  return resolved
}

export function getMenu() {
  const state = getDemoState()
  return {
    categories: state.categories
      .filter((c) => c.is_active)
      .sort((a, b) => a.display_order - b.display_order),
    items: [...state.items].sort((a, b) => a.display_order - b.display_order),
  }
}

/** Normalize to a 10-digit Indian mobile number. */
export function normalizePickupPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10 && /^[6-9]/.test(digits)) return digits
  if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits.slice(2))) {
    return digits.slice(2)
  }
  if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits.slice(1))) {
    return digits.slice(1)
  }
  throw new Error('Enter a valid 10-digit phone number.')
}

export function formatPickupPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits
  if (local.length !== 10) return phone
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`
}

export async function createOrder(input: {
  customer_name: string
  customer_phone: string
  items: { menu_item_id: string; quantity: number }[]
  idempotency_key?: string
}): Promise<OrderWithItems> {
  await ensureHydrated()
  const sb = getSupabase()
  const state = getDemoState()
  const customerName = input.customer_name.trim()
  if (!customerName) throw new Error('Enter your name for pickup.')
  const customerPhone = normalizePickupPhone(input.customer_phone)

  if (input.idempotency_key) {
    const existing = state.orders.find((o) => o.idempotency_key === input.idempotency_key)
    if (existing) return existing
  }

  const lines = input.items.map((line) => {
    const menuItem = state.items.find((i) => i.id === line.menu_item_id)
    if (!menuItem || !menuItem.is_available) throw new Error('Item unavailable')
    return {
      menu_item_id: menuItem.id,
      item_name: menuItem.name,
      item_price_cents: menuItem.price_cents,
      quantity: line.quantity,
      customizations: {},
      prep_time_seconds: menuItem.prep_time_seconds,
    }
  })

  const total = lines.reduce((sum, l) => sum + l.item_price_cents * l.quantity, 0)
  const prepSeconds = lines.reduce((sum, l) => sum + l.prep_time_seconds * l.quantity, 0)
  const now = new Date()
  const tracking_token = crypto.randomUUID()
  const token_number = await allocateDailyTokenNumber(sb)
  const orderPayload = {
    customer_name: customerName,
    customer_phone: customerPhone,
    status: 'received' as const,
    total_cents: total,
    tracking_token,
    token_number,
    estimated_ready_at: new Date(now.getTime() + prepSeconds * 1000).toISOString(),
    idempotency_key: input.idempotency_key ?? null,
  }

  // Older Supabase projects may lack phone / token columns — strip and retry.
  let insertPayload: Record<string, unknown> = { ...orderPayload }
  let { data: order, error: orderError } = await sb
    .from('orders')
    .insert(insertPayload)
    .select('*')
    .single()

  for (const col of ['token_number', 'customer_phone'] as const) {
    if (!orderError?.message?.includes(col)) continue
    const { [col]: _drop, ...rest } = insertPayload
    insertPayload = rest
    ;({ data: order, error: orderError } = await sb
      .from('orders')
      .insert(insertPayload)
      .select('*')
      .single())
  }

  if (order) {
    order = {
      ...order,
      customer_phone: (order as Order).customer_phone ?? customerPhone,
      token_number: (order as Order).token_number ?? token_number,
    }
  }

  if (orderError || !order) {
    const msg = orderError?.message || 'Could not create order'
    throw new Error(
      orderError?.message?.includes('row-level security')
        ? 'Supabase blocked the order write. Run supabase/enable_cafe_access.sql in the SQL Editor once.'
        : msg,
    )
  }

  const { data: insertedItems, error: itemsError } = await sb
    .from('order_items')
    .insert(lines.map((l) => ({ ...l, order_id: order.id })))
    .select('*')

  if (itemsError) {
    await sb.from('orders').delete().eq('id', order.id)
    throw new Error(itemsError.message)
  }

  const { data: eventRow } = await sb
    .from('order_status_events')
    .insert({
      order_id: order.id,
      from_status: null,
      to_status: 'received',
      notes: 'Order placed',
    })
    .select('*')
    .maybeSingle()

  try {
    await upsertCustomerForOrder({
      customer_name: order.customer_name,
      status: order.status,
      total_cents: order.total_cents,
      created_at: order.created_at,
    })
  } catch {
    // customers table may not exist until SQL is applied; orders still land
  }

  const assembled: OrderWithItems = {
    ...(order as OrderWithItems),
    items: (insertedItems ?? []) as OrderItem[],
    events: eventRow ? ([eventRow] as OrderStatusEvent[]) : [],
  }

  cache.orders = [assembled, ...cache.orders.filter((o) => o.id !== assembled.id)]
  cache.customers = customersFromOrders(cache.orders)
  notify()
  void refreshLiveData()
  void import('@/lib/orderSms').then((m) => m.notifyOrderSms(assembled))
  return assembled
}

export function getOrderByToken(trackingToken: string): OrderWithItems | null {
  return getDemoState().orders.find((o) => o.tracking_token === trackingToken) ?? null
}

export function getOrderById(id: string): OrderWithItems | null {
  return getDemoState().orders.find((o) => o.id === id) ?? null
}

export function listOrders(): OrderWithItems[] {
  return getDemoState().orders
}

export async function transitionOrder(
  orderId: string,
  toStatus: OrderStatus,
  notes?: string,
): Promise<OrderWithItems> {
  await ensureHydrated()
  const sb = getSupabase()
  const order = getDemoState().orders.find((o) => o.id === orderId)
  if (!order) throw new Error('Order not found')

  const allowed = ORDER_TRANSITIONS[order.status]
  if (!allowed.includes(toStatus)) {
    throw new Error(`Cannot move from ${order.status} to ${toStatus}`)
  }

  const now = new Date().toISOString()
  const from = order.status
  const patch: Record<string, unknown> = {
    status: toStatus,
    updated_at: now,
  }
  if (toStatus === 'accepted') patch.accepted_at = now
  if (toStatus === 'preparing') patch.preparing_at = now
  if (toStatus === 'ready') patch.ready_at = now
  if (toStatus === 'completed') patch.completed_at = now
  if (toStatus === 'cancelled') {
    patch.cancelled_at = now
    patch.cancellation_reason = notes ?? 'Cancelled by staff'
  }

  const { data: updated, error } = await sb
    .from('orders')
    .update(patch)
    .eq('id', orderId)
    .select('*')
    .single()

  if (error || !updated) throw new Error(error?.message || 'Update failed')

  await sb.from('order_status_events').insert({
    order_id: orderId,
    from_status: from,
    to_status: toStatus,
    notes: notes ?? null,
  })

  try {
    await syncCustomerStatusChange(order.customer_name, from, toStatus, order.total_cents)
  } catch {
    /* optional until customers table exists */
  }

  await refreshLiveData()
  const next = getOrderById(orderId)
  if (!next) throw new Error('Order missing after update')
  return next
}

export async function setItemAvailability(itemId: string, isAvailable: boolean): Promise<MenuItem> {
  await ensureHydrated()
  const sb = getSupabase()
  const { data, error } = await sb
    .from('menu_items')
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Update failed')
  await refreshLiveData()
  return { ...(data as MenuItem), description: (data as MenuItem).description ?? '' }
}

export async function updateItemPrice(itemId: string, priceCents: number): Promise<MenuItem> {
  if (priceCents <= 0) throw new Error('Price must be positive')
  await ensureHydrated()
  const sb = getSupabase()
  const { data, error } = await sb
    .from('menu_items')
    .update({ price_cents: priceCents, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Update failed')
  await refreshLiveData()
  return { ...(data as MenuItem), description: (data as MenuItem).description ?? '' }
}

export type MenuItemInput = {
  name: string
  category_id: string
  description?: string
  price_cents: number
  prep_time_seconds?: number
  is_available?: boolean
}

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
  await ensureHydrated()
  const state = getDemoState()
  if (!state.categories.some((c) => c.id === input.category_id)) {
    throw new Error('Invalid category')
  }
  const name = input.name.trim()
  if (!name) throw new Error('Name is required')
  if (input.price_cents <= 0) throw new Error('Price must be positive')

  const inCategory = state.items.filter((i) => i.category_id === input.category_id)
  const sb = getSupabase()
  const { data, error } = await sb
    .from('menu_items')
    .insert({
      category_id: input.category_id,
      name,
      description: (input.description ?? '').trim() || null,
      price_cents: Math.round(input.price_cents),
      prep_time_seconds: Math.max(60, input.prep_time_seconds ?? 900),
      is_available: input.is_available ?? true,
      display_order: inCategory.length + 1,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(
      error?.message?.includes('row-level security')
        ? 'Supabase blocked menu write. Run supabase/enable_cafe_access.sql once.'
        : error?.message || 'Could not create item',
    )
  }
  await refreshLiveData()
  return { ...(data as MenuItem), description: (data as MenuItem).description ?? '' }
}

export async function updateMenuItem(
  itemId: string,
  patch: Partial<MenuItemInput>,
): Promise<MenuItem> {
  await ensureHydrated()
  const state = getDemoState()
  const item = state.items.find((i) => i.id === itemId)
  if (!item) throw new Error('Item not found')

  if (patch.category_id && !state.categories.some((c) => c.id === patch.category_id)) {
    throw new Error('Invalid category')
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.name !== undefined) {
    const name = patch.name.trim()
    if (!name) throw new Error('Name is required')
    update.name = name
  }
  if (patch.description !== undefined) update.description = patch.description.trim() || null
  if (patch.category_id) update.category_id = patch.category_id
  if (patch.price_cents !== undefined) {
    if (patch.price_cents <= 0) throw new Error('Price must be positive')
    update.price_cents = Math.round(patch.price_cents)
  }
  if (patch.prep_time_seconds !== undefined) {
    update.prep_time_seconds = Math.max(60, Math.round(patch.prep_time_seconds))
  }
  if (patch.is_available !== undefined) update.is_available = patch.is_available

  const sb = getSupabase()
  const { data, error } = await sb
    .from('menu_items')
    .update(update)
    .eq('id', itemId)
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Update failed')
  await refreshLiveData()
  return { ...(data as MenuItem), description: (data as MenuItem).description ?? '' }
}

export async function deleteMenuItem(itemId: string): Promise<void> {
  await ensureHydrated()
  const sb = getSupabase()
  const { error } = await sb.from('menu_items').delete().eq('id', itemId)
  if (error) throw new Error(error.message)
  await refreshLiveData()
}

const CREDENTIALS: Record<string, StaffRole> = {
  staff: 'staff',
  demo: 'staff',
  admin: 'admin',
  superadmin: 'admin',
}

export function staffLogin(password: string): StaffRole | null {
  const role = CREDENTIALS[password.trim().toLowerCase()]
  if (!role) return null
  saveSession({
    staffRole: role,
    adminProfile:
      role === 'admin'
        ? { email: 'password-admin@local', name: 'Super Admin', picture: null }
        : null,
  })
  return role
}

export function adminLoginWithGoogle(profile: AdminProfile): void {
  saveSession({
    staffRole: 'admin',
    adminProfile: {
      email: profile.email.toLowerCase(),
      name: profile.name,
      picture: profile.picture,
    },
  })
}

export function staffLogout() {
  saveSession({ staffRole: null, adminProfile: null })
}

export function isStaffLoggedIn(): boolean {
  return getStaffRole() !== null
}

export function getStaffRole(): StaffRole | null {
  return getDemoState().staffRole ?? loadSession().staffRole
}

export function getAdminProfile(): AdminProfile | null {
  return getDemoState().adminProfile ?? loadSession().adminProfile
}

export function isAdmin(): boolean {
  return getStaffRole() === 'admin'
}

export function requireAdmin(): boolean {
  return isAdmin()
}

export function listCustomers(): CustomerSummary[] {
  return getDemoState().customers
}

export function listOrdersByCustomer(customerName: string): OrderWithItems[] {
  const key = normalizeCustomerKey(customerName)
  return getDemoState()
    .orders.filter((o) => normalizeCustomerKey(o.customer_name) === key)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
}

export function getSalesOverview(): SalesOverview {
  const orders = getDemoState().orders
  const by_status: Record<OrderStatus, number> = {
    received: 0,
    accepted: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
  }

  let revenue_cents = 0
  let gross_cents = 0
  let cancelled_cents = 0
  let completed_count = 0
  let cancelled_count = 0
  let active_count = 0

  const itemMap = new Map<string, { name: string; quantity: number; revenue_cents: number }>()
  const dayMap = new Map<string, { date: string; revenue_cents: number; orders: number }>()

  for (const order of orders) {
    by_status[order.status] += 1
    gross_cents += order.total_cents

    if (order.status === 'completed') {
      completed_count += 1
      revenue_cents += order.total_cents
      for (const line of order.items) {
        const prev = itemMap.get(line.menu_item_id)
        const lineRev = line.item_price_cents * line.quantity
        if (prev) {
          prev.quantity += line.quantity
          prev.revenue_cents += lineRev
        } else {
          itemMap.set(line.menu_item_id, {
            name: line.item_name,
            quantity: line.quantity,
            revenue_cents: lineRev,
          })
        }
      }
      const day = order.completed_at?.slice(0, 10) ?? order.created_at.slice(0, 10)
      const dayRow = dayMap.get(day)
      if (dayRow) {
        dayRow.revenue_cents += order.total_cents
        dayRow.orders += 1
      } else {
        dayMap.set(day, { date: day, revenue_cents: order.total_cents, orders: 1 })
      }
    } else if (order.status === 'cancelled') {
      cancelled_count += 1
      cancelled_cents += order.total_cents
    } else {
      active_count += 1
    }
  }

  const order_count = orders.length
  const aov_cents = completed_count > 0 ? Math.round(revenue_cents / completed_count) : 0
  const decided = completed_count + cancelled_count
  const completion_rate = decided > 0 ? completed_count / decided : 0

  return {
    revenue_cents,
    gross_cents,
    cancelled_cents,
    order_count,
    completed_count,
    cancelled_count,
    active_count,
    aov_cents,
    completion_rate,
    by_status,
    top_items: [...itemMap.values()]
      .sort((a, b) => b.revenue_cents - a.revenue_cents)
      .slice(0, 8),
    recent_orders: [...orders]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 12),
    daily: [...dayMap.values()].sort((a, b) => (a.date < b.date ? -1 : 1)),
  }
}

export function contributionRows() {
  const state = getDemoState()
  return state.items.map((item) => {
    const recipe = state.recipes.filter((r) => r.menu_item_id === item.id)
    let cost: number | null = 0
    if (recipe.length === 0) {
      cost = null
    } else {
      for (const r of recipe) {
        const ing = state.ingredients.find((i) => i.id === r.ingredient_id)
        if (!ing) {
          cost = null
          break
        }
        cost! += Math.round(ing.cost_per_unit_cents * r.quantity)
      }
    }

    const sold = state.orders
      .filter((o) => o.status !== 'cancelled')
      .flatMap((o) => o.items)
      .filter((oi) => oi.menu_item_id === item.id)
      .reduce((n, oi) => n + oi.quantity, 0)

    const contribution = cost === null ? null : item.price_cents - cost
    return {
      item,
      cost_cents: cost,
      contribution_cents: contribution,
      units_sold: sold,
      total_contribution_cents: contribution === null ? null : contribution * sold,
    }
  })
}
