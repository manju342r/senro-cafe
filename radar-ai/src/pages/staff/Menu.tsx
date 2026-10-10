import React from 'react';
import { StaffLayout } from '../../layouts/StaffLayout';
import {
  addCategory,
  fetchMenuAdmin,
  saveMenuItem,
  setAvailability,
} from '../../lib/staff';
import { formatCents, type MenuItem } from '../../types/database';

export const StaffMenuPage: React.FC = () => {
  const [cats, setCats] = React.useState<{ id: string; name: string }[]>([]);
  const [items, setItems] = React.useState<MenuItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<Partial<MenuItem> | null>(null);
  const [newCat, setNewCat] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const reload = React.useCallback(() => {
    setLoading(true);
    fetchMenuAdmin()
      .then(({ categories, items: rows }) => {
        setCats(categories);
        setItems(rows);
        setError(null);
      })
      .catch(() => setError('Could not load the menu.'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  const toggle = async (id: string, current: boolean) => {
    try {
      await setAvailability(id, !current);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_available: !current } : i)));
    } catch {
      setError('Availability update failed.');
    }
  };

  const save = async () => {
    if (!editing || !editing.name?.trim() || !((editing.price_cents ?? 0) > 0)) {
      setError('Name and a positive price are required.');
      return;
    }
    setSaving(true);
    try {
      await saveMenuItem({
        ...editing,
        name: editing.name.trim(),
        price_cents: Math.round(editing.price_cents ?? 0),
      });
      setEditing(null);
      setError(null);
      reload();
    } catch {
      setError('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StaffLayout active="/staff/menu">
      <h1 className="mb-4 text-xl font-semibold tracking-tight">Menu management</h1>

      {error && (
        <p className="mb-3 rounded-xl border border-line bg-surface p-3 text-sm" role="alert">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-muted" aria-live="polite">Loading menu…</p>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="New category name"
              maxLength={60}
              className="w-full rounded-xl border border-line bg-input px-3 py-2 text-sm outline-none"
              aria-label="New category name"
            />
            <button
              onClick={() => {
                if (!newCat.trim()) return;
                addCategory(newCat.trim()).then(reload).catch(() => setError('Could not add category.'));
                setNewCat('');
              }}
              className="shrink-0 rounded-full border border-line px-4 py-2 text-sm font-medium"
            >
              Add
            </button>
          </div>

          <button
            onClick={() => setEditing({ name: '', price_cents: 0, prep_time_seconds: 180, is_available: true })}
            className="mb-4 rounded-full bg-content px-4 py-2 text-sm font-medium text-canvas"
          >
            + New item
          </button>

          {editing && (
            <div className="mb-4 rounded-2xl border border-line bg-surface p-4" role="dialog" aria-label="Edit menu item">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Name
                  <input
                    value={editing.name ?? ''}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    maxLength={80}
                    className="mt-1 w-full rounded-xl border border-line bg-input px-3 py-2 font-normal outline-none"
                  />
                </label>
                <label className="text-sm font-medium">
                  Price (₹)
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={editing.price_cents ? editing.price_cents / 100 : ''}
                    onChange={(e) => setEditing({ ...editing, price_cents: Math.round(Number(e.target.value) * 100) })}
                    className="mt-1 w-full rounded-xl border border-line bg-input px-3 py-2 font-normal outline-none"
                  />
                </label>
                <label className="text-sm font-medium">
                  Category
                  <select
                    value={editing.category_id ?? ''}
                    onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                    className="mt-1 w-full rounded-xl border border-line bg-input px-3 py-2 font-normal outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {cats.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Prep seconds
                  <input
                    type="number"
                    min={0}
                    value={editing.prep_time_seconds ?? 180}
                    onChange={(e) => setEditing({ ...editing, prep_time_seconds: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-line bg-input px-3 py-2 font-normal outline-none"
                  />
                </label>
              </div>
              <label className="mt-3 block text-sm font-medium">
                Description
                <textarea
                  value={editing.description ?? ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  maxLength={280}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-line bg-input px-3 py-2 font-normal outline-none"
                />
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-full bg-content px-4 py-2 text-sm font-medium text-canvas disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditing(null)} className="rounded-full border border-line px-4 py-2 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{i.name}</p>
                  <p className="text-sm text-muted">
                    {formatCents(i.price_cents)} · {i.prep_time_seconds}s prep
                    {!i.is_available && ' · unavailable'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setEditing(i)}
                    className="rounded-full border border-line px-3 py-1.5 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggle(i.id, i.is_available)}
                    aria-pressed={i.is_available}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                      i.is_available ? 'bg-content text-canvas' : 'border border-line'
                    }`}
                  >
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
