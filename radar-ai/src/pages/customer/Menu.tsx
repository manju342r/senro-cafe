import React from 'react';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { useCart } from '../../contexts/CartContext';
import { fetchMenu, type MenuResponse } from '../../lib/orders';
import { formatCents } from '../../types/database';

type State = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: MenuResponse };

export const MenuPage: React.FC = () => {
  const { addItem, syncAvailability } = useCart();
  const [state, setState] = React.useState<State>({ kind: 'loading' });
  const [category, setCategory] = React.useState<string>('all');
  const [addedId, setAddedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let live = true;
    fetchMenu()
      .then((data) => {
        if (!live) return;
        syncAvailability(data.items);
        setState({ kind: 'ready', data });
      })
      .catch(() => {
        if (live) setState({ kind: 'error', message: 'Could not load the menu. Check your connection and retry.' });
      });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = (id: string, item: MenuResponse['items'][number]) => {
    addItem(item);
    setAddedId(id);
    window.setTimeout(() => setAddedId((cur) => (cur === id ? null : cur)), 1200);
  };

  return (
    <CustomerLayout title="Menu">
      {state.kind === 'loading' && (
        <div className="space-y-3" aria-live="polite">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-elevated" />
          ))}
          <p className="text-sm text-muted">Loading the menu…</p>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center" role="alert">
          <p className="mb-4 text-sm text-muted">{state.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-content px-5 py-2.5 text-sm font-medium text-canvas"
          >
            Retry
          </button>
        </div>
      )}

      {state.kind === 'ready' && (
        <>
          {state.data.items.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center">
              <p className="text-sm text-muted">The menu is empty right now. Please check back soon.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Menu categories">
                <button
                  role="tab"
                  aria-selected={category === 'all'}
                  onClick={() => setCategory('all')}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                    category === 'all' ? 'bg-content text-canvas' : 'border border-line bg-surface'
                  }`}
                >
                  All
                </button>
                {state.data.categories.map((c) => (
                  <button
                    key={c.id}
                    role="tab"
                    aria-selected={category === c.id}
                    onClick={() => setCategory(c.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                      category === c.id ? 'bg-content text-canvas' : 'border border-line bg-surface'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              <ul className="space-y-3">
                {state.data.items
                  .filter((i) => category === 'all' || i.category_id === category)
                  .map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        {item.description && (
                          <p className="mt-0.5 line-clamp-2 text-sm text-muted">{item.description}</p>
                        )}
                        <p className="mt-1 text-sm font-semibold">{formatCents(item.price_cents)}</p>
                      </div>
                      <button
                        onClick={() => handleAdd(item.id, item)}
                        className="shrink-0 rounded-full bg-content px-4 py-2 text-sm font-medium text-canvas active:scale-95"
                        aria-label={`Add ${item.name} to cart`}
                      >
                        {addedId === item.id ? 'Added ✓' : 'Add'}
                      </button>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </>
      )}
    </CustomerLayout>
  );
};
