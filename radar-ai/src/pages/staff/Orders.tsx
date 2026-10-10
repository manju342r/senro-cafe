import React from 'react';
import { StaffLayout } from '../../layouts/StaffLayout';
import { supabase } from '../../lib/supabase';
import {
  fetchQueue,
  isDelayed,
  nextActions,
  queueStats,
  transitionOrder,
  type QueueOrder,
} from '../../lib/staff';
import { statusLabel } from '../../lib/orders';
import { formatCents, type OrderStatus } from '../../types/database';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; orders: QueueOrder[] };

const ACTION_LABEL: Record<string, string> = {
  accepted: 'Accept',
  preparing: 'Start prep',
  ready: 'Mark ready',
  completed: 'Complete',
  cancelled: 'Cancel',
};

export const StaffOrdersPage: React.FC = () => {
  const [state, setState] = React.useState<State>({ kind: 'loading' });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [acting, setActing] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    fetchQueue()
      .then((orders) => setState({ kind: 'ready', orders }))
      .catch(() =>
        setState({
          kind: 'error',
          message: 'Could not load orders. Check the connection and retry.',
        })
      );
  }, []);

  React.useEffect(() => {
    reload();
    // Live queue: any committed change to orders/events re-reads from the DB.
    const ch = supabase
      .channel('staff-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_status_events' }, reload)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [reload]);

  const act = async (orderId: string, to: OrderStatus) => {
    setActing(true);
    setNotice(null);
    try {
      await transitionOrder(orderId, to);
      reload();
    } catch (e) {
      setNotice(e instanceof Error ? `Update failed: ${e.message}` : 'Update failed.');
    } finally {
      setActing(false);
    }
  };

  const orders = state.kind === 'ready' ? state.orders : [];
  const stats = queueStats(orders);
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  return (
    <StaffLayout active="/staff/orders">
      <div className="mb-4 grid grid-cols-3 gap-3" aria-live="polite">
        <Stat label="Active" value={String(stats.active)} />
        <Stat label="Delayed" value={String(stats.delayed)} alert={stats.delayed > 0} />
        <Stat label="Median wait" value={stats.medianWaitMin === null ? '–' : `${stats.medianWaitMin}m`} />
      </div>

      {notice && (
        <p className="mb-3 rounded-xl border border-line bg-surface p-3 text-sm" role="alert">{notice}</p>
      )}

      {state.kind === 'loading' && (
        <div className="space-y-3" aria-live="polite">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-elevated" />
          ))}
          <p className="text-sm text-muted">Loading live queue…</p>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center" role="alert">
          <p className="mb-4 text-sm text-muted">{state.message}</p>
          <button onClick={reload} className="rounded-full bg-content px-5 py-2.5 text-sm font-medium text-canvas">
            Retry
          </button>
        </div>
      )}

      {state.kind === 'ready' && orders.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="text-sm text-muted">No orders yet. New customer orders appear here live.</p>
        </div>
      )}

      {state.kind === 'ready' && orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((o) => {
            const delayed = isDelayed(o);
            return (
              <li
                key={o.id}
                className={`rounded-2xl border bg-surface p-4 ${delayed ? 'border-content' : 'border-line'}`}
              >
                <button
                  className="flex w-full items-center justify-between gap-3 text-left"
                  onClick={() => setSelectedId((cur) => (cur === o.id ? null : o.id))}
                  aria-expanded={selectedId === o.id}
                >
                  <div>
                    <span className="text-lg font-semibold">{o.order_number}</span>
                    {delayed && (
                      <span className="ml-2 rounded-full bg-content px-2 py-0.5 text-xs font-medium text-canvas">
                        Delayed
                      </span>
                    )}
                    <p className="text-sm text-muted">
                      {o.items.reduce((n, i) => n + i.quantity, 0)} items · {formatCents(o.total_cents)}
                      {o.customer_name ? ` · ${o.customer_name}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-elevated px-3 py-1 text-xs font-medium">
                    {statusLabel(o.status)}
                  </span>
                </button>

                {selectedId === o.id && (
                  <div className="mt-3 border-t border-line pt-3">
                    <ul className="space-y-1 text-sm">
                      {o.items.map((it) => (
                        <li key={it.id} className="flex justify-between gap-3">
                          <span>
                            {it.quantity}× {it.item_name}
                            {(it.customizations as { note?: string }).note && (
                              <span className="text-muted"> — {(it.customizations as { note?: string }).note}</span>
                            )}
                          </span>
                          <span className="text-muted">
                            {new Date(o.created_at).toLocaleTimeString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {nextActions(o.status).map((to) => (
                        <button
                          key={to}
                          disabled={acting}
                          onClick={() => act(o.id, to)}
                          className="rounded-full bg-content px-4 py-2 text-sm font-medium text-canvas disabled:opacity-50"
                        >
                          {ACTION_LABEL[to] ?? to}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {selected && <span className="sr-only">Selected {selected.order_number}</span>}
    </StaffLayout>
  );
};

const Stat: React.FC<{ label: string; value: string; alert?: boolean }> = ({ label, value, alert }) => (
  <div className={`rounded-2xl border p-3 text-center ${alert ? 'border-content bg-surface' : 'border-line bg-surface'}`}>
    <p className="text-2xl font-semibold">{value}</p>
    <p className="text-xs text-muted">{label}</p>
  </div>
);
