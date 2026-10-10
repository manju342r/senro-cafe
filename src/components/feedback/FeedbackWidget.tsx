import { useEffect, useId, useState } from 'react'
import { submitFeedback } from '@/lib/feedback'

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const formId = useId()

  useEffect(() => {
    const openPanel = () => {
      setOpen(true)
      setDone(false)
      setError(null)
    }
    const togglePanel = () => {
      setOpen((v) => !v)
      setDone(false)
      setError(null)
    }
    window.addEventListener('mana-katha-open-feedback', openPanel)
    window.addEventListener('mana-katha-toggle-feedback', togglePanel)
    return () => {
      window.removeEventListener('mana-katha-open-feedback', openPanel)
      window.removeEventListener('mana-katha-toggle-feedback', togglePanel)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setDone(false)
    try {
      await submitFeedback({ name, message, rating, phone, email })
      setDone(true)
      setName('')
      setMessage('')
      setPhone('')
      setEmail('')
      setRating(5)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send feedback')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]"
        aria-label="Dismiss feedback"
        onClick={() => setOpen(false)}
      />
      <div className="pointer-events-none absolute right-3 top-[4.25rem] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col sm:right-6 sm:top-[4.75rem]">
        <section
          className="pointer-events-auto border border-line bg-ink/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          role="dialog"
          aria-label="Send feedback"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-xl font-semibold text-leaf">Feedback</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-steam">
                Tell the café team
              </p>
            </div>
            <button
              type="button"
              className="btn btn-ghost px-2 text-sm"
              onClick={() => setOpen(false)}
              aria-label="Close feedback"
            >
              Close
            </button>
          </div>

          <form id={formId} className="mt-4 space-y-3" onSubmit={(e) => void onSubmit(e)}>
            <label className="block text-sm text-steam">
              Name <span className="text-leaf">*</span>
              <input
                className="field mt-1 py-2.5 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>

            <fieldset>
              <legend className="text-sm text-steam">Rating</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`min-h-10 min-w-10 rounded-md border px-2 text-sm font-semibold ${
                      rating === n
                        ? 'border-leaf bg-leaf text-ink'
                        : 'border-line text-steam hover:border-leaf/50'
                    }`}
                    onClick={() => setRating(n)}
                    aria-pressed={rating === n}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block text-sm text-steam">
              Message <span className="text-leaf">*</span>
              <textarea
                className="field mt-1 text-sm"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Food, service, ambience…"
              />
            </label>

            <label className="block text-sm text-steam">
              Phone (optional)
              <input
                className="field mt-1 py-2.5 text-sm"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </label>

            <label className="block text-sm text-steam">
              Email (optional)
              <input
                className="field mt-1 py-2.5 text-sm"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>

            {error ? (
              <p className="text-sm text-red-300" role="alert">
                {error}
              </p>
            ) : null}
            {done ? (
              <p className="text-sm text-leaf" role="status">
                Thanks — your feedback reached the café team.
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send feedback'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
