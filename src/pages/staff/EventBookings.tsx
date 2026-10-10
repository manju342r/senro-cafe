import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isAdmin } from '@/lib/demoStore'
import {
  listEventBookings,
  updateEventBookingStatus,
  type EventBooking,
  type EventBookingStatus,
} from '@/lib/eventBooking'

const STATUSES: EventBookingStatus[] = ['new', 'contacted', 'confirmed', 'declined', 'done']

function statusLabel(status: EventBookingStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function StaffEventBookingsPage() {
  const admin = isAdmin()
  const [rows, setRows] = useState<EventBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | EventBookingStatus>('all')

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await listEventBookings())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load bookings')
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

  async function setStatus(id: string, status: EventBookingStatus) {
    try {
      await updateEventBookingStatus(id, status)
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
          <h1 className="type-page mt-2 text-leaf">Event bookings</h1>
          <p className="mt-2 max-w-xl text-steam">
            Requests from the customer Events page. Call or WhatsApp them, then update status.
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
        <p className="mt-8 text-steam">Loading bookings…</p>
      ) : visible.length === 0 ? (
        <p className="mt-8 border border-line bg-forest/40 px-6 py-10 text-steam">
          No event bookings yet. When a customer submits the form on /events, it shows up here.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {visible.map((booking) => (
            <li key={booking.id} className="border border-line bg-forest/40 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold text-foam">{booking.name}</p>
                  <p className="mt-1 text-sm text-steam">
                    {new Date(booking.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <label className="text-sm text-steam">
                  Status
                  <select
                    className="field mt-1 min-w-[9rem]"
                    value={booking.status}
                    onChange={(e) =>
                      void setStatus(booking.id, e.target.value as EventBookingStatus)
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

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-steam">Phone</dt>
                  <dd className="mt-0.5">
                    <a href={`tel:${booking.phone}`} className="text-leaf hover:underline">
                      {booking.phone}
                    </a>
                  </dd>
                </div>
                {booking.email ? (
                  <div>
                    <dt className="text-steam">Email</dt>
                    <dd className="mt-0.5 text-foam">{booking.email}</dd>
                  </div>
                ) : null}
                {booking.event_date ? (
                  <div>
                    <dt className="text-steam">Event date</dt>
                    <dd className="mt-0.5 text-foam">{booking.event_date}</dd>
                  </div>
                ) : null}
                {booking.guest_count ? (
                  <div>
                    <dt className="text-steam">Guests</dt>
                    <dd className="mt-0.5 text-foam">{booking.guest_count}</dd>
                  </div>
                ) : null}
                {booking.occasion ? (
                  <div>
                    <dt className="text-steam">Occasion</dt>
                    <dd className="mt-0.5 text-foam">{booking.occasion}</dd>
                  </div>
                ) : null}
              </dl>

              {booking.notes ? (
                <p className="mt-4 border-t border-line pt-4 text-sm text-steam">{booking.notes}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  className="btn btn-secondary text-sm"
                  href={`https://wa.me/91${booking.phone.replace(/\D/g, '').replace(/^91/, '')}?text=${encodeURIComponent(`Hi ${booking.name}, this is Maña Katha regarding your event booking.`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp customer
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
