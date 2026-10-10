import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { CAFE } from '@/lib/cafe'

export function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <BrandLogo size="lg" />
        <p className="eyebrow mt-8">Our story</p>
        <h1 className="type-page mt-3 text-leaf">Maña Katha</h1>
      </motion.div>

      <div className="mt-10 space-y-5 text-[1.075rem] leading-relaxed text-steam">
        <p className="text-foam">
          Idi… <em className="font-display text-[1.15em] not-italic text-leaf">MaNa Katha</em> — let’s
          begin our story. A rooftop café in Vanasthalipuram where coffee, plates, and conversations
          share the same table.
        </p>
        <p>
          Known as one of the largest rooftop cafés in Hyderabad, Maña Katha Café (MKC) is built for
          long evenings, group tables, and the first sip that starts the night.
        </p>
        <p>
          You’ll find us at BNR Tower, Panama Godowns — above Mithaiwala. Order ahead on this site,
          follow the floor on Instagram at{' '}
          <a
            href={CAFE.instagram}
            target="_blank"
            rel="noreferrer"
            className="text-leaf transition hover:underline"
          >
            {CAFE.handle}
          </a>
          , and come up to the roof when you’re ready.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/menu" className="btn btn-primary min-w-[9.5rem]">
          View menu
        </Link>
        <Link to="/visit" className="btn btn-secondary">
          Get directions
        </Link>
      </div>
    </main>
  )
}
