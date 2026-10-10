import type { MenuCategory, MenuItem, Order, OrderItem } from '../types/database';

export interface MenuResponse {
  categories: MenuCategory[];
  items: MenuItem[];
}

export interface OrderDetail {
  order: Order;
  items: (OrderItem & Record<string, unknown>)[];
}

async function asJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `http_${res.status}`);
  return data;
}

export async function fetchMenu(): Promise<MenuResponse> {
  const res = await fetch('/api/menu');
  return asJson(res) as Promise<MenuResponse>;
}

export interface CreateOrderInput {
  items: { menu_item_id: string; quantity: number; customizations?: Record<string, unknown> }[];
  customer_name?: string;
  idempotency_key: string;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const res = await fetch('/api/orders-create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await asJson(res)) as { order: Order };
  return data.order;
}

export async function fetchOrderByToken(token: string): Promise<OrderDetail> {
  const res = await fetch(`/api/orders-by-token?token=${encodeURIComponent(token)}`);
  return (await asJson(res)) as OrderDetail;
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

const STATUS_LABEL: Record<string, string> = {
  received: 'Received',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

/** Minutes until estimated_ready_at, rounded up; null when no estimate or past. */
export function waitMinutes(estimatedReadyAt: string | null): number | null {
  if (!estimatedReadyAt) return null;
  const mins = Math.ceil((new Date(estimatedReadyAt).getTime() - Date.now()) / 60000);
  return mins > 0 ? mins : 0;
}
