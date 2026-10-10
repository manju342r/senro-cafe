import { supabase } from './supabase';

export interface ContributionRow {
  menu_item_id: string;
  name: string;
  price_cents: number;
  unit_cost_cents: number | null;
  cost_known: boolean;
  margin_cents: number | null;
  units_sold: number;
  revenue_cents: number;
  total_contribution_cents: number | null;
}

export interface RushHour {
  hour: number;
  orders: number;
  median_prep_s: number | null;
  delayed: number;
}

async function staffHeaders(): Promise<Record<string, string>> {
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

export interface AnalyticsFilters {
  from?: string;
  to?: string;
  category?: string;
}

function qs(f: AnalyticsFilters): string {
  const p = new URLSearchParams();
  if (f.from) p.set('from', f.from);
  if (f.to) p.set('to', f.to);
  if (f.category) p.set('category', f.category);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export async function fetchContribution(f: AnalyticsFilters): Promise<{
  rows: ContributionRow[];
  totals: { revenue_cents: number; units: number; contribution_cents: number; unknown_cost_items: number };
  orders_count: number;
}> {
  const res = await fetch(`/api/analytics-contribution${qs(f)}`, { headers: await staffHeaders() });
  return asJson(res);
}

export async function fetchRush(f: AnalyticsFilters): Promise<{
  hourly: RushHour[];
  peak_hours: RushHour[];
  delayed_items: { menu_item_id: string; name: string; delayed_qty: number }[];
  orders_count: number;
  note: string;
}> {
  const res = await fetch(`/api/analytics-rush${qs(f)}`, { headers: await staffHeaders() });
  return asJson(res);
}

/** Default window: last 7 days, ISO strings for the API. */
export function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function fmtMin(sec: number | null): string {
  if (sec === null) return '–';
  if (sec < 60) return `${sec}s`;
  return `${Math.round(sec / 60)}m`;
}
