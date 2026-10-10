import React from 'react';
import { useParams } from 'react-router-dom';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { etaMinutes, getOrder, type OrderDetail } from '../../lib/api';
import { STATUS_LABEL, inr } from '../../types';

const STEPS = ['received', 'accepted', 'preparing', 'ready', 'completed'] as const;

export const TrackingPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = React.useState<OrderDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) {
      setError('This order link is incomplete.');
      return;
    }
    let live = true;
    // Poll the token endpoint: every paint reflects committed DB rows.
    const load = () =>
      getOrder(token)
        .then((d) => live && (setData(d), setError(null)))
        .catch(() => live && setError('Order not found. Check the link and retry.'));
    load();
    const t = window.setInterval(load, 4000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      live = false;
      window.clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [token]);

  // Minute ticker so the ETA countdown never goes stale.
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 60000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <CustomerLayout>
      {!data && !error && (
        <div className="mt-6 space-y-3" aria-live="polite">
          <div className="h-40 animate-pulse rounded-3xl bg-parchment" />
          <p className="text-center text-sm text-cocoa">Finding your order…</p>
        </div>
      )}
      {error && !data && (
        <p className="mt-6 rounded-2xl bg-card p-6 text-center text-sm text-cocoa shadow-sm" role="alert">{error}</p>
      )}
      {data && (
        <>
          <div className="mt-2 rounded-3xl bg-espresso p-6 text-center text-cream shadow-sm">
            <p className="text-xs uppercase tracking-widest text-cream/60">Order</p>
            <p className="font-display text-4xl font-semibold">{data.order.order_number}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-cream/15 px-4 py-1.5 text-sm font-semibold" aria-live="polite">
              {data.order.status === 'completed' ? <CheckCircle2 size={15} /> : <BellRing size={15} />}
              {STATUS_LABEL[data.order.status]}
            </p>
            {data.order.status !== 'cancelled' && data.order.status !== 'completed' && (
              <p className="mt-2 text-sm text-cream/70">
                {(() => {
                  const m = etaMinutes(data.order.estimated_ready_at);
                  return m === null ? '' : m === 0 ? 'Almost ready — watch the counter.' : `Ready in about ${m} min`;
                })()}
              </p>
            )}
            {data.order.status === 'cancelled' && (
              <p className="mt-2 text-sm text-cream/70">This order was cancelled. Ask the counter for help.</p>
            )}
            <p className="mt-3 text-xs text-cream/50">Show this number to pay & pick up.</p>
          </div>

          {data.order.status !== 'cancelled' && data.order.status !== 'completed' && (
            <ol className="mt-3 flex items-center justify-between rounded-2xl bg-card px-5 py-4 shadow-sm" aria-label="Progress">
              {STEPS.map((s) => {
                const done = STEPS.indexOf(s) <= STEPS.indexOf(data.order.status as (typeof STEPS)[number]);
                return (
                  <li key={s} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${done ? 'bg-ember' : 'bg-latte'}`} />
                    <span className={`text-[10px] ${done ? 'font-semibold' : 'text-faded'}`}>
                      {STATUS_LABEL[s].split(' ')[0]}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-3 rounded-2xl bg-card p-4 shadow-sm">
            {data.items.map((it) => (
              <div key={String(it.id)} className="flex justify-between py-1 text-sm">
                <span>{Number(it.quantity)}× {String(it.item_name)}</span>
                <span className="font-semibold">{inr(Number(it.item_price_cents) * Number(it.quantity))}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-latte pt-2 font-bold">
              <span>Due at counter</span>
              <span>{inr(data.order.total_cents)}</span>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-faded">Updates itself — no need to refresh.</p>
        </>
      )}
    </CustomerLayout>
  );
};
