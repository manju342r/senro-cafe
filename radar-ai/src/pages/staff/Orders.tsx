import React from 'react';
import { Clock, Flame, Layers } from 'lucide-react';
import { StaffLayout } from '../../layouts/StaffLayout';
import { supabase } from '../../lib/supabase';
import { advanceOrder } from '../../lib/api';
import { NEXT, STATUS_LABEL, inr, type Order, type OrderItem, type OrderStatus } from '../../types';

interface FullOrder extends Order {
  items: OrderItem[];
}

const ACTIVE: OrderStatus[] = ['received', 'accepted', 'preparing'];
const BTN: Partial<Record<OrderStatus, string>> = {
  accepted: 'Accept',
  preparing: 'Start prep',
  ready: 'Mark ready',
  completed: 'Complete',
  cancelled: 'Cancel order',
};

function late(o: Order): boolean {
  return ACTIVE.includes(o.status) && !!o.estimated_ready_at && Date.now() > new Date(o.estimated_ready_at).getTime();
}

export const StaffOrdersPage: React.FC = () => {
  const [orders, setOrders] = React.useState<FullOrder[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [acting, setActing] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    (async () => {
      const { data: rows, error: e1 } = await supabase
        .from('orders').select('*').order('created_at', { ascending: false }).limit(60);
      if (e1) throw e1;
      const ids = ((rows ?? []) as Order[]).map((o) => o.id);
      let items: OrderItem[] = [];
      if (ids.length > 0) {
        const { data, error: e2 } = await supabase.from('order_items').select('*').in('order_id', ids);
        if (e2) throw e2;
        items = (data ?? []) as OrderItem[];
      }
      const by = new Map<string, OrderItem[]>();
      for (const it of items) by.set(it.order_id, [...(by.get(it.order_id) ?? []), it]);
      setOrders(((rows ?? []) as Order[]).map((o) => ({ ...o, items: by.get(o.id) ?? [] })));
      setError(null);
    })().catch(() => setError('Queue failed to load. Check the connection and retry.'));
  }, []);

  React.useEffect(() => {
    reload();
    // Every committed change re-reads the queue: what staff sees is always DB truth.
    const ch = supabase
      .channel('staff-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_status_events' }, reload)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [reload]);

  const act = async (id: string, to: OrderStatus) => {
    setActing(true);
    setNotice(null);
    try {
      await advanceOrder(id, to);
      reload();
    } catch (e) {
      setNotice(e instanceof Error ? `Update failed (${e.message}). The queue reloaded — check before retrying.` : 'Update failed.');
    } finally {
      setActing(false);
    }
  };

  const active = (orders ?? []).filter((o) => ACTIVE.includes(o.status));
  const delayed = active.filter(late).length;
  const waits = active.map((o) => (Date.now() - new Date(o.created_at).getTime()) / 60000).sort((a, b) => a - b);
  const median = waits.length ? Math.round(waits[Math.floor(waits.length / 2)]) : null;

  return (
    <StaffLayout active="/staff/orders">
      <div className="grid grid-cols-3 gap-3" aria-live="polite">
        {[
          { icon: <Layers size={16} />, v: String(active.length), l: 'Active' },
          { icon: <Flame size={16} />, v: String(delayed), l: 'Delayed', hot: delayed > 0 },
          { icon: <Clock size={16} />, v: median === null ? '–' : `${median}m`, l: 'Median wait' },
        ].map((s) => (
          <div key={s.l} className={`rounded-2xl p-3 text-center shadow-sm ${s.hot ? 'bg-ember text-cream' : 'bg-card'}`}>
            <p className="flex items-center justify-center gap-1 text-2xl font-bold">{s.icon}{s.v}</p>
            <p className={`text-xs ${s.hot ? 'text-cream/80' : 'text-cocoa'}`}>{s.l}</p>
          </div>
        ))}
      </div>

      {notice && <p className="mt-3 rounded-xl bg-card p-3 text-sm text-ember-deep shadow-sm" role="alert">{notice}</p>}

      {!orders && !error && <p className="mt-6 text-center text-sm text-cocoa" aria-live="polite">Loading live queue…</p>}
      {error && (
        <div className="mt-6 rounded-2xl bg-card p-6 text-center shadow-sm" role="alert">
          <p className="text-sm text-cocoa">{error}</p>
          <button onClick={reload} className="mt-3 rounded-full bg-espresso px-5 py-2 text-sm font-semibold text-cream">Retry</button>
        </div>
      )}
      {orders && orders.length === 0 && (
        <p className="mt-6 rounded-2xl bg-card p-6 text-center text-sm text-cocoa">Quiet right now — new orders pop in here live.</p>
      )}

      <ul className="mt-4 space-y-3">
        {(orders ?? []).map((o) => {
          const isLate = late(o);
          const open = openId === o.id;
          return (
            <li key={o.id} className={`rounded-2xl bg-card p-4 shadow-sm ${isLate ? 'ring-2 ring-ember' : ''}`}>
              <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setOpenId(open ? null : o.id)} aria-expanded={open}>
                <div>
                  <span className="font-display text-xl font-semibold">{o.order_number}</span>
                  {isLate && <span className="ml-2 rounded-full bg-ember px-2 py-0.5 text-xs font-bold text-cream">LATE</span>}
                  <p className="text-sm text-cocoa">
                    {o.items.reduce((n, i) => n + i.quantity, 0)} items · {inr(o.total_cents)}
                    {o.customer_name ? ` · ${o.customer_name}` : ''}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-parchment px-3 py-1 text-xs font-bold">{STATUS_LABEL[o.status]}</span>
              </button>
              {open && (
                <div className="mt-3 border-t border-latte pt-3">
                  <ul className="space-y-1 text-sm">
                    {o.items.map((it) => (
                      <li key={it.id} className="flex justify-between gap-3">
                        <span>{it.quantity}× {it.item_name}{it.customizations.note ? <span className="text-cocoa"> — {it.customizations.note}</span> : null}</span>
                        <span className="shrink-0 text-cocoa">{new Date(o.created_at).toLocaleTimeString()}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {NEXT[o.status].map((to) => (
                      <button key={to} disabled={acting} onClick={() => act(o.id, to)}
                        className="rounded-full bg-espresso px-4 py-2 text-sm font-semibold text-cream disabled:opacity-50">
                        {BTN[to] ?? to}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </StaffLayout>
  );
};
