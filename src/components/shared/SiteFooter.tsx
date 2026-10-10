import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { CAFE } from '@/lib/cafe'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <BrandLogo size="lg" showWordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-steam">{CAFE.blurb}</p>
        </div>
        <div className="flex flex-wrap gap-10 text-sm">
          <div className="space-y-2.5">
            <p className="eyebrow">Explore</p>
            <Link to="/" className="block text-foam transition hover:text-leaf">
              Home
            </Link>
            <Link to="/menu" className="block text-foam transition hover:text-leaf">
              Menu
            </Link>
            <Link to="/about" className="block text-foam transition hover:text-leaf">
              About
            </Link>
            <Link to="/events" className="block text-foam transition hover:text-leaf">
              Events
            </Link>
            <Link to="/visit" className="block text-foam transition hover:text-leaf">
              Visit
            </Link>
            <button
              type="button"
              className="block text-left text-foam transition hover:text-leaf"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('mana-katha-open-feedback'))
              }}
            >
              Feedback
            </button>
          </div>
          <div className="space-y-2.5">
            <p className="eyebrow">Find us</p>
            <p className="max-w-[16rem] text-foam">
              {CAFE.addressLines[0]}
              <br />
              {CAFE.addressLines[1]}
            </p>
            <a href={CAFE.phoneHref} className="block text-foam transition hover:text-leaf">
              {CAFE.phone}
            </a>
            <a
              href={CAFE.maps}
              target="_blank"
              rel="noreferrer"
              className="block text-foam transition hover:text-leaf"
            >
              Google Maps
            </a>
            <a
              href={CAFE.instagram}
              target="_blank"
              rel="noreferrer"
              className="block text-foam transition hover:text-leaf"
            >
              Instagram {CAFE.handle}
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-line/60 px-4 py-4 text-center text-xs tracking-wide text-steam sm:px-6">
        © {new Date().getFullYear()} Maña Katha Café · {CAFE.city}
      </div>
    </footer>
  )
}
