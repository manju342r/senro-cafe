import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { useCart } from '../../contexts/CartContext';
import { freshKey, placeOrder } from '../../lib/api';
import { inr } from '../../types';

export const CartPage: React.FC = () => {
  const { lines, total, setQty, setNote, remove, clear } = useCart();
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  // Fresh key per page visit: retries reuse it (safe replay), a new visit starts clean.
  const key = React.useRef(freshKey());
  const blocked = lines.filter((l) => !l.available);

  const submit = async () => {
    if (busy || lines.length === 0) return;
    if (blocked.length > 0) {
      setError('Something in your basket just sold out. Remove it to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const order = await placeOrder({
        items: lines.map((l) => ({
          menu_item_id: l.menu_item_id,
          quantity: l.quantity,
          customizations: l.note.trim() ? { note: l.note.trim() } : {},
        })),
        customer_name: name.trim() || undefined,
        idempotency_key: key.current,
      });
      clear();
      navigate(`/orders/${order.tracking_token}`, { replace: true });
    } catch (e) {
      setError(
        e instanceof Error && /unavailable|not_found/.test(e.message)
          ? 'An item just sold out. Review your basket and try again.'
          : 'Order failed. Tapping Place order again is safe — it will not double-charge or duplicate.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <CustomerLayout>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Your basket</h1>

      {lines.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-card p-8 text-center shadow-sm">
          <p className="text-cocoa">Nothing here yet.</p>
          <button
            onClick={() => navigate('/menu')}
            className="mt-3 rounded-full bg-espresso px-5 py-2.5 text-sm font-semibold text-cream"
          >
            See the menu
          </button>
        </div>
      ) : (
        <>
          <ul className="mt-5 space-y-3">
            {lines.map((l) => (
              <li key={l.menu_item_id} className={`rounded-2xl bg-card p-4 shadow-sm ${l.available ? '' : 'opacity-60'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{l.name}</p>
                    <p className="text-sm text-cocoa">{inr(l.unit_price_cents)} each</p>
                    {!l.available && (
                      <p className="text-xs font-semibold text-ember" role="alert">Sold out — please remove</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => setQty(l.menu_item_id, l.quantity - 1)} aria-label="Less"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment">
                      <Minus size={15} />
                    </button>
                    <span className="w-6 text-center font-semibold" aria-live="polite">{l.quantity}</span>
                    <button onClick={() => setQty(l.menu_item_id, l.quantity + 1)} aria-label="More"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment">
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={l.note}
                    onChange={(e) => setNote(l.menu_item_id, e.target.value)}
                    placeholder="Note, e.g. oat milk (optional)"
                    maxLength={120}
                    aria-label={`Note for ${l.name}`}
                    className="w-full rounded-xl bg-cream px-3 py-2 text-sm outline-none placeholder:text-faded focus:ring-2 focus:ring-ember/40"
                  />
                  <button onClick={() => remove(l.menu_item_id)} aria-label={`Remove ${l.name}`}
                    className="shrink-0 rounded-full p-2 text-cocoa hover:text-ember">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <label className="mt-4 block rounded-2xl bg-card p-4 shadow-sm" htmlFor="pickup-name">
            <span className="text-sm font-semibold">Name for pickup <span className="font-normal text-cocoa">(optional)</span></span>
            <input
              id="pickup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Meera"
              maxLength={60}
              autoComplete="nickname"
              className="mt-2 w-full rounded-xl bg-cream px-3 py-2.5 text-sm outline-none placeholder:text-faded focus:ring-2 focus:ring-ember/40"
            />
          </label>

          {error && <p className="mt-3 rounded-xl bg-card p-3 text-sm text-ember-deep" role="alert">{error}</p>}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-cocoa">Pay at the counter</span>
            <span className="font-display text-2xl font-semibold" aria-live="polite">{inr(total)}</span>
          </div>
          <button
            onClick={submit}
            disabled={busy}
            className="mt-2 w-full rounded-full bg-ember py-4 text-base font-bold text-cream disabled:opacity-50"
          >
            {busy ? 'Placing your order…' : 'Place order'}
          </button>
        </>
      )}
    </CustomerLayout>
  );
};
