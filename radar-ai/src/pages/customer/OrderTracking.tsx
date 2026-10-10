import React from 'react';
import { useParams } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { fetchOrderByToken, statusLabel, waitMinutes, type OrderDetail } from '../../lib/orders';
import { formatCents } from '../../types/database';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: OrderDetail };

// Poll the token RPC every 4s: every render reflects committed DB state
// (no fake push updates). Staff screens use Supabase Realtime; a signed
// tracking channel is the follow-up to replace polling here.
const POLL_MS = 4000;

const STEPS = ['received', 'accepted', 'preparing', 'ready', 'completed'] as const;

export const OrderTrackingPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = React.useState<State>({ kind: 'loading' });

  React.useEffect(() => {
    if (!token) {
      setState({ kind: 'error', message: 'Missing order link. Please place an order first.' });
      return;
    }
    let live = true;
    const load = () =>
      fetchOrderByToken(token)
        .then((data) => {
          if (live) setState({ kind: 'ready', data });
        })
        .catch(() => {
          if (live)
            setState({
              kind: 'error',
              message: 'Could not find this order. The link may be wrong or expired.',
            });
        });
    load();
    const timer = window.setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      live = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [token]);

  return (
    <CustomerLayout title="Order status">
      {state.kind === 'loading' && (
        <div className="space-y-3" aria-live="polite">
          <div className="h-32 animate-pulse rounded-2xl bg-surface-elevated" />
          <p className="text-sm text-muted">Finding your order…</p>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center" role="alert">
          <p className="text-sm text-muted">{state.message}</p>
        </div>
      )}

      {state.kind === 'ready' && (
        <OrderCard data={state.data} />
      )}
    </CustomerLayout>
  );
};

const OrderCard: React.FC<{ data: OrderDetail }> = ({ data }) => {
  const { order, items } = data;
  const [, tick] = React.useState(0);
  // Re-render each minute so the wait countdown stays honest.
  React.useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 60000);
    return () => window.clearInterval(t);
  }, []);

  const mins = waitMinutes(order.estimated_ready_at);
  const cancelled = order.status === 'cancelled';
  const done = order.status === 'completed';
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-5 text-center">
        <p className="text-sm text-muted">Order number</p>
        <p className="text-3xl font-semibold tracking-tight">{order.order_number}</p>
        <p className="mt-2 inline-block rounded-full bg-surface-elevated px-4 py-1.5 text-sm font-medium" aria-live="polite">
          {statusLabel(order.status)}
        </p>
        {!cancelled && !done && mins !== null && (
          <p className="mt-2 text-sm text-muted">
            {mins === 0 ? 'Almost ready — keep an eye on the counter.' : `Estimated wait ≈ ${mins} min`}
          </p>
        )}
        {cancelled && order.cancellation_reason && (
          <p className="mt-2 text-sm text-muted">Reason: {order.cancellation_reason}</p>
        )}
        <p className="mt-2 text-xs text-muted">Show this number at the counter to pay & pick up.</p>
      </div>

      {!cancelled && !done && (
        <ol className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`h-2.5 w-2.5 rounded-full ${i <= stepIndex ? 'bg-content' : 'bg-accent-subtle'}`}
                aria-hidden
              />
              <span className={`text-[10px] ${i <= stepIndex ? 'font-medium' : 'text-muted'}`}>
                {statusLabel(s).split(' ')[0]}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="rounded-2xl border border-line bg-surface p-4">
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={String(it.id)} className="flex justify-between gap-3 text-sm">
              <span>
                {String(it.quantity)}× {String(it.item_name)}
              </span>
              <span className="font-medium">
                {formatCents(Number(it.item_price_cents) * Number(it.quantity))}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold">
          <span>Total due at counter</span>
          <span>{formatCents(order.total_cents)}</span>
        </div>
      </div>

      <p className="text-center text-xs text-muted">Status refreshes automatically.</p>
    </div>
  );
};
