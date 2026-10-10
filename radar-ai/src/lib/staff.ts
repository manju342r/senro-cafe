import { supabase, getSessionProfile, isStaffRole } from './supabase';
import type { MenuCategory, MenuItem, Order, OrderItem, OrderStatus } from '../types/database';
import { LEGAL_TRANSITIONS } from '../types/database';

export interface QueueOrder extends Order {
  items: OrderItem[];
}

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

async function asJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `http_${res.status}`);
  return data;
}

/** Active + recently finished orders with lines (staff RLS applies). */
export async function fetchQueue(limit = 60): Promise<QueueOrder[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const ids = (orders ?? []).map((o) => (o as Order).id);
  if (ids.length === 0) return [];
  const { data: items, error: itemErr } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', ids);
  if (itemErr) throw itemErr;
  const byOrder = new Map<string, OrderItem[]>();
  for (const it of (items ?? []) as OrderItem[]) {
    const list = byOrder.get(it.order_id) ?? [];
    list.push(it);
    byOrder.set(it.order_id, list);
  }
  return ((orders ?? []) as Order[]).map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] }));
}

export async function transitionOrder(
  order_id: string,
  to_status: OrderStatus,
  notes?: string
): Promise<Order> {
  const res = await fetch('/api/orders-transition', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ order_id, to_status, notes }),
  });
  const data = (await asJson(res)) as { order: Order };
  return data.order;
}

export function nextActions(status: OrderStatus): OrderStatus[] {
  return LEGAL_TRANSITIONS[status] ?? [];
}

export interface QueueStats {
  active: number;
  delayed: number;
  medianWaitMin: number | null;
}

const ACTIVE: OrderStatus[] = ['received', 'accepted', 'preparing'];

/** Overdue = still in kitchen flow AND past its estimated ready time. */
export function isDelayed(o: Order): boolean {
  if (!ACTIVE.includes(o.status) || !o.estimated_ready_at) return false;
  return Date.now() > new Date(o.estimated_ready_at).getTime();
}

export function queueStats(orders: Order[]): QueueStats {
  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const delayed = active.filter(isDelayed).length;
  const waits = active
    .map((o) => (Date.now() - new Date(o.created_at).getTime()) / 60000)
    .sort((a, b) => a - b);
  const medianWaitMin =
    waits.length === 0 ? null : Math.round(waits[Math.floor(waits.length / 2)] ?? 0);
  return { active: active.length, delayed, medianWaitMin };
}

// ---- menu admin (staff RLS applies) ----

export async function fetchMenuAdmin(): Promise<{ categories: MenuCategory[]; items: MenuItem[] }> {
  const [{ data: categories, error: cErr }, { data: items, error: iErr }] = await Promise.all([
    supabase.from('menu_categories').select('*').order('display_order'),
    supabase.from('menu_items').select('*').order('display_order'),
  ]);
  if (cErr) throw cErr;
  if (iErr) throw iErr;
  return { categories: (categories ?? []) as MenuCategory[], items: (items ?? []) as MenuItem[] };
}

export async function setAvailability(id: string, is_available: boolean): Promise<void> {
  const { error } = await supabase.from('menu_items').update({ is_available }).eq('id', id);
  if (error) throw error;
}

export async function saveMenuItem(
  item: Partial<MenuItem> & { id?: string; name: string; price_cents: number }
): Promise<void> {
  const payload = {
    category_id: item.category_id ?? null,
    name: item.name,
    description: item.description ?? null,
    price_cents: item.price_cents,
    prep_time_seconds: item.prep_time_seconds ?? 180,
    is_available: item.is_available ?? true,
  };
  const { error } = item.id
    ? await supabase.from('menu_items').update(payload).eq('id', item.id)
    : await supabase.from('menu_items').insert(payload);
  if (error) throw error;
}

export async function addCategory(name: string): Promise<void> {
  const { error } = await supabase.from('menu_categories').insert({ name });
  if (error) throw error;
}

export { getSessionProfile, isStaffRole };
