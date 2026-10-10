import { staffHeaders, supabase } from './supabase';
import type { MenuCategory, MenuItem, Order, OrderItem } from '../types';

async function json(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `http_${res.status}`);
  return data;
}

// ---- customer ----

export interface MenuData {
  categories: MenuCategory[];
  items: MenuItem[];
}

/**
 * Production path is same-origin /api/menu (Vercel). On plain `vite dev`
 * there is no function host, so fall back to direct RLS-scoped reads —
 * same rows, same policies, no mocks.
 */
export async function getMenu(): Promise<MenuData> {
  try {
    const res = await fetch('/api/menu');
    if (res.ok || res.status < 500) return (await json(res)) as MenuData;
  } catch {
    /* no function host (vite dev) — fall through to direct reads */
  }
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from('menu_categories').select('*').eq('is_active', true).order('display_order'),
    supabase.from('menu_items').select('*').eq('is_available', true).order('display_order'),
  ]);
  if (!categories || !items) throw new Error('menu_unavailable');
  return { categories: categories as MenuCategory[], items: items as MenuItem[] };
}

export interface NewLine {
  menu_item_id: string;
  quantity: number;
  customizations?: Record<string, unknown>;
}

export async function placeOrder(input: {
  items: NewLine[];
  customer_name?: string;
  idempotency_key: string;
}): Promise<Order> {
  try {
    const data = (await json(
      await fetch('/api/orders-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    )) as { order: Order };
    return data.order;
  } catch (e) {
    if (e instanceof TypeError) {
      // No function host (vite dev): same RPC, same server-side validation.
      const { data, error } = await supabase.rpc('create_order', {
        p_items: input.items,
        p_customer_name: input.customer_name ?? null,
        p_idempotency_key: input.idempotency_key,
      });
      if (error) throw new Error(error.message);
      return data as Order;
    }
    throw e;
  }
}

export interface OrderDetail {
  order: Order;
  items: OrderItem[];
}

export async function getOrder(token: string): Promise<OrderDetail> {
  try {
    const res = await fetch(`/api/orders-by-token?token=${encodeURIComponent(token)}`);
    if (res.ok || res.status < 500) return (await json(res)) as OrderDetail;
  } catch {
    /* no function host — fall through */
  }
  const { data, error } = await supabase.rpc('get_order_by_token', { p_token: token });
  if (error) throw new Error('lookup_failed');
  if (!data) throw new Error('order_not_found');
  return data as OrderDetail;
}

export function freshKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Whole minutes until the estimate; 0 when due, null when unknown. */
export function etaMinutes(iso: string | null): number | null {
  if (!iso) return null;
  const m = Math.ceil((new Date(iso).getTime() - Date.now()) / 60000);
  return m > 0 ? m : 0;
}

// ---- staff ----

export async function advanceOrder(order_id: string, to_status: string, notes?: string): Promise<Order> {
  const data = (await json(
    await fetch('/api/orders-transition', {
      method: 'POST',
      headers: await staffHeaders(),
      body: JSON.stringify({ order_id, to_status, notes }),
    })
  )) as { order: Order };
  return data.order;
}

export interface AnalyticsQuery {
  from?: string;
  to?: string;
  category?: string;
}

function qs(q: AnalyticsQuery): string {
  const p = new URLSearchParams();
  if (q.from) p.set('from', q.from);
  if (q.to) p.set('to', q.to);
  if (q.category) p.set('category', q.category);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export async function getContribution(q: AnalyticsQuery) {
  return json(await fetch(`/api/analytics-contribution${qs(q)}`, { headers: await staffHeaders() }));
}

export async function getRush(q: AnalyticsQuery) {
  return json(await fetch(`/api/analytics-rush${qs(q)}`, { headers: await staffHeaders() }));
}

export async function runAnalysis(days = 14) {
  return json(
    await fetch('/api/ai-analyze', {
      method: 'POST',
      headers: await staffHeaders(),
      body: JSON.stringify({ days }),
    })
  );
}

export async function decideRecommendation(id: string, action: 'approved' | 'rejected' | 'implemented') {
  return json(
    await fetch('/api/ai-approve', {
      method: 'POST',
      headers: await staffHeaders(),
      body: JSON.stringify({ id, action }),
    })
  );
}
