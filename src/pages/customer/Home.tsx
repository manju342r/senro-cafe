import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeroSlideshow } from '@/components/customer/HeroSlideshow'
import { CAFE } from '@/lib/cafe'

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
}

export function HomePage() {
  return (
    <main>
      {/* Hero — full-bleed sliding imagery, brand-led */}
      <section
        className="relative min-h-[100svh] overflow-hidden"
        aria-label="Maña Katha hero"
      >
        <HeroSlideshow />

        <div className="pointer-events-none relative z-[1] mx-auto flex min-h-[100svh] max-w-5xl flex-col justify-end px-4 pb-24 pt-28 sm:px-6 sm:pb-28 lg:justify-center lg:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3"
          >
            <span className="h-px w-8 bg-leaf sm:w-10" aria-hidden />
            <p className="eyebrow text-leaf/90">Hyderabad’s rooftop café</p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-3xl font-display text-[clamp(3.1rem,8vw+0.6rem,6.5rem)] font-semibold leading-[0.94] tracking-[-0.02em] text-foam text-balance"
          >
            Maña Katha
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-xl font-display text-[clamp(1.45rem,2.2vw+0.75rem,2.15rem)] font-medium leading-snug text-foam/95"
          >
            Let’s begin our <em className="text-leaf italic">story</em>.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32, duration: 0.55 }}
            className="mt-4 max-w-md text-[1.05rem] leading-relaxed text-foam/75"
          >
            Coffee, plates, and evenings above the city in Vanasthalipuram.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto mt-10 flex flex-wrap gap-3"
          >
            <Link to="/menu" className="btn btn-primary min-w-[10rem] uppercase tracking-[0.08em]">
              Explore menu
            </Link>
            <Link
              to="/visit"
              className="btn border border-foam/55 bg-transparent text-foam hover:border-leaf hover:text-leaf min-w-[9.5rem] uppercase tracking-[0.08em]"
            >
              Find us
            </Link>
          </motion.div>
        </div>

        <a
          href="#our-story"
          className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-medium uppercase tracking-[0.28em] text-foam/70 transition hover:text-leaf"
        >
          <span className="hero-scroll-line block h-10 w-px bg-gradient-to-b from-transparent via-leaf to-leaf" />
          Scroll
        </a>
      </section>

      {/* Story */}
      <section id="our-story" className="border-t border-line">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24">
          <motion.p {...fadeUp} className="eyebrow">
            Our story
          </motion.p>
          <motion.h2 {...fadeUp} className="type-page mt-3 text-leaf">
            Idi… MaNa Katha
          </motion.h2>
          <motion.div
            {...fadeUp}
            className="mt-8 space-y-5 text-[1.075rem] leading-relaxed text-steam"
          >
            <p className="text-foam">
              Maña Katha means <em className="font-display text-[1.15em] not-italic text-leaf">our story</em>{' '}
              — a rooftop café in Vanasthalipuram where filter coffee, comfort plates, and long
              conversations share the same table.
            </p>
            <p>
              Known as one of the largest rooftop cafés in Hyderabad, MKC is built for group nights,
              slow evenings, and the first sip that starts everything.
            </p>
            <p>
              Follow along at{' '}
              <a
                href={CAFE.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-leaf transition hover:underline"
              >
                {CAFE.handle}
              </a>{' '}
              — then come up to the roof.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How ordering works */}
      <section className="border-t border-line bg-forest/25">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
          <motion.p {...fadeUp} className="eyebrow">
            Order ahead
          </motion.p>
          <motion.h2 {...fadeUp} className="type-page mt-3 max-w-xl text-leaf">
            From your phone to the floor
          </motion.h2>
          <motion.p {...fadeUp} className="lede mt-4">
            Skip the wait at the counter. We prep while you’re on the way.
          </motion.p>
          <ol className="mt-14 grid gap-10 border-t border-line pt-12 sm:grid-cols-3 sm:gap-8">
            {[
              {
                step: '01',
                title: 'Browse the menu',
                body: 'Pick coffee, plates, shakes — live availability from the floor.',
              },
              {
                step: '02',
                title: 'Place your order',
                body: 'Add your pickup name. We start preparing as soon as you submit.',
              },
              {
                step: '03',
                title: 'Pay at the counter',
                body: 'Walk in when it’s ready. No online payment — settle upstairs.',
              },
            ].map((item, i) => (
              <motion.li
                key={item.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="font-display text-3xl text-leaf/80">{item.step}</p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-foam">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steam">{item.body}</p>
              </motion.li>
            ))}
          </ol>
          <motion.div {...fadeUp} className="mt-14">
            <Link to="/menu" className="btn btn-primary min-w-[10rem]">
              Open menu
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Location */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <motion.p {...fadeUp} className="eyebrow">
              Visit
            </motion.p>
            <motion.h2 {...fadeUp} className="type-page mt-3 text-leaf">
              Above the city in Vanasthalipuram
            </motion.h2>
            <motion.p {...fadeUp} className="mt-5 max-w-md leading-relaxed text-steam">
              {CAFE.addressLines[0]}
              <br />
              {CAFE.addressLines[1]}
            </motion.p>
            <motion.p {...fadeUp} className="mt-3 text-steam">
              <a href={CAFE.phoneHref} className="text-leaf transition hover:underline">
                {CAFE.phone}
              </a>
            </motion.p>
            <motion.div {...fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link to="/visit" className="btn btn-secondary">
                Directions & hours
              </Link>
              <a
                href={CAFE.maps}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost px-2"
              >
                Google Maps →
              </a>
            </motion.div>
          </div>
          <motion.div
            {...fadeUp}
            className="relative min-h-[260px] overflow-hidden border border-line sm:min-h-[320px]"
          >
            <img
              src="/cafe/interior-1.jpg"
              alt="Maña Katha rooftop café interior"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="font-display text-2xl text-foam">5th & 6th floor</p>
              <p className="mt-1 text-sm text-steam">BNR Tower · Panama Godowns</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-4 py-20 sm:px-6 sm:py-24 md:flex-row md:items-end md:justify-between">
          <div>
            <motion.h2 {...fadeUp} className="type-page text-leaf">
              Hungry?
            </motion.h2>
            <motion.p {...fadeUp} className="lede mt-4">
              Browse the full menu and order ahead for pickup.
            </motion.p>
          </div>
          <motion.div {...fadeUp}>
            <Link to="/menu" className="btn btn-primary min-w-[10rem]">
              View menu
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
