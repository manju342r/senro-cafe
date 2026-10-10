import React from 'react';
import { StaffLayout } from '../../layouts/StaffLayout';
import { supabase } from '../../lib/supabase';
import { inr, type MenuItem } from '../../types';

export const StaffMenuPage: React.FC = () => {
  const [cats, setCats] = React.useState<{ id: string; name: string }[]>([]);
  const [items, setItems] = React.useState<MenuItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<{ id?: string; name: string; price: string; category_id: string; prep: string; description: string } | null>(null);
  const [newCat, setNewCat] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const reload = React.useCallback(() => {
    (async () => {
      const [{ data: c }, { data: i }] = await Promise.all([
        supabase.from('menu_categories').select('id,name').order('display_order'),
        supabase.from('menu_items').select('*').order('display_order'),
      ]);
      setCats((c ?? []) as { id: string; name: string }[]);
      setItems((i ?? []) as MenuItem[]);
      setError(null);
    })()
      .catch(() => setError('Menu failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const save = async () => {
    if (!draft || !draft.name.trim() || !(Number(draft.price) > 0)) {
      setError('Name and a positive price are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        price_cents: Math.round(Number(draft.price) * 100),
        category_id: draft.category_id || null,
        prep_time_seconds: Math.max(0, Number(draft.prep) || 0),
        description: draft.description || null,
      };
      const { error } = draft.id
        ? await supabase.from('menu_items').update(payload).eq('id', draft.id)
        : await supabase.from('menu_items').insert(payload);
      if (error) throw error;
      setDraft(null);
      reload();
    } catch {
      setError('Save failed — check the connection and retry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StaffLayout active="/staff/menu">
      <h1 className="font-display text-2xl font-semibold">Menu</h1>
      {error && <p className="mt-3 rounded-xl bg-card p-3 text-sm text-ember-deep shadow-sm" role="alert">{error}</p>}
      {loading ? (
        <p className="mt-4 text-sm text-cocoa">Loading…</p>
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category"
              maxLength={60} aria-label="New category name"
              className="w-full rounded-xl bg-card px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-ember/40" />
            <button
              onClick={() => {
                if (!newCat.trim()) return;
                supabase.from('menu_categories').insert({ name: newCat.trim() })
                  .then(({ error }) => (error ? setError('Could not add category.') : (setNewCat(''), reload())));
              }}
              className="shrink-0 rounded-full bg-card px-4 py-2 text-sm font-semibold shadow-sm">
              Add
            </button>
          </div>
          <button
            onClick={() => setDraft({ name: '', price: '', category_id: '', prep: '180', description: '' })}
            className="mt-3 rounded-full bg-ember px-4 py-2 text-sm font-bold text-cream">
            + New item
          </button>

          {draft && (
            <div className="mt-3 grid gap-3 rounded-2xl bg-card p-4 shadow-sm sm:grid-cols-2" role="dialog" aria-label="Edit item">
              <label className="text-sm font-semibold">Name
                <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} maxLength={80}
                  className="mt-1 w-full rounded-xl bg-cream px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-ember/40" />
              </label>
              <label className="text-sm font-semibold">Price (₹)
                <input type="number" min={1} step="any" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-cream px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-ember/40" />
              </label>
              <label className="text-sm font-semibold">Category
                <select value={draft.category_id} onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-cream px-3 py-2 font-normal outline-none">
                  <option value="">Uncategorized</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Prep (seconds)
                <input type="number" min={0} value={draft.prep} onChange={(e) => setDraft({ ...draft, prep: e.target.value })}
                  className="mt-1 w-full rounded-xl bg-cream px-3 py-2 font-normal outline-none" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Description
                <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  maxLength={280} rows={2}
                  className="mt-1 w-full rounded-xl bg-cream px-3 py-2 font-normal outline-none" />
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <button onClick={save} disabled={saving} className="rounded-full bg-espresso px-4 py-2 text-sm font-semibold text-cream disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setDraft(null)} className="rounded-full bg-parchment px-4 py-2 text-sm">Cancel</button>
              </div>
            </div>
          )}

          <ul className="mt-4 space-y-2">
            {items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 rounded-2xl bg-card p-3 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{i.name}</p>
                  <p className="text-sm text-cocoa">{inr(i.price_cents)} · {i.prep_time_seconds}s{i.is_available ? '' : ' · off'}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setDraft({ id: i.id, name: i.name, price: String(i.price_cents / 100), category_id: i.category_id ?? '', prep: String(i.prep_time_seconds), description: i.description ?? '' })}
                    className="rounded-full bg-parchment px-3 py-1.5 text-sm font-semibold">
                    Edit
                  </button>
                  <button
                    aria-pressed={i.is_available}
                    onClick={() =>
                      supabase.from('menu_items').update({ is_available: !i.is_available }).eq('id', i.id)
                        .then(({ error }) => (error
                          ? setError('Toggle failed.')
                          : setItems((prev) => prev.map((x) => (x.id === i.id ? { ...x, is_available: !i.is_available } : x)))))
                    }
                    className={`rounded-full px-3 py-1.5 text-sm font-bold ${i.is_available ? 'bg-leaf text-cream' : 'bg-parchment text-cocoa'}`}>
                    {i.is_available ? 'On' : 'Off'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </StaffLayout>
  );
};
