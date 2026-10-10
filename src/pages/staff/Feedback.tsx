import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isAdmin } from '@/lib/demoStore'
import {
  listFeedbacks,
  updateFeedbackStatus,
  type Feedback,
  type FeedbackStatus,
} from '@/lib/feedback'

const STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'resolved']

function statusLabel(status: FeedbackStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function StaffFeedbackPage() {
  const admin = isAdmin()
  const [rows, setRows] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | FeedbackStatus>('all')

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await listFeedbacks())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load feedback')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    const id = window.setInterval(() => void reload(), 8000)
    return () => window.clearInterval(id)
  }, [reload])

  if (!admin) {
    return <Navigate to="/staff/orders" replace />
  }

  const visible = filter === 'all' ? rows : rows.filter((r) => r.status === filter)
  const newCount = rows.filter((r) => r.status === 'new').length

  async function setStatus(id: string, status: FeedbackStatus) {
    try {
      await updateFeedbackStatus(id, status)
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Super admin</p>
          <h1 className="type-page mt-2 text-leaf">Feedback</h1>
          <p className="mt-2 max-w-xl text-steam">
            Messages from the customer Feedback button. Mark reviewed when you’ve handled them.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => void reload()}>
          Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className={`chip ${filter === 'all' ? 'chip-active' : 'chip-idle'}`}
          onClick={() => setFilter('all')}
        >
          All ({rows.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip ${filter === s ? 'chip-active' : 'chip-idle'}`}
            onClick={() => setFilter(s)}
          >
            {statusLabel(s)}
            {s === 'new' && newCount ? ` (${newCount})` : ''}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {loading && rows.length === 0 ? (
        <p className="mt-8 text-steam">Loading feedback…</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 border border-line bg-forest/40 px-6 py-10 text-steam">
          No feedback yet. When a guest taps Feedback on the site, it shows up here.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {visible.map((row) => (
            <li key={row.id} className="border border-line bg-forest/40 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold text-foam">{row.name}</p>
                  <p className="mt-1 text-sm text-steam">
                    {new Date(row.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {row.rating != null ? ` · ${row.rating}/5` : ''}
                  </p>
                </div>
                <label className="text-sm text-steam">
                  Status
                  <select
                    className="field mt-1 min-w-[9rem]"
                    value={row.status}
                    onChange={(e) =>
                      void setStatus(row.id, e.target.value as FeedbackStatus)
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <p className="mt-4 text-foam leading-relaxed">{row.message}</p>

              {(row.phone || row.email) && (
                <dl className="mt-4 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
                  {row.phone ? (
                    <div>
                      <dt className="text-steam">Phone</dt>
                      <dd className="mt-0.5">
                        <a href={`tel:${row.phone}`} className="text-leaf hover:underline">
                          {row.phone}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  {row.email ? (
                    <div>
                      <dt className="text-steam">Email</dt>
                      <dd className="mt-0.5 text-foam">{row.email}</dd>
                    </div>
                  ) : null}
                </dl>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
