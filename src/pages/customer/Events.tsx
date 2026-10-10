import { useState } from 'react'
import { motion } from 'framer-motion'
import { CAFE } from '@/lib/cafe'
import { CAFE_EVENTS } from '@/lib/events'
import { submitEventBooking, whatsappBookingUrl } from '@/lib/eventBooking'

export function EventsPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [guests, setGuests] = useState('')
  const [occasion, setOccasion] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setDone(false)
    try {
      const guest_count = Number(guests)
      await submitEventBooking({
        name,
        phone,
        email,
        event_date: eventDate || undefined,
        guest_count: Number.isFinite(guest_count) ? guest_count : undefined,
        occasion,
        notes,
      })
      setDone(true)
      setName('')
      setPhone('')
      setEmail('')
      setEventDate('')
      setGuests('')
      setOccasion('')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send booking')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="page-shell">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
        <p className="eyebrow">Customers</p>
        <h1 className="type-page mt-2 text-leaf">Events</h1>
        <p className="mt-3 max-w-xl text-steam">
          Browse nights from{' '}
          <a
            href={CAFE.instagram}
            target="_blank"
            rel="noreferrer"
            className="text-leaf transition hover:underline"
          >
            {CAFE.handle}
          </a>
          , then book your own rooftop event below.
        </p>
        </div>
        <a href="#book-event" className="btn btn-primary">
          Book an event
        </a>
      </motion.div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CAFE_EVENTS.map((event, i) => (
          <motion.li
            key={event.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.35), duration: 0.4 }}
          >
            <a
              href={event.href}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden border border-line bg-forest/40 transition hover:border-leaf/45"
            >
              <div className="aspect-[4/5] overflow-hidden bg-ink">
                <img
                  src={event.image}
                  alt={event.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="border-t border-line px-4 py-3.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-steam">
                  {event.date}
                </p>
                <p className="mt-1 font-display text-xl font-semibold text-foam transition group-hover:text-leaf">
                  {event.title}
                </p>
                <p className="mt-2 text-xs text-steam/80">Open on Instagram →</p>
              </div>
            </a>
          </motion.li>
        ))}
      </ul>

      <section
        id="book-event"
        className="mt-16 scroll-mt-24 border border-leaf/35 bg-forest/40 p-6 sm:p-8"
      >
        <p className="eyebrow text-leaf">Private & group bookings</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-foam sm:text-4xl">
          Book an event
        </h2>
        <p className="mt-3 max-w-2xl text-steam">
          Birthdays, live music nights, office meetups — tell us the date and guest count. Your
          request goes straight to the cafe team. Prefer chat? Use Book on WhatsApp below.
        </p>

        <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={(e) => void onSubmit(e)}>
          <label className="block text-sm text-steam">
            Name <span className="text-leaf">*</span>
            <input
              className="field mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
          <label className="block text-sm text-steam">
            Phone <span className="text-leaf">*</span>
            <input
              className="field mt-1"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              placeholder="+91 …"
            />
          </label>
          <label className="block text-sm text-steam">
            Email
            <input
              className="field mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="block text-sm text-steam">
            Preferred date
            <input
              className="field mt-1"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </label>
          <label className="block text-sm text-steam">
            Guests
            <input
              className="field mt-1"
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="e.g. 40"
            />
          </label>
          <label className="block text-sm text-steam">
            Occasion
            <input
              className="field mt-1"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="Birthday, live music, corporate…"
            />
          </label>
          <label className="block text-sm text-steam sm:col-span-2">
            Notes
            <textarea
              className="field mt-1"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Timing, décor, cake, AV needs…"
            />
          </label>

          {error ? (
            <p className="text-sm text-red-300 sm:col-span-2" role="alert">
              {error}
            </p>
          ) : null}
          {done ? (
            <p className="text-sm text-leaf sm:col-span-2" role="status">
              Booking request sent to Maña Katha. We’ll confirm soon.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Sending…' : 'Submit booking request'}
            </button>
            <a
              className="btn btn-secondary"
              href={whatsappBookingUrl({
                name: name || 'Guest',
                phone: phone || CAFE.phone,
                email,
                event_date: eventDate || undefined,
                guest_count: Number(guests) || undefined,
                occasion,
                notes,
              })}
              target="_blank"
              rel="noreferrer"
            >
              Book on WhatsApp
            </a>
            <a href={CAFE.phoneHref} className="btn btn-ghost">
              Call {CAFE.phone}
            </a>
          </div>
        </form>
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <a href={CAFE.instagram} target="_blank" rel="noreferrer" className="btn btn-secondary">
          Follow {CAFE.handle}
        </a>
      </div>
    </main>
  )
}
