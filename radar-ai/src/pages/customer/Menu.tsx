import React from 'react';
import { Plus } from 'lucide-react';
import { CustomerLayout } from '../../layouts/CustomerLayout';
import { useCart } from '../../contexts/CartContext';
import { getMenu, type MenuData } from '../../lib/api';
import { inr } from '../../types';

export const MenuPage: React.FC = () => {
  const { add, refresh } = useCart();
  const [data, setData] = React.useState<MenuData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [cat, setCat] = React.useState('all');
  const [flash, setFlash] = React.useState<string | null>(null);

  React.useEffect(() => {
    let live = true;
    getMenu()
      .then((d) => {
        if (!live) return;
        refresh(d.items);
        setData(d);
      })
      .catch(() => live && setError('The menu could not be loaded. Check your connection and retry.'));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = (data?.items ?? []).filter((i) => cat === 'all' || i.category_id === cat);

  return (
    <CustomerLayout>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Good morning.</h1>
      <p className="mt-1 text-sm text-cocoa">Made fresh, priced honestly. Pay at the counter.</p>

      {!data && !error && (
        <div className="mt-6 space-y-3" aria-live="polite">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-parchment" />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl bg-card p-6 text-center shadow-sm" role="alert">
          <p className="text-sm text-cocoa">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-full bg-espresso px-5 py-2 text-sm font-semibold text-cream"
          >
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          {data.items.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-card p-6 text-center text-sm text-cocoa">
              The menu is empty right now — check back soon.
            </p>
          ) : (
            <>
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Categories">
                {[{ id: 'all', name: 'Everything' }, ...data.categories].map((c) => (
                  <button
                    key={c.id}
                    role="tab"
                    aria-selected={cat === c.id}
                    onClick={() => setCat(c.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                      cat === c.id ? 'bg-espresso text-cream' : 'bg-card text-cocoa shadow-sm'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <ul className="mt-3 space-y-3">
                {shown.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 shadow-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.name}</p>
                      {item.description && <p className="mt-0.5 line-clamp-2 text-sm text-cocoa">{item.description}</p>}
                      <p className="mt-1 font-display text-lg font-semibold text-ember">{inr(item.price_cents)}</p>
                    </div>
                    <button
                      onClick={() => {
                        add(item);
                        setFlash(item.id);
                        window.setTimeout(() => setFlash((f) => (f === item.id ? null : f)), 1000);
                      }}
                      aria-label={`Add ${item.name} to basket`}
                      className="flex shrink-0 items-center gap-1 rounded-full bg-espresso px-4 py-2.5 text-sm font-semibold text-cream active:scale-95"
                    >
                      <Plus size={15} /> {flash === item.id ? 'Added' : 'Add'}
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
