import { Link } from 'react-router-dom'
import { CAFE, cafeMapEmbedUrl } from '@/lib/cafe'

const HOURS = [
  { day: 'Mon – Thu', time: '12:00 PM – 11:30 PM' },
  { day: 'Friday', time: '12:00 PM – 11:30 PM' },
  { day: 'Sat – Sun', time: '12:00 PM – 11:30 PM' },
]

export function VisitPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="eyebrow">Visit</p>
      <h1 className="type-page mt-3 text-leaf">Find us</h1>
      <p className="lede mt-4">
        Rooftop café in Vanasthalipuram. Walk in, or order ahead and pick up when we ping ready. Pay
        at the counter.
      </p>

      <div className="mt-12 grid gap-10 border-y border-line py-10 sm:grid-cols-2 sm:gap-12">
        <section>
          <h2 className="type-section text-foam">Address</h2>
          <p className="mt-4 leading-relaxed text-steam">
            {CAFE.addressLines[0]}
            <br />
            {CAFE.addressLines[1]}
          </p>
          <a
            href={CAFE.phoneHref}
            className="mt-4 block text-sm text-leaf transition hover:underline"
          >
            {CAFE.phone}
          </a>
          <a
            href={CAFE.maps}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-leaf transition hover:underline"
          >
            Open in Google Maps
          </a>
        </section>
        <section>
          <h2 className="type-section text-foam">Hours</h2>
          <ul className="mt-4 space-y-3 text-steam">
            {HOURS.map((row) => (
              <li key={row.day} className="flex justify-between gap-4 text-sm">
                <span>{row.day}</span>
                <span className="font-medium text-foam">{row.time}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-steam/80">Hours may vary on holidays — check Instagram.</p>
        </section>
      </div>

      <div className="group relative mt-8 overflow-hidden border border-line transition hover:border-leaf/50">
        <iframe
          title="Maña Katha Café on Google Maps"
          src={cafeMapEmbedUrl()}
          className="h-[240px] w-full border-0 sm:h-[300px]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        {/* Captures clicks so the preview opens the real Maps listing */}
        <a
          href={CAFE.maps}
          target="_blank"
          rel="noreferrer"
          className="absolute inset-0 z-10"
          aria-label="Open Maña Katha location in Google Maps"
        >
          <span className="sr-only">Open in Google Maps</span>
        </a>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-ink via-ink/80 to-transparent p-5 pt-16 sm:p-6 sm:pt-20">
          <p className="font-display text-2xl text-foam">Vanasthalipuram, Hyderabad</p>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-steam">
            BNR Tower, Panama Godowns — tap the map for directions.
          </p>
          <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-leaf">
            Open Google Maps
            <span aria-hidden className="transition group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/menu" className="btn btn-primary">
          Order ahead
        </Link>
        <a href={CAFE.instagram} target="_blank" rel="noreferrer" className="btn btn-secondary">
          Instagram {CAFE.handle}
        </a>
      </div>
    </main>
  )
}
