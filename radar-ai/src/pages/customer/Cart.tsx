import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { useCart } from '../../contexts/CartContext';
import { createOrder, newIdempotencyKey } from '../../lib/orders';
import { formatCents } from '../../types/database';

type SubmitState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'error'; message: string };

export const CartPage: React.FC = () => {
  const { lines, totalCents, setQty, setNote, removeLine, clear } = useCart();
  const [name, setName] = React.useState('');
  const [submit, setSubmit] = React.useState<SubmitState>({ kind: 'idle' });
  const navigate = useNavigate();
  // One idempotency key per checkout attempt: safe retries, no duplicate orders.
  const attemptKey = React.useRef(newIdempotencyKey());

  const unavailable = lines.filter((l) => !l.is_available);

  const placeOrder = async () => {
    if (lines.length === 0 || submit.kind === 'sending') return;
    if (unavailable.length > 0) {
      setSubmit({
        kind: 'error',
        message: 'Some items are no longer available. Remove them to continue.',
      });
      return;
    }
    setSubmit({ kind: 'sending' });
    try {
      const order = await createOrder({
        items: lines.map((l) => ({
          menu_item_id: l.menu_item_id,
          quantity: l.quantity,
          customizations: l.note.trim() ? { note: l.note.trim() } : {},
        })),
        customer_name: name.trim() || undefined,
        idempotency_key: attemptKey.current,
      });
      clear();
      navigate(`/orders/${order.tracking_token}`, { replace: true });
    } catch (e) {
      // New key only on employment of a fresh attempt after a *successful* post
      // is wrong; on failure the SAME key is safe to retry (server replays).
      const message =
        e instanceof Error && /unavailable|not_found/.test(e.message)
          ? 'An item just became unavailable. Please review your cart and try again.'
          : 'Could not place the order. Tap Place order again to retry safely.';
      setSubmit({ kind: 'error', message });
    }
  };

  return (
    <CustomerLayout title="Your order">
      {lines.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="mb-4 text-sm text-muted">Your cart is empty.</p>
          <button
            onClick={() => navigate('/menu')}
            className="rounded-full bg-content px-5 py-2.5 text-sm font-medium text-canvas"
          >
            Browse menu
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {lines.map((line) => (
              <li
                key={line.menu_item_id}
                className={`rounded-2xl border p-4 ${
                  line.is_available ? 'border-line bg-surface' : 'border-line bg-surface-elevated opacity-70'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{line.name}</p>
                    <p className="text-sm text-muted">{formatCents(line.unit_price_cents)} each</p>
                    {!line.is_available && (
                      <p className="mt-1 text-xs font-medium text-muted" role="alert">
                        No longer available
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2" aria-label={`Quantity for ${line.name}`}>
                    <button
                      onClick={() => setQty(line.menu_item_id, line.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-medium" aria-live="polite">{line.quantity}</span>
                    <button
                      onClick={() => setQty(line.menu_item_id, line.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={line.note}
                    onChange={(e) => setNote(line.menu_item_id, e.target.value)}
                    placeholder="Note e.g. less sugar (optional)"
                    maxLength={120}
                    className="w-full rounded-xl border border-line bg-input px-3 py-2 text-sm outline-none placeholder:text-muted"
                    aria-label={`Note for ${line.name}`}
                  />
                  <button
                    onClick={() => removeLine(line.menu_item_id)}
                    className="shrink-0 text-sm text-muted underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
            <label className="mb-1 block text-sm font-medium" htmlFor="customer-name">
              Name for pickup <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav"
              maxLength={60}
              autoComplete="nickname"
              className="w-full rounded-xl border border-line bg-input px-3 py-2.5 text-sm outline-none placeholder:text-muted"
            />
          </div>

          {submit.kind === 'error' && (
            <p className="mt-3 rounded-xl border border-line bg-surface-elevated p-3 text-sm" role="alert">
              {submit.message}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted">Pay at counter</p>
            <p className="text-lg font-semibold" aria-live="polite">Total {formatCents(totalCents)}</p>
          </div>
          <button
            onClick={placeOrder}
            disabled={submit.kind === 'sending'}
            className="mt-3 w-full rounded-full bg-content py-3.5 text-base font-semibold text-canvas disabled:opacity-50"
          >
            {submit.kind === 'sending' ? 'Placing order…' : 'Place order'}
          </button>
        </>
      )}
    </CustomerLayout>
  );
};
