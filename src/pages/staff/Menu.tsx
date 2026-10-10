import { useMemo, useState } from 'react'
import {
  createMenuItem,
  deleteMenuItem,
  getMenu,
  isAdmin,
  setItemAvailability,
  updateMenuItem,
  updateItemPrice,
} from '@/lib/demoStore'
import { useDemoState } from '@/hooks/useDemo'
import { formatCents, type MenuItem } from '@/types/database'

type Draft = {
  name: string
  category_id: string
  description: string
  price_rupees: string
  prep_minutes: string
  is_available: boolean
}

function emptyDraft(categoryId: string): Draft {
  return {
    name: '',
    category_id: categoryId,
    description: '',
    price_rupees: '',
    prep_minutes: '15',
    is_available: true,
  }
}

function itemToDraft(item: MenuItem): Draft {
  return {
    name: item.name,
    category_id: item.category_id,
    description: item.description,
    price_rupees: String(Math.round(item.price_cents / 100)),
    prep_minutes: String(Math.max(1, Math.round(item.prep_time_seconds / 60))),
    is_available: item.is_available,
  }
}

export function StaffMenuPage() {
  useDemoState()
  const admin = isAdmin()
  const { categories, items } = getMenu()
  const defaultCategory = categories[0]?.id ?? ''

  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(defaultCategory))
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (categories.find((c) => c.id === i.category_id)?.name || '').toLowerCase().includes(q),
    )
  }, [items, categories, query])

  function startCreate() {
    setCreating(true)
    setEditingId(null)
    setDraft(emptyDraft(defaultCategory))
    setError(null)
  }

  function startEdit(item: MenuItem) {
    setCreating(false)
    setEditingId(item.id)
    setDraft(itemToDraft(item))
    setError(null)
  }

  function cancelForm() {
    setCreating(false)
    setEditingId(null)
    setError(null)
  }

  async function saveForm() {
    try {
      setError(null)
      const price = Number(draft.price_rupees)
      const prepMins = Number(draft.prep_minutes)
      if (!Number.isFinite(price) || price <= 0) throw new Error('Enter a valid price in ₹')
      if (!Number.isFinite(prepMins) || prepMins <= 0) throw new Error('Enter prep time in minutes')

      const payload = {
        name: draft.name,
        category_id: draft.category_id,
        description: draft.description,
        price_cents: Math.round(price * 100),
        prep_time_seconds: Math.round(prepMins * 60),
        is_available: draft.is_available,
      }

      if (creating) {
        await createMenuItem(payload)
      } else if (editingId) {
        await updateMenuItem(editingId, payload)
      }
      cancelForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save item')
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-page text-leaf">Menu management</h1>
          <p className="mt-2 text-steam">
            {admin
              ? 'Super admin can add, edit, or remove dishes. Changes save to Supabase and the customer menu.'
              : 'Toggle sold-out and adjust price — saved to Supabase for the live customer menu.'}
          </p>
        </div>
        {admin ? (
          <button type="button" className="btn btn-primary" onClick={startCreate}>
            Add food item
          </button>
        ) : null}
      </div>

      <div className="mt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search menu…"
          className="field max-w-md"
        />
      </div>

      {(creating || editingId) && admin ? (
        <section className="mt-8 border border-line bg-forest/40 p-5">
          <h2 className="type-section text-foam">
            {creating ? 'Add food item' : 'Edit food item'}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-steam sm:col-span-2">
              Name
              <input
                className="field mt-1"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            </label>
            <label className="block text-sm text-steam">
              Category
              <select
                className="field mt-1"
                value={draft.category_id}
                onChange={(e) => setDraft((d) => ({ ...d, category_id: e.target.value }))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-steam">
              Price (₹)
              <input
                type="number"
                min={1}
                className="field mt-1"
                value={draft.price_rupees}
                onChange={(e) => setDraft((d) => ({ ...d, price_rupees: e.target.value }))}
              />
            </label>
            <label className="block text-sm text-steam">
              Prep time (minutes)
              <input
                type="number"
                min={1}
                className="field mt-1"
                value={draft.prep_minutes}
                onChange={(e) => setDraft((d) => ({ ...d, prep_minutes: e.target.value }))}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-steam sm:pt-6">
              <input
                type="checkbox"
                checked={draft.is_available}
                onChange={(e) => setDraft((d) => ({ ...d, is_available: e.target.checked }))}
              />
              Available on customer menu
            </label>
            <label className="block text-sm text-steam sm:col-span-2">
              Description
              <textarea
                className="field mt-1"
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
            </label>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="btn btn-primary" onClick={saveForm}>
              Save item
            </button>
            <button type="button" className="btn btn-secondary" onClick={cancelForm}>
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {filtered.map((item) => {
          const category = categories.find((c) => c.id === item.category_id)?.name ?? '—'
          return (
            <li key={item.id} className="py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="type-section text-foam">{item.name}</p>
                  <p className="mt-1 text-sm text-steam">{category}</p>
                  {item.description ? (
                    <p className="mt-1 max-w-xl text-sm text-steam/90">{item.description}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-steam">
                    {formatCents(item.price_cents)} · ~
                    {Math.max(1, Math.round(item.prep_time_seconds / 60))} min
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!admin ? (
                    <label className="text-sm font-medium text-steam">
                      Price (₹)
                      <input
                        type="number"
                        min={1}
                        step={1}
                        defaultValue={Math.round(item.price_cents / 100)}
                        onBlur={(e) => {
                          const rupees = Number(e.target.value)
                          if (!Number.isFinite(rupees) || rupees <= 0) return
                          void updateItemPrice(item.id, Math.round(rupees * 100)).catch((err) =>
                            setError(err instanceof Error ? err.message : 'Price update failed'),
                          )
                        }}
                        className="field ml-2 inline-block w-24 py-2"
                      />
                    </label>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      void setItemAvailability(item.id, !item.is_available).catch((err) =>
                        setError(err instanceof Error ? err.message : 'Update failed'),
                      )
                    }}
                    className={`btn ${item.is_available ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {item.is_available ? 'Available' : 'Sold out'}
                  </button>
                  {admin ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => startEdit(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost text-clay"
                        onClick={() => {
                          if (confirm(`Remove “${item.name}” from the menu?`)) {
                            void deleteMenuItem(item.id).catch((err) =>
                              setError(err instanceof Error ? err.message : 'Delete failed'),
                            )
                          }
                        }}
                      >
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
